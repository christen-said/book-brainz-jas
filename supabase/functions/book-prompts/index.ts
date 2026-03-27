import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, author } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Correct spelling of title and author
    const correctionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a book title and author spelling corrector. A kid is typing in a book title and author name and might have typos or misspellings. Your job is to figure out the correct book title and author name.

If the input is already correct or you can't identify a real book, return the input as-is.

Return ONLY a JSON object with two fields: "title" and "author". No extra text, no markdown, no code blocks. Just the raw JSON.

Examples:
Input: "Percy Jacson" by "Rick Riordun" → {"title":"Percy Jackson","author":"Rick Riordan"}
Input: "Diary of a Whimpy Kid" by "Jeff Kiney" → {"title":"Diary of a Wimpy Kid","author":"Jeff Kinney"}
Input: "Some Random Book" by "Unknown Author" → {"title":"Some Random Book","author":"Unknown Author"}`,
          },
          {
            role: "user",
            content: `Correct the spelling: "${title}" by ${author}`,
          },
        ],
      }),
    });

    let correctedTitle = title;
    let correctedAuthor = author;
    let wasFixed = false;

    if (correctionResponse.ok) {
      const correctionData = await correctionResponse.json();
      const raw = correctionData.choices?.[0]?.message?.content || "";
      try {
        // Strip markdown code blocks if present
        const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.title && parsed.author) {
          wasFixed = parsed.title.toLowerCase() !== title.toLowerCase() || parsed.author.toLowerCase() !== author.toLowerCase();
          correctedTitle = parsed.title;
          correctedAuthor = parsed.author;
        }
      } catch {
        console.error("Failed to parse correction response:", raw);
      }
    }

    // Step 2: Generate prompts using the corrected title/author
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You generate 3 reading reflection questions for a kid (ages 8-14) who just read part of a book. The tone should be casual and chill — not overly enthusiastic or teacherly. Think "older sibling asking about your book" energy.

If you recognize the book, make the questions specific to that book's characters, plot, world, or themes. Reference character names, events, or settings when possible.

If you don't recognize the book, generate thoughtful but generic reading comprehension questions.

Return EXACTLY 3 questions, one per line, no numbering, no bullet points, no extra text. Just the 3 questions separated by newlines.`,
          },
          {
            role: "user",
            content: `Generate 3 reading questions for someone reading "${correctedTitle}" by ${correctedAuthor}.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests, try again in a sec." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits ran out." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const prompts = content.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0).slice(0, 3);

    return new Response(JSON.stringify({
      prompts,
      correctedTitle,
      correctedAuthor,
      wasFixed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("book-prompts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
