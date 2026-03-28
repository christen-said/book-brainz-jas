import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, author, startPage, endPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiCall = async (messages: any[]) => {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
      });
      if (!resp.ok) {
        if (resp.status === 429) throw { status: 429, message: "Too many requests, try again in a sec." };
        if (resp.status === 402) throw { status: 402, message: "AI credits ran out." };
        throw new Error("AI gateway error: " + resp.status);
      }
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "";
    };

    // Step 1: Correct spelling
    const correctionRaw = await aiCall([
      {
        role: "system",
        content: `You are a book title and author spelling corrector. A kid is typing in a book title and author name and might have typos or misspellings. Your job is to figure out the correct book title and author name.

If the input is already correct or you can't identify a real book, return the input as-is.

Return ONLY a JSON object with three fields: "title", "author", and "recognized" (boolean - true if you recognize this as a real book). No extra text, no markdown, no code blocks. Just the raw JSON.

Examples:
Input: "Percy Jacson" by "Rick Riordun" → {"title":"Percy Jackson","author":"Rick Riordan","recognized":true}
Input: "Diary of a Whimpy Kid" by "Jeff Kiney" → {"title":"Diary of a Wimpy Kid","author":"Jeff Kinney","recognized":true}
Input: "My Random Story" by "Unknown Author" → {"title":"My Random Story","author":"Unknown Author","recognized":false}`,
      },
      { role: "user", content: `Correct the spelling: "${title}" by ${author}` },
    ]);

    let correctedTitle = title;
    let correctedAuthor = author;
    let wasFixed = false;
    let recognized = false;

    try {
      const cleaned = correctionRaw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.title && parsed.author) {
        wasFixed = parsed.title.toLowerCase() !== title.toLowerCase() || parsed.author.toLowerCase() !== author.toLowerCase();
        correctedTitle = parsed.title;
        correctedAuthor = parsed.author;
        recognized = parsed.recognized === true;
      }
    } catch {
      console.error("Failed to parse correction response:", correctionRaw);
    }

    // Step 2: Generate reflection prompts (2 free-text)
    const promptsRaw = await aiCall([
      {
        role: "system",
        content: `You generate 2 reading reflection questions for a kid (ages 8-14) who just read part of a book. The tone should be casual and chill — not overly enthusiastic or teacherly. Think "older sibling asking about your book" energy.

If you recognize the book, make the questions specific to that book's characters, plot, world, or themes. Reference character names, events, or settings when possible.

If you don't recognize the book, generate thoughtful but generic reading comprehension questions.

Return EXACTLY 2 questions, one per line, no numbering, no bullet points, no extra text. Just the 2 questions separated by newlines.`,
      },
      {
        role: "user",
        content: `Generate 2 reading questions for someone reading "${correctedTitle}" by ${correctedAuthor} (pages ${startPage || '?'} to ${endPage || '?'}).`,
      },
    ]);

    const prompts = promptsRaw.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0).slice(0, 2);

    // Step 3: If recognized, generate a multiple-choice content question about those pages
    let mcQuestion: any = null;
    if (recognized && startPage && endPage) {
      try {
        const mcRaw = await aiCall([
          {
            role: "system",
            content: `You create a single multiple-choice question about a specific section of a book for a kid reader (ages 8-14). The question should test whether the kid actually read and understood pages ${startPage} to ${endPage}.

The question should be about specific plot events, character actions, or details from that section of the book. Keep the tone chill and not too formal.

Return ONLY a JSON object with these fields:
- "question": the question text
- "options": array of exactly 4 answer choices (strings)
- "correctIndex": the index (0-3) of the correct answer

No extra text, no markdown, no code blocks. Just the raw JSON.`,
          },
          {
            role: "user",
            content: `Create a multiple-choice question about pages ${startPage}-${endPage} of "${correctedTitle}" by ${correctedAuthor}.`,
          },
        ]);

        const cleanedMc = mcRaw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsedMc = JSON.parse(cleanedMc);
        if (parsedMc.question && parsedMc.options?.length === 4 && typeof parsedMc.correctIndex === "number") {
          mcQuestion = parsedMc;
        }
      } catch (e) {
        console.error("Failed to generate MC question:", e);
      }
    }

    return new Response(JSON.stringify({
      prompts,
      correctedTitle,
      correctedAuthor,
      wasFixed,
      recognized,
      mcQuestion,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const status = e?.status || 500;
    const message = e?.message || (e instanceof Error ? e.message : "Unknown error");
    console.error("book-prompts error:", e);
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
