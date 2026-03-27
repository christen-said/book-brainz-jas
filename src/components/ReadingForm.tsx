import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { saveEntry, getRandomPrompts, type ReadingEntry } from "@/lib/readingLog";
import { ChevronRight, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

interface ReadingFormProps {
  onSave: () => void;
}

export default function ReadingForm({ onSave }: ReadingFormProps) {
  const [step, setStep] = useState<"book" | "prompts" | "done">("book");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [funFact, setFunFact] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);
  const { toast } = useToast();

  const [correction, setCorrection] = useState<{ title: string; author: string } | null>(null);

  const fetchBookPrompts = async (bookTitle: string, bookAuthor: string) => {
    setLoadingPrompts(true);
    setCorrection(null);
    try {
      const { data, error } = await supabase.functions.invoke("book-prompts", {
        body: { title: bookTitle, author: bookAuthor },
      });
      if (error) throw error;
      if (data?.wasFixed && data.correctedTitle && data.correctedAuthor) {
        setCorrection({ title: data.correctedTitle, author: data.correctedAuthor });
      }
      if (data?.prompts?.length >= 3) {
        setPrompts(data.prompts);
      } else {
        setPrompts(getRandomPrompts(3));
      }
    } catch (e) {
      console.error("Book prompts error:", e);
      setPrompts(getRandomPrompts(3));
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

  const handlePromptSubmit = async () => {
    const filledResponses = responses.filter((r) => r.trim().length > 0);
    if (filledResponses.length < 2) return;

    setSaving(true);
    try {
      const entry: ReadingEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        title,
        author,
        startPage: parseInt(startPage),
        endPage: parseInt(endPage),
        prompts,
        responses,
      };
      await saveEntry(entry);
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
    setResponses([]);
    setPrompts([]);
    setFunFact(null);
    setCorrection(null);
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
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">Ok, that's done.</h3>
        <p className="text-muted-foreground mb-6">Look at you, being all responsible and stuff. 👏</p>
        
        {/* Fun Fact */}
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
              <p className="text-sm text-muted-foreground">Answer at least 2. You can do this in your sleep.</p>
            </div>
          </div>

          {loadingPrompts ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-display font-bold">Coming up with questions about your book...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {prompts.map((prompt, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-sm font-bold text-foreground block font-display">
                    {["🅰️", "🅱️", "🆒"][i]} {prompt}
                  </label>
                  <Textarea
                    placeholder="Whatever comes to mind..."
                    value={responses[i] || ""}
                    onChange={(e) => {
                      const newResponses = [...responses];
                      newResponses[i] = e.target.value;
                      setResponses(newResponses);
                    }}
                    className="bg-secondary/30 min-h-[80px] rounded-xl border-2"
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("book")} className="flex-1 rounded-xl font-display font-bold">
                  ← Back
                </Button>
                <Button
                  onClick={handlePromptSubmit}
                  className="flex-1 rounded-xl font-display font-bold funky-shadow"
                  size="lg"
                  disabled={responses.filter((r) => r?.trim().length > 0).length < 2 || saving}
                >
                  <Check className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Finally Done ✅"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
