import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLangStore } from '@/store/langStore';
import { Star, MessageSquare, Send, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

type Review = { id: string; customer_name: string; rating: number; text: string; created_at: string };

export function ReviewsSection({
  targetType,
  targetId,
  staticReviews = [],
}: {
  targetType: 'service' | 'animator' | 'program' | 'general';
  targetId?: string;
  staticReviews?: any[];
}) {
  const { lang } = useLangStore();
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from('reviews').select('*').eq('status', 'approved').eq('target_type', targetType).order('created_at', { ascending: false });
    if (targetId) q = q.eq('target_id', targetId);
    const { data } = await q;
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [targetType, targetId]);

  const all = [
    ...items.map((r) => ({ author: r.customer_name, rating: r.rating, text: r.text })),
    ...staticReviews,
  ];

  return (
    <section className="mt-16">
      <Toaster richColors position="top-right" />
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <MessageSquare size={18} className="text-primary" />
        <h2 className="font-display text-3xl md:text-4xl gradient-text">{lang === 'ka' ? 'მიმოხილვები' : 'Reviews'}</h2>
        {all.length > 0 && <span className="text-sm font-bold px-3 py-1 rounded-full bg-secondary/30">{all.length}</span>}
        <button onClick={() => setShowForm((v) => !v)} className="ml-auto inline-flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">
          <Plus size={14} /> {lang === 'ka' ? 'მიმოხილვის დატოვება' : 'Leave a review'}
        </button>
      </div>

      {showForm && (
        <ReviewForm targetType={targetType} targetId={targetId} onSubmitted={() => { setShowForm(false); load(); }} />
      )}

      {loading && all.length === 0 ? (
        <p className="text-muted-foreground text-sm">{lang === 'ka' ? 'იტვირთება...' : 'Loading...'}</p>
      ) : all.length === 0 ? (
        <p className="text-muted-foreground text-sm">{lang === 'ka' ? 'ჯერ არ არის მიმოხილვები. იყავი პირველი!' : 'No reviews yet. Be the first!'}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {all.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="p-5 rounded-3xl bg-card border border-border shadow-soft flex flex-col gap-3 hover:shadow-glow transition-shadow">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className={j < (r.rating || 5) ? 'fill-secondary text-secondary' : 'text-muted'} />
                ))}
              </div>
              <p className="text-sm font-medium leading-relaxed">"{r.text}"</p>
              <span className="text-xs font-bold text-muted-foreground mt-auto">— {r.author}</span>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewForm({ targetType, targetId, onSubmitted }: { targetType: string; targetId?: string; onSubmitted: () => void }) {
  const { lang } = useLangStore();
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('reviews').insert({
      customer_name: name.trim(),
      rating,
      text: text.trim(),
      target_type: targetType,
      target_id: targetId || null,
      status: 'pending',
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(lang === 'ka' ? 'მადლობა! მიმოხილვა გადამოწმების შემდეგ გამოჩნდება.' : 'Thank you! Your review will appear after approval.');
    setName(''); setText(''); setRating(5);
    onSubmitted();
  };

  return (
    <form onSubmit={submit} className="mb-6 p-5 rounded-3xl bg-card border border-border flex flex-col gap-3">
      <div className="flex gap-3 flex-wrap items-center">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === 'ka' ? 'სახელი' : 'Your name'} className="flex-1 min-w-[200px] p-3 rounded-xl bg-input border border-border font-medium text-sm focus:border-primary outline-none" required />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => setRating(i + 1)} className="p-1">
              <Star size={22} className={i < rating ? 'fill-secondary text-secondary' : 'text-muted hover:text-secondary'} />
            </button>
          ))}
        </div>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={lang === 'ka' ? 'შენი გამოცდილება...' : 'Share your experience...'} className="p-3 rounded-xl bg-input border border-border font-medium text-sm focus:border-primary outline-none min-h-[100px]" required />
      <button disabled={busy} className="self-start inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs disabled:opacity-60">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {lang === 'ka' ? 'გაგზავნა' : 'Submit'}
      </button>
    </form>
  );
}
