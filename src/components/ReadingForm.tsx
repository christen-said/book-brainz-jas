import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { saveEntry, getRandomPrompts, type ReadingEntry } from "@/lib/readingLog";
import { ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    setPrompts(getRandomPrompts(3));
  }, []);

  const handleBookSubmit = () => {
    if (!title || !author || !startPage || !endPage) return;
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
    } catch (e: any) {
      toast({ title: "Error saving 😬", description: e.message, variant: "destructive" });
    }
    setSaving(false);
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
      <Card className="p-8 text-center funky-border bg-card">
        <div className="text-7xl mb-4 animate-pop-in">🥳</div>
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">YESSS! Nailed it!</h3>
        <p className="text-muted-foreground mb-6">Your brain just leveled up. No big deal. 😎</p>
        <Button onClick={resetForm} size="lg" className="rounded-xl font-display font-bold funky-shadow">
          Do It Again 🔥
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
              <h3 className="font-display font-bold text-lg text-foreground">Whatcha reading? 👀</h3>
              <p className="text-sm text-muted-foreground">Spill the tea on your book!</p>
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
              Next: Brain Time 🧠 <ChevronRight className="w-4 h-4 ml-1" />
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
              <h3 className="font-display font-bold text-lg text-foreground">Big brain time! 🤯</h3>
              <p className="text-sm text-muted-foreground">Answer at least 2. You got this!</p>
            </div>
          </div>
          <div className="space-y-5">
            {prompts.map((prompt, i) => (
              <div key={i} className="space-y-2">
                <label className="text-sm font-bold text-foreground block font-display">
                  {["🅰️", "🅱️", "🆒"][i]} {prompt}
                </label>
                <Textarea
                  placeholder="Drop your thoughts here..."
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
                <Check className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Lock It In 🔒"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
