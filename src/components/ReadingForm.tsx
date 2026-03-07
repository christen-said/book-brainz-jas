import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { saveEntry, getRandomPrompts, type ReadingEntry } from "@/lib/readingLog";
import { BookOpen, ChevronRight, Check, Sparkles } from "lucide-react";

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

  useEffect(() => {
    setPrompts(getRandomPrompts(3));
  }, []);

  const handleBookSubmit = () => {
    if (!title || !author || !startPage || !endPage) return;
    setStep("prompts");
  };

  const handlePromptSubmit = () => {
    const filledResponses = responses.filter((r) => r.trim().length > 0);
    if (filledResponses.length < 2) return; // Need at least 2 responses

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
    saveEntry(entry);
    setStep("done");
    onSave();
  };

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setStartPage("");
    setEndPage("");
    setResponses([]);
    setPrompts(getRandomPrompts(3));
    setStep("book");
  };

  if (step === "done") {
    return (
      <Card className="p-8 text-center border-2 border-primary/20 bg-card">
        <div className="text-6xl mb-4 animate-pop-in">🎉</div>
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">Great job!</h3>
        <p className="text-muted-foreground mb-6">Your reading log is saved. Keep up the amazing work!</p>
        <Button onClick={resetForm} size="lg">
          Log Another Reading
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {step === "book" && (
        <Card className="p-6 border-2 border-primary/20 bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">What did you read today?</h3>
              <p className="text-sm text-muted-foreground">Tell us about your book!</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Book Title</label>
              <Input placeholder="e.g., Percy Jackson" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Author</label>
              <Input placeholder="e.g., Rick Riordan" value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Start Page</label>
                <Input type="number" placeholder="1" value={startPage} onChange={(e) => setStartPage(e.target.value)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">End Page</label>
                <Input type="number" placeholder="25" value={endPage} onChange={(e) => setEndPage(e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
            <Button onClick={handleBookSubmit} className="w-full" size="lg" disabled={!title || !author || !startPage || !endPage}>
              Next: Answer Prompts <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {step === "prompts" && (
        <Card className="p-6 border-2 border-accent/20 bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Time to reflect!</h3>
              <p className="text-sm text-muted-foreground">Answer at least 2 of these questions about your reading.</p>
            </div>
          </div>
          <div className="space-y-5">
            {prompts.map((prompt, i) => (
              <div key={i} className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  {i + 1}. {prompt}
                </label>
                <Textarea
                  placeholder="Write your answer here..."
                  value={responses[i] || ""}
                  onChange={(e) => {
                    const newResponses = [...responses];
                    newResponses[i] = e.target.value;
                    setResponses(newResponses);
                  }}
                  className="bg-secondary/50 min-h-[80px]"
                />
              </div>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("book")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handlePromptSubmit}
                className="flex-1"
                size="lg"
                disabled={responses.filter((r) => r?.trim().length > 0).length < 2}
              >
                <Check className="w-4 h-4 mr-1" /> Save Entry
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
