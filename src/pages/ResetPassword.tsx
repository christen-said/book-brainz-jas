import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      // Supabase will handle the session from the hash
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Oops! 😬", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated! 🎉", description: "You're all set." });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 funky-border bg-card">
        <h2 className="font-display font-bold text-xl text-foreground text-center mb-4">New Password 🔑</h2>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-foreground mb-1 block font-display">New Password</label>
            <Input type="password" placeholder="Make it strong! 💪" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary/30 rounded-xl border-2" required minLength={6} />
          </div>
          <Button type="submit" className="w-full rounded-xl font-display font-bold funky-shadow" size="lg" disabled={loading}>
            {loading ? "Updating..." : "Set New Password ✅"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
