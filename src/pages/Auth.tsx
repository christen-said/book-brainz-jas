import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Nope 😬", description: error.message, variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split("@")[0] },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "That didn't work 😬", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email 📧", description: "We sent you a confirmation link." });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Hmm 😬", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email 📧", description: "Password reset link sent." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-5xl shadow-md mx-auto mb-4 rotate-[-6deg] hover:rotate-[6deg] transition-transform duration-300">
            😑
          </div>
          <h1 className="text-3xl font-display font-extrabold text-foreground">Book Brainz</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            ugh, fine. let's do this. 📖
          </p>
        </div>

        <Card className="p-6 funky-border bg-card">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="font-display font-bold text-xl text-foreground text-center">Oh, you're back. 👋</h2>
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block font-display">Email</label>
                <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary/30 rounded-xl border-2" required />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block font-display">Password</label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary/30 rounded-xl border-2" required />
              </div>
              <Button type="submit" className="w-full rounded-xl font-display font-bold funky-shadow" size="lg" disabled={loading}>
                <LogIn className="w-4 h-4 mr-1" /> {loading ? "Loading..." : "Let's Get This Over With"}
              </Button>
              <div className="text-center space-y-2">
                <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline font-medium">
                  Forgot password? classic.
                </button>
                <p className="text-sm text-muted-foreground">
                  No account?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="text-primary font-bold hover:underline">
                    Sign up I guess
                  </button>
                </p>
              </div>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <h2 className="font-display font-bold text-xl text-foreground text-center">New here? Cool cool. 🫠</h2>
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block font-display">Your Name</label>
                <Input placeholder="What should we call you?" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary/30 rounded-xl border-2" />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block font-display">Email</label>
                <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary/30 rounded-xl border-2" required />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block font-display">Password</label>
                <Input type="password" placeholder="Make it decent" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary/30 rounded-xl border-2" required minLength={6} />
              </div>
              <Button type="submit" className="w-full rounded-xl font-display font-bold funky-shadow" size="lg" disabled={loading}>
                <UserPlus className="w-4 h-4 mr-1" /> {loading ? "Creating..." : "Create Account, Whatever"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary font-bold hover:underline">
                  Log in
                </button>
              </p>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <button type="button" onClick={() => setMode("login")} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              <h2 className="font-display font-bold text-xl text-foreground text-center">Reset Password 🔑</h2>
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block font-display">Email</label>
                <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary/30 rounded-xl border-2" required />
              </div>
              <Button type="submit" className="w-full rounded-xl font-display font-bold funky-shadow" size="lg" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link 📧"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
