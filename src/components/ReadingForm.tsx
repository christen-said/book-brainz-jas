import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { saveEntry, getRandomPrompts, type ReadingEntry } from "@/lib/readingLog";
import { ChevronRight, Check, Loader2, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import BookCover from "./BookCover";
import ReadingTimer from "./ReadingTimer";
import { resetTimer } from "@/lib/timerStore";

interface MCQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface ReadingFormProps {
  onSave: () => void;
}

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Match sentence-ending punctuation followed by space or end
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.length;
}

export default function ReadingForm({ onSave }: ReadingFormProps) {
  const [step, setStep] = useState<"book" | "prompts" | "done">("book");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [minutesRead, setMinutesRead] = useState<string>("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [funFact, setFunFact] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);
  const { toast } = useToast();

  const [correction, setCorrection] = useState<{ title: string; author: string } | null>(null);

  // MC question state
  const [mcQuestion, setMcQuestion] = useState<MCQuestion | null>(null);
  const [mcSelectedIndex, setMcSelectedIndex] = useState<number | null>(null);
  const [mcAnswered, setMcAnswered] = useState(false);
  const [mcCorrect, setMcCorrect] = useState(false);

  const fetchBookPrompts = async (bookTitle: string, bookAuthor: string) => {
    setLoadingPrompts(true);
    setCorrection(null);
    setMcQuestion(null);
    setMcSelectedIndex(null);
    setMcAnswered(false);
    setMcCorrect(false);
    try {
      const { data, error } = await supabase.functions.invoke("book-prompts", {
        body: { title: bookTitle, author: bookAuthor, startPage: parseInt(startPage), endPage: parseInt(endPage) },
      });
      if (error) throw error;
      if (data?.wasFixed && data.correctedTitle && data.correctedAuthor) {
        setCorrection({ title: data.correctedTitle, author: data.correctedAuthor });
      }
      if (data?.prompts?.length >= 2) {
        setPrompts(data.prompts);
      } else {
        setPrompts(getRandomPrompts(2));
      }
      if (data?.mcQuestion) {
        setMcQuestion(data.mcQuestion);
      }
    } catch (e) {
      console.error("Book prompts error:", e);
      setPrompts(getRandomPrompts(2));
    }
    setLoadingPrompts(false);
  };

  const fetchFunFact = async (bookTitle: string, bookAuthor: string) => {
    setLoadingFact(true);
    try {
      const { data, error } = await supabase.functions.invoke("fun-fact", {
        body: { title: bookTitle, author: bookAuthor },
      });
      if (error) throw error;
      setFunFact(data?.funFact || "Books have been around for like 5,000 years. You'd think we'd be done by now.");
    } catch (e) {
      console.error("Fun fact error:", e);
      setFunFact("Fun fact: your brain literally grows new connections when you read. So... you're welcome, brain.");
    }
    setLoadingFact(false);
  };

  const handleBookSubmit = () => {
    if (!title || !author || !startPage || !endPage) return;
    fetchBookPrompts(title, author);
    setStep("prompts");
  };

  const handleMcAnswer = (index: number) => {
    if (mcAnswered && mcCorrect) return; // already correct
    setMcSelectedIndex(index);
    setMcAnswered(true);
    setMcCorrect(index === mcQuestion?.correctIndex);
  };

  // Validate free text: 2+ sentences
  const isResponseValid = (text: string) => countSentences(text) >= 2;

  const allFreeTextValid = () => {
    const filledCount = prompts.filter((_, i) => isResponseValid(responses[i] || "")).length;
    return filledCount >= 2;
  };

  const canSubmit = () => {
    const freeTextOk = allFreeTextValid();
    const mcOk = !mcQuestion || mcCorrect;
    return freeTextOk && mcOk && !saving;
  };

  const handlePromptSubmit = async () => {
    if (!canSubmit()) return;

    setSaving(true);
    try {
      const cleanResponses = prompts.map((_, i) => responses[i] || "");
      // Include MC question/answer in prompts/responses for the saved entry
      const allPrompts = mcQuestion ? [...prompts, `[MC] ${mcQuestion.question}`] : [...prompts];
      const allResponses = mcQuestion
        ? [...cleanResponses, mcQuestion.options[mcQuestion.correctIndex]]
        : [...cleanResponses];

      const entry: ReadingEntry = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString('en-CA'),
        title,
        author,
        startPage: parseInt(startPage),
        endPage: parseInt(endPage),
        prompts: allPrompts,
        responses: allResponses,
        minutesRead: minutesRead ? Math.max(0, parseInt(minutesRead)) : null,
      };
      await saveEntry(entry);
      resetTimer();
      setStep("done");
      onSave();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 } }), 300);
      fetchFunFact(title, author);
    } catch (e: any) {
      toast({ title: "Welp, that broke 💀", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setStartPage("");
    setEndPage("");
    setMinutesRead("");
    setResponses([]);
    setPrompts([]);
    setFunFact(null);
    setCorrection(null);
    setMcQuestion(null);
    setMcSelectedIndex(null);
    setMcAnswered(false);
    setMcCorrect(false);
    setStep("book");
  };

  const acceptCorrection = () => {
    if (correction) {
      setTitle(correction.title);
      setAuthor(correction.author);
      setCorrection(null);
    }
  };

  const dismissCorrection = () => {
    setCorrection(null);
  };

  if (step === "done") {
    return (
      <Card className="p-8 text-center funky-border bg-card">
        <div className="text-7xl mb-4 animate-pop-in">😮‍💨</div>
        <div className="flex justify-center mb-4">
          <BookCover title={title} author={author} fallbackEmoji="📖" size={64} />
        </div>
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">Ok, that's done.</h3>
        <p className="text-muted-foreground mb-6">Look at you, being all responsible and stuff. 👏</p>

        <div className="mb-6 p-4 rounded-2xl bg-primary/10 border-2 border-primary/30 text-left">
          <p className="text-xs font-display font-bold text-primary uppercase tracking-wide mb-2">🤔 random fun fact tho...</p>
          {loadingFact ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> thinking...
            </div>
          ) : (
            <p className="text-sm text-foreground font-medium">{funFact}</p>
          )}
        </div>

        <Button onClick={resetForm} size="lg" className="rounded-xl font-display font-bold funky-shadow">
          Ugh, Do Another One 🫠
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {step === "book" && (
        <Card className="p-6 funky-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl rotate-[-5deg]">
              📖
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">What book is it this time? 🙄</h3>
              <p className="text-sm text-muted-foreground">Just fill it out, it'll be over soon.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-foreground mb-1 block font-display">Book Title</label>
              <Input placeholder="e.g., Percy Jackson" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary/30 rounded-xl border-2" />
            </div>
            <div>
              <label className="text-sm font-bold text-foreground mb-1 block font-display">Author</label>
              <Input placeholder="e.g., Rick Riordan" value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-secondary/30 rounded-xl border-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block font-display">Start Page</label>
                <Input type="number" placeholder="1" value={startPage} onChange={(e) => setStartPage(e.target.value)} className="bg-secondary/30 rounded-xl border-2" />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block font-display">End Page</label>
                <Input type="number" placeholder="25" value={endPage} onChange={(e) => setEndPage(e.target.value)} className="bg-secondary/30 rounded-xl border-2" />
              </div>
            </div>
            <Button onClick={handleBookSubmit} className="w-full rounded-xl font-display font-bold funky-shadow" size="lg" disabled={!title || !author || !startPage || !endPage}>
              Next: The Questions Part 😩 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {step === "prompts" && (
        <Card className="p-6 funky-border bg-card" style={{ borderColor: 'hsl(var(--accent))' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center text-2xl rotate-[5deg]">
              💭
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Almost done, promise. 🤞</h3>
              <p className="text-sm text-muted-foreground">Answer the questions below. Write at least 2 sentences each!</p>
            </div>
          </div>

          {correction && (
            <div className="mb-4 p-3 rounded-xl bg-accent/15 border-2 border-accent/30">
              <p className="text-sm font-display font-bold text-foreground mb-2">✨ Did you mean...?</p>
              <p className="text-sm text-foreground mb-3">
                <span className="font-bold">{correction.title}</span> by <span className="font-bold">{correction.author}</span>
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={acceptCorrection} className="rounded-lg font-display font-bold text-xs">
                  Yep, that's it 👍
                </Button>
                <Button size="sm" variant="outline" onClick={dismissCorrection} className="rounded-lg font-display font-bold text-xs">
                  Nah, I spelled it right
                </Button>
              </div>
            </div>
          )}

          {loadingPrompts ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-display font-bold">Coming up with questions about your book...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Multiple Choice Question */}
              {mcQuestion && (
                <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/30 space-y-3">
                  <label className="text-sm font-bold text-foreground block font-display">
                    🎯 {mcQuestion.question}
                  </label>
                  <div className="grid gap-2">
                    {mcQuestion.options.map((option, i) => {
                      let optionStyle = "bg-secondary/50 border-2 border-border hover:border-primary/50";
                      if (mcAnswered && i === mcSelectedIndex) {
                        optionStyle = mcCorrect
                          ? "bg-green-100 border-2 border-green-500 dark:bg-green-900/30"
                          : "bg-red-100 border-2 border-red-500 dark:bg-red-900/30";
                      }
                      if (mcAnswered && !mcCorrect && i === mcQuestion.correctIndex) {
                        // Don't reveal the correct answer on wrong attempt
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleMcAnswer(i)}
                          disabled={mcCorrect}
                          className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all ${optionStyle} ${mcCorrect ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <span className="font-display font-bold mr-2 text-muted-foreground">
                            {["A", "B", "C", "D"][i]}.
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {mcAnswered && !mcCorrect && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-display font-bold">
                      <X className="w-4 h-4" /> Not quite — try again! 🤔
                    </div>
                  )}
                  {mcAnswered && mcCorrect && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-display font-bold">
                      <Check className="w-4 h-4" /> Nailed it! 🎉
                    </div>
                  )}
                </div>
              )}

              {/* Free Text Prompts */}
              {prompts.map((prompt, i) => {
                const response = responses[i] || "";
                const sentences = countSentences(response);
                const valid = isResponseValid(response);
                const hasContent = response.trim().length > 0;

                return (
                  <div key={i} className="space-y-2">
                    <label className="text-sm font-bold text-foreground block font-display">
                      {["🅰️", "🅱️"][i]} {prompt}
                    </label>
                    <Textarea
                      placeholder="Write at least 2 complete sentences..."
                      value={response}
                      onChange={(e) => {
                        const newResponses = [...responses];
                        newResponses[i] = e.target.value;
                        setResponses(newResponses);
                      }}
                      className="bg-secondary/30 min-h-[80px] rounded-xl border-2"
                    />
                    {hasContent && (
                      <div className={`flex items-center gap-1.5 text-xs font-display font-bold ${valid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                        {valid ? (
                          <><Check className="w-3 h-3" /> {sentences} sentences — nice! ✓</>
                        ) : (
                          <><AlertCircle className="w-3 h-3" /> {sentences}/2 sentences — keep going!</>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("book")} className="flex-1 rounded-xl font-display font-bold">
                  ← Back
                </Button>
                <Button
                  onClick={handlePromptSubmit}
                  className="flex-1 rounded-xl font-display font-bold funky-shadow"
                  size="lg"
                  disabled={!canSubmit()}
                >
                  <Check className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Finally Done ✅"}
                </Button>
              </div>

              {!canSubmit() && !saving && (
                <div className="text-xs text-muted-foreground font-display text-center space-y-1">
                  {mcQuestion && !mcCorrect && <p>🎯 Answer the multiple choice question correctly</p>}
                  {!allFreeTextValid() && <p>✏️ Write at least 2 complete sentences per answer</p>}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
