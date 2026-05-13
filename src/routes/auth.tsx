import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
  head: () => ({ meta: [{ title: 'Admin Login · OINEBI' }] }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.rpc as any)('admin_exists');
      const exists = data === true;
      setAdminExists(exists);
      // Force sign-in mode once an admin exists (single-admin policy)
      if (exists) setMode('signin');
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success('Welcome back!');
      navigate({ to: '/admin' });
    } else {
      // Re-check before allowing signup so race conditions can't create a 2nd admin via UI.
      const { data: existsNow } = await (supabase.rpc as any)('admin_exists');
      if (existsNow === true) {
        setLoading(false);
        setAdminExists(true);
        setMode('signin');
        return toast.error('Admin already exists. Please sign in.');
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) { setLoading(false); return toast.error(error.message); }
      // Try to claim admin immediately if a session exists (auto-confirm on)
      await (supabase.rpc as any)('claim_admin_if_first');
      setLoading(false);
      toast.success('Admin account created. Sign in to continue.');
      setMode('signin');
      setAdminExists(true);
    }
  };

  const showSignup = adminExists === false;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <Toaster richColors position="top-right" />
      <div className="bg-card rounded-[40px] p-10 shadow-glow w-full max-w-md border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="text-primary" size={28} />
          <h1 className="font-display text-4xl gradient-text">{mode === 'signin' ? 'Sign In' : 'Create Admin'}</h1>
        </div>
        <p className="text-muted-foreground mb-8 font-medium text-sm">
          {adminExists === false
            ? 'No admin yet. Create the single admin account.'
            : 'OINEBI admin panel access'}
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="p-4 rounded-2xl bg-input border border-border font-bold outline-none focus:border-primary" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6)" className="p-4 rounded-2xl bg-input border border-border font-bold outline-none focus:border-primary" />
          <button disabled={loading || adminExists === null} className="mt-2 py-4 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-glow disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="animate-spin" size={16} />}
            {mode === 'signin' ? 'Sign In' : 'Create Admin'}
          </button>
        </form>
        {showSignup && (
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="w-full mt-4 text-xs text-muted-foreground hover:text-primary font-bold uppercase tracking-widest">
            {mode === 'signin' ? "Set up admin account" : 'Already have an account? Sign in'}
          </button>
        )}
        <p className="text-[10px] text-muted-foreground mt-6 text-center leading-relaxed">
          Only one admin account is allowed. Use a memorable email tied to the business name.
        </p>
      </div>
    </div>
  );
}
