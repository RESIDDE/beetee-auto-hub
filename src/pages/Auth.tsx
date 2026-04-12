import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });
      if (error) throw error;
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />

      <div className="w-full max-w-md animate-fade-up z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 mb-4 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground tracking-tight">BeeTee Autos</h1>
          <p className="text-muted-foreground mt-2">Secure access to your administrative console</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border-white/5 relative overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-background/50 p-1 rounded-xl glass-panel">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all font-semibold">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all font-semibold">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input required type="email" placeholder="admin@domain.com" className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus-visible:ring-amber-500 transition-all font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input required type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus-visible:ring-amber-500 transition-all font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <Button disabled={loading} type="submit" className="w-full h-12 mt-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/25 transition-all">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input required placeholder="John Doe" className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus-visible:ring-amber-500 transition-all font-medium" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Phone</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">#</span>
                    <Input required type="tel" placeholder="+234..." className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus-visible:ring-amber-500 transition-all font-medium" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input required type="email" placeholder="john@domain.com" className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus-visible:ring-amber-500 transition-all font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input required type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus-visible:ring-amber-500 transition-all font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <Button disabled={loading} type="submit" className="w-full h-12 mt-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/25 transition-all">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Note: The first user registered becomes an Admin.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
