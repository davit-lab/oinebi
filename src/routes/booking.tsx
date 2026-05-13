import { createFileRoute, Link } from '@tanstack/react-router';
import { useLangStore } from '@/store/langStore';
import { useContentStore } from '@/store/contentStore';
import { useCartStore } from '@/store/cartStore';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Users, ShoppingBag, Check, Trash2, Plus, Minus, Loader2, MapPin, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export const Route = createFileRoute('/booking')({ component: BookingPage });

function BookingPage() {
  const { lang } = useLangStore();
  const { translations, assets } = useContentStore();
  const t = translations[lang];
  const cart = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', comments: '' });
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [selectedAnimator, setSelectedAnimator] = useState<any>(null);

  const animators = (t.animators || []) as any[];
  const hosts = (t.hosts || []) as any[];
  const services = (t.services || []) as any[];
  const timeSlots = (t.timeSlots || []) as any[];
  const programs = (t.programs || []) as any[];

  const selectedProgram = programs.find((p: any) => p.id === cart.programId) || null;
  const maxAnimators: number = selectedProgram?.maxAnimators != null ? Number(selectedProgram.maxAnimators) : 0;
  const maxHosts: number = selectedProgram?.maxHosts != null ? Number(selectedProgram.maxHosts) : 0;
  const progMaxHours: number = selectedProgram?.maxHours ? Number(selectedProgram.maxHours) : 4;
  const progAllowAnimators = maxAnimators > 0;
  const progAllowHosts = maxHosts > 0;
  const totalSelectedAnimators = Object.values(cart.animators).filter((a: any) => animators.some((x: any) => x.id === a.id)).reduce((sum: number, a: any) => sum + (a.quantity || 0), 0);
  const totalSelectedHosts = Object.values(cart.animators).filter((a: any) => hosts.some((x: any) => x.id === a.id)).reduce((sum: number, a: any) => sum + (a.quantity || 0), 0);

  const slot = timeSlots.find((s) => s.time === cart.timeSlotTime);

  // Load booked slots whenever date changes
  useEffect(() => {
    if (!cart.date) { setBookedTimes([]); return; }
    let cancelled = false;
    (supabase.rpc as any)('get_booked_slots', { _date: cart.date }).then(({ data, error }: any) => {
      if (cancelled) return;
      if (error) { console.error(error); }
      const rpcTimes = (data || []).map((r: any) => r.time_slot_time).filter(Boolean);
      const adminBlocked: string[] = (assets?.blockedSlots?.[cart.date] || []);
      const times = Array.from(new Set([...rpcTimes, ...adminBlocked]));
      setBookedTimes(times);
      if (cart.timeSlotTime && times.includes(cart.timeSlotTime)) {
        cart.setTimeSlot(null);
      }
    });
    return () => { cancelled = true; };
  }, [cart.date, assets?.blockedSlots]);


  const territoryPrice = slot?.territoryPrice || 0;
  const multiplier = slot?.multiplier || 1;

  const animatorsTotal = useMemo(
    () => Object.values(cart.animators).reduce((sum, a) => sum + a.pricePerHour * a.quantity * a.hours * multiplier, 0),
    [cart.animators, multiplier],
  );
  const servicesTotal = useMemo(
    () => Object.values(cart.services).reduce((sum, s) => {
      const q = s.quantity || 1;
      const h = s.hours || 1;
      return sum + s.price * q * h;
    }, 0),
    [cart.services],
  );
  const total = Math.round(territoryPrice + animatorsTotal + servicesTotal);

  const setAnimQty = (a: any, qty: number) => {
    const existing = cart.animators[a.id];
    const currentQty = existing?.quantity || 0;
    if (qty > currentQty && maxAnimators !== null && totalSelectedAnimators >= maxAnimators) return;
    cart.setAnimator({
      id: a.id,
      name: a.name,
      pricePerHour: a.pricePerHour,
      image: a.image,
      hours: existing?.hours || 2,
      quantity: Math.max(0, qty),
    });
  };
  const setAnimHours = (a: any, hours: number) => {
    const existing = cart.animators[a.id];
    if (!existing) return;
    const max = a.maxHours ? Number(a.maxHours) : 24;
    cart.setAnimator({ ...existing, hours: Math.min(max, Math.max(1, hours)) });
  };

  const submit = async () => {
    if (!cart.date || !cart.timeSlotTime || !customer.name || !customer.phone || !customer.address) {
      toast.error(lang === 'ka' ? 'შეავსეთ აუცილებელი ველები (სახელი, ტელეფონი, მისამართი, თარიღი, დრო)' : 'Fill required fields (name, phone, address, date, time)');
      return;
    }
    setSubmitting(true);
    // Re-check slot availability to avoid race conditions
    const adminBlocked: string[] = (assets?.blockedSlots?.[cart.date] || []);
    if (adminBlocked.includes(cart.timeSlotTime)) {
      setSubmitting(false);
      cart.setTimeSlot(null);
      toast.error(lang === 'ka' ? 'ეს დრო დაბლოკილია' : 'This time slot is blocked');
      return;
    }
    const { data: latest } = await (supabase.rpc as any)('get_booked_slots', { _date: cart.date });
    const latestTimes = (latest || []).map((r: any) => r.time_slot_time);
    if (latestTimes.includes(cart.timeSlotTime)) {
      setSubmitting(false);
      setBookedTimes(latestTimes);
      cart.setTimeSlot(null);
      toast.error(lang === 'ka' ? 'ეს დრო უკვე დაკავებულია' : 'This time was just booked');
      return;
    }
    const program = programs.find((p) => p.id === cart.programId) || null;
    const { error } = await supabase.from('bookings').insert([{
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email || null,
      address: customer.address,
      comments: customer.comments || null,
      booking_date: cart.date,
      time_slot: (slot || null) as any,
      program: program as any,
      animators: Object.values(cart.animators) as any,
      services: Object.values(cart.services) as any,
      total_price: total,
    } as any]);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.ui.bookingSuccess);
    
    // Select random cute emoji
    const cuteEmojis = ['🎉', '🎈', '🎁', '⭐', '🌟', '✨', '💖', '🎊', '🦄', '🎀', '🌈', '🎂', '🎭', '🎪'];
    setSelectedEmoji(cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)]);
    
    // Select random animator for popup
    if (animators.length > 0) {
      setSelectedAnimator(animators[Math.floor(Math.random() * animators.length)]);
    }
    
    setDone(true);
    cart.clear();
    setCustomer({ name: '', phone: '', email: '', address: '', comments: '' });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-14 flex flex-col gap-10">
      <Toaster richColors position="top-right" />
      
      {/* Completion State */}
      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-primary/40 via-accent/30 to-secondary/40 backdrop-blur-sm">
          {/* Superhero background pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 40%)',
            backgroundSize: '100% 100%'
          }} />
          
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-md w-full text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10">
              {/* Random Emoji */}
              <div className="text-6xl md:text-7xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
                {selectedEmoji}
              </div>
              
              {/* Success heading */}
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                {lang === 'ka' ? 'ჯავშანი წარმატებით გაიგზავნა!' : 'Booking sent successfully!'}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-medium mb-6 leading-relaxed">
                {lang === 'ka'
                  ? 'დადასტურების შემდგომ დაგიკავშირდებით.'
                  : 'We will contact you after confirmation.'}
              </p>

              {/* Animator with Speech Bubble */}
              {selectedAnimator && (
                <div className="relative mb-6 mt-2">
                  {/* Animator Photo */}
                  <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                    <img src={selectedAnimator.image} alt={selectedAnimator.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Back to Home Button */}
              <Link to="/">
                <button className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg">
                  {lang === 'ka' ? 'მთავარზე დაბრუნება' : 'Back to Home'}
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form */}
      {!done && (
        <>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">{t.ui.book}</span>
            <h1 className="font-display text-5xl md:text-7xl text-primary">{lang === 'ka' ? 'დაჯავშნა' : 'Booking & Calculator'}</h1>
            <p className="text-muted-foreground font-semibold max-w-2xl">
              {lang === 'ka' ? 'აირჩიეთ თარიღი,პროგრამები,სერვისები,გმირები,ანიმატორები  და სერვისები — და იხილეთ ჯამი.' : 'Pick date, animators with hours and services — price auto-calculated.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Step 1: Date & Time */}
          <Section icon={<Calendar />} title={t.ui.pickDateTime}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>{t.ui.day}</Label>
                <input
                  type="date"
                  value={cart.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => cart.setDate(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-input border border-border font-bold focus:border-primary outline-none"
                />
              </div>
              <div>
                <Label>{t.ui.session}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {timeSlots.map((s) => {
                    const isBooked = bookedTimes.includes(s.time);
                    const isSelected = cart.timeSlotTime === s.time;
                    return (
                      <button
                        key={s.time}
                        disabled={isBooked || !cart.date}
                        onClick={() => cart.setTimeSlot(s.time)}
                        title={isBooked ? (lang === 'ka' ? 'ეს დრო დაკავებულია' : 'Booked') : !cart.date ? (lang === 'ka' ? 'ჯერ აირჩიეთ თარიღი' : 'Pick a date first') : ''}
                        className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-0.5 ${
                          isBooked
                            ? 'bg-muted border-border opacity-50 cursor-not-allowed line-through'
                            : isSelected
                              ? 'bg-primary border-primary text-primary-foreground shadow-glow'
                              : 'bg-card border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="font-display text-lg leading-none">{s.time}</span>
                        <span className="text-[9px] font-bold uppercase opacity-80">{s.label}</span>
                        <span className="text-[10px] font-black mt-1">{s.territoryPrice}₾ · ×{s.multiplier}</span>
                        {isBooked && (
                          <span className="absolute top-1 right-1 text-[8px] font-black uppercase bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
                            {lang === 'ka' ? 'დაკავ.' : 'Booked'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!cart.date && <p className="text-[10px] text-muted-foreground mt-2 font-medium">{lang === 'ka' ? 'ჯერ აირჩიეთ თარიღი' : 'Select a date to see available times'}</p>}
              </div>
            </div>
          </Section>

          {/* Step 2: Programs */}
          <Section icon={<Users />} title={t.ui.pickProgram}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {programs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => cart.setProgram(cart.programId === p.id ? null : p.id)}
                  className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-2 transition-all ${
                    cart.programId === p.id ? 'bg-primary/10 border-primary shadow-soft' : 'bg-card border-border hover:border-primary/40'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{p.ageRange}</span>
                  <h3 className="font-display text-lg leading-tight">{p.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{p.description}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* Step 3: Characters (program-driven) */}
          <Section icon={<Users />} title={lang === 'ka' ? 'პერსონაჯები' : 'Characters'}>
            {!selectedProgram ? (
              <p className="text-sm text-muted-foreground italic py-4">{lang === 'ka' ? 'გთხოვთ, ჯერ აირჩიოთ პროგრამა' : 'Please select a program first'}</p>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Program info bar */}
                <div className="flex flex-wrap gap-3 text-xs font-bold">
                  {progAllowAnimators && maxAnimators !== null && maxAnimators > 0 && (
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">{lang === 'ka' ? 'გმირები' : 'Heroes'}: {totalSelectedAnimators}/{maxAnimators}</span>
                  )}
                  {progAllowHosts && maxHosts !== null && maxHosts > 0 && (
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent">{lang === 'ka' ? 'ანიმატორები' : 'Animators'}: {totalSelectedHosts}/{maxHosts}</span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">{lang === 'ka' ? 'მაქ. საათი' : 'Max hours'}: {progMaxHours}{lang === 'ka' ? 'სთ' : 'h'}</span>
                </div>

                {/* Heroes (animators) */}
                {progAllowAnimators && maxAnimators !== null && maxAnimators > 0 && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-3">{lang === 'ka' ? 'გმირები / პერსონაჟები' : 'Heroes / Characters'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {animators.map((a: any) => {
                        const sel = cart.animators[a.id];
                        const active = !!sel;
                        const atMax = maxAnimators !== null && totalSelectedAnimators >= maxAnimators;
                        return (
                          <div key={a.id} className={`p-4 rounded-3xl border-2 flex gap-4 transition-all ${active ? 'bg-primary/5 border-primary shadow-soft' : 'bg-card border-border'}`}>
                            <img src={a.image} alt={a.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-display text-base leading-tight">{a.name}</h3>
                                  <p className="text-xs text-muted-foreground">{a.category}</p>
                                </div>
                                {active && <span className="bg-primary text-primary-foreground rounded-full p-1 flex-shrink-0"><Check size={12} /></span>}
                              </div>
                              <div className="mt-auto flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                                  <button onClick={() => setAnimQty(a, (sel?.quantity || 0) - 1)} className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center"><Minus size={12} /></button>
                                  <span className="w-7 text-center font-display">{sel?.quantity || 0}</span>
                                  <button onClick={() => setAnimQty(a, (sel?.quantity || 0) + 1)} disabled={atMax} className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={12} /></button>
                                </div>
                                {active && (
                                  <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                                    <button onClick={() => setAnimHours(a, sel.hours - 1)} className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center"><Minus size={12} /></button>
                                    <span className="w-10 text-center font-display text-xs">{sel.hours}{lang === 'ka' ? 'სთ' : 'h'}</span>
                                    <button onClick={() => setAnimHours(a, sel.hours + 1)} disabled={sel.hours >= progMaxHours} className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={12} /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Animators (hosts) */}
                {progAllowHosts && maxHosts !== null && maxHosts > 0 && hosts.length > 0 && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-accent mb-3">{lang === 'ka' ? 'ანიმატორები / წამყვანები' : 'Animators / Hosts'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hosts.map((a: any) => {
                        const sel = cart.animators[a.id];
                        const active = !!sel;
                        const atMax = maxHosts !== null && totalSelectedHosts >= maxHosts;
                        return (
                          <div key={a.id} className={`p-4 rounded-3xl border-2 flex gap-4 transition-all ${active ? 'bg-accent/5 border-accent shadow-soft' : 'bg-card border-border'}`}>
                            <img src={a.image} alt={a.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-display text-base leading-tight">{a.name}</h3>
                                  <p className="text-xs text-muted-foreground">{a.category}</p>
                                </div>
                                {active && <span className="bg-accent text-white rounded-full p-1 flex-shrink-0"><Check size={12} /></span>}
                              </div>
                              <div className="mt-auto flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                                  <button onClick={() => setAnimQty(a, (sel?.quantity || 0) - 1)} className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center"><Minus size={12} /></button>
                                  <span className="w-7 text-center font-display">{sel?.quantity || 0}</span>
                                  <button onClick={() => setAnimQty(a, (sel?.quantity || 0) + 1)} disabled={atMax} className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={12} /></button>
                                </div>
                                {active && (
                                  <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                                    <button onClick={() => setAnimHours(a, sel.hours - 1)} className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center"><Minus size={12} /></button>
                                    <span className="w-10 text-center font-display text-xs">{sel.hours}{lang === 'ka' ? 'სთ' : 'h'}</span>
                                    <button onClick={() => setAnimHours(a, sel.hours + 1)} disabled={sel.hours >= progMaxHours} className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={12} /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!progAllowAnimators && !progAllowHosts && (
                  <p className="text-sm text-muted-foreground italic">{lang === 'ka' ? 'ამ პროგრამაში პერსონაჯის არცევა გათვალისწონია არ არის' : 'Character selection is not available for this program'}</p>
                )}
              </div>
            )}
          </Section>

          {/* Step 4: Services */}
          <Section icon={<CreditCard />} title={t.ui.pickServices}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {services.filter((s: any) => s.id).map((s: any) => {
                const sel = cart.services[s.id];
                const active = !!sel;
                const maxQ = s.maxQuantity ? Number(s.maxQuantity) : 1;
                const maxH = s.maxHours ? Number(s.maxHours) : 1;
                const hasQty = maxQ > 1;
                const hasHours = maxH > 1;
                const curQty = sel?.quantity || 0;
                const curHrs = sel?.hours || 1;

                const setQty = (qty: number) => {
                  const q = Math.max(0, Math.min(maxQ, qty));
                  cart.setService({ id: s.id, name: s.name, price: s.price, quantity: q, hours: sel?.hours || 1 });
                };
                const setHrs = (hrs: number) => {
                  if (!sel) return;
                  cart.setService({ ...sel, hours: Math.max(1, Math.min(maxH, hrs)) });
                };
                const toggle = () => cart.toggleService({ id: s.id, name: s.name, price: s.price, quantity: 1, hours: 1 });

                const linePrice = active ? s.price * curQty * curHrs : s.price;

                return (
                  <div key={s.id} className={`p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all ${active ? 'bg-primary/5 border-primary shadow-soft' : 'bg-card border-border'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-display text-base leading-tight">{s.name}</h3>
                        <p className="text-xs text-muted-foreground font-medium line-clamp-2 mt-0.5">{s.description}</p>
                      </div>
                      {active && <span className="bg-primary text-primary-foreground rounded-full p-1 flex-shrink-0"><Check size={10} /></span>}
                    </div>

                    <div className="flex items-end justify-between gap-3 mt-auto">
                      <div className="flex flex-col gap-1.5">
                        {hasQty && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground w-16">{lang === 'ka' ? 'რაოდ.' : 'Qty'}</span>
                            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                              <button onClick={() => setQty(curQty - 1)} className="w-6 h-6 rounded-lg hover:bg-card flex items-center justify-center"><Minus size={10} /></button>
                              <span className="w-6 text-center font-display text-sm">{curQty}</span>
                              <button onClick={() => setQty(curQty + 1)} disabled={curQty >= maxQ} className="w-6 h-6 rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30"><Plus size={10} /></button>
                            </div>
                          </div>
                        )}
                        {hasHours && active && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground w-16">{lang === 'ka' ? 'საათი' : 'Hours'}</span>
                            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                              <button onClick={() => setHrs(curHrs - 1)} className="w-6 h-6 rounded-lg hover:bg-card flex items-center justify-center"><Minus size={10} /></button>
                              <span className="w-8 text-center font-display text-sm">{curHrs}{lang === 'ka' ? 'სთ' : 'h'}</span>
                              <button onClick={() => setHrs(curHrs + 1)} disabled={curHrs >= maxH} className="w-6 h-6 rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30"><Plus size={10} /></button>
                            </div>
                            <span className="text-[9px] text-muted-foreground">max {maxH}{lang === 'ka' ? 'სთ' : 'h'}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-display text-primary font-bold">{active ? linePrice : s.price}₾</div>
                        {active && (hasQty || hasHours) && <div className="text-[10px] text-muted-foreground">{s.price}₾ × {hasQty ? `${curQty}` : '1'}{hasHours ? ` × ${curHrs}${lang === 'ka' ? 'სთ' : 'h'}` : ''}</div>}
                        {!hasQty && (
                          <button onClick={toggle} className={`mt-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${active ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:border-primary/50'}`}>
                            {active ? (lang === 'ka' ? 'წაშლა' : 'Remove') : (lang === 'ka' ? 'დამატება' : 'Add')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Contact */}
          <Section icon={<ShoppingBag />} title={t.ui.contactInfo}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>{t.ui.name} *</Label><Input value={customer.name} onChange={(v) => setCustomer({ ...customer, name: v })} /></div>
              <div><Label>{t.ui.phone} *</Label><Input value={customer.phone} onChange={(v) => setCustomer({ ...customer, phone: v })} placeholder="5XX XX XX XX" /></div>
              <div className="md:col-span-2"><Label>{lang === 'ka' ? 'მისამართი' : 'Address'} *</Label><Input value={customer.address} onChange={(v) => setCustomer({ ...customer, address: v })} placeholder={lang === 'ka' ? 'ქალაქი, ქუჩა, ნომერი, ბინა' : 'City, street, number, apt'} /></div>
              <div className="md:col-span-2"><Label>{t.ui.email}</Label><Input value={customer.email} onChange={(v) => setCustomer({ ...customer, email: v })} /></div>
              <div className="md:col-span-2"><Label>{t.ui.comments}</Label>
                <textarea value={customer.comments} onChange={(e) => setCustomer({ ...customer, comments: e.target.value })} className="w-full p-4 rounded-2xl bg-input border border-border font-medium focus:border-primary outline-none min-h-[100px]" />
              </div>
            </div>
          </Section>
        </div>

        {/* Cart sidebar */}
        <div>
          <div className="sticky top-28 bg-white border border-border rounded-[2rem] shadow-soft p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="text-primary" size={20} />
              </span>
              <h2 className="font-display text-2xl">{t.ui.cart}</h2>
            </div>

            <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
              {slot && (
                <CartRow label={t.ui.territory} sub={`${slot.label} · ${slot.time} · ×${slot.multiplier}`} price={`${territoryPrice}₾`} />
              )}
              {cart.programId && (() => {
                const p = programs.find(pr => pr.id === cart.programId);
                return p ? <CartRow label={t.ui.program} sub={`${p.name} · ${p.ageRange}`} price="0₾" /> : null;
              })()}
              {Object.values(cart.animators).map((a) => (
                <CartRow
                  key={a.id}
                  label={t.ui.animator}
                  sub={`${a.name} × ${a.quantity} · ${a.hours}${lang === 'ka' ? 'სთ' : 'h'}`}
                  price={`${Math.round(a.pricePerHour * a.quantity * a.hours * multiplier)}₾`}
                  onRemove={() => cart.removeAnimator(a.id)}
                />
              ))}
              {Object.values(cart.services).map((s) => {
                const q = s.quantity || 1;
                const h = s.hours || 1;
                const lineP = Math.round(s.price * q * h);
                const sub = q > 1 || h > 1 ? `${s.name} ×${q}${h > 1 ? ` ·${h}${lang === 'ka' ? 'სთ' : 'h'}` : ''}` : s.name;
                return (
                <CartRow
                  key={s.id}
                  label={t.ui.service}
                  sub={sub}
                  price={`${lineP}₾`}
                  onRemove={() => cart.setService({ ...s, quantity: 0 })}
                />
                );
              })}
              {!slot && Object.keys(cart.animators).length === 0 && Object.keys(cart.services).length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground italic">{t.ui.emptyCart}</p>
              )}
            </div>

            <div className="border-t-2 border-dashed border-border pt-4 flex justify-between items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{t.ui.total}</span>
              <span className="font-display text-4xl text-primary">{total}₾</span>
            </div>

            <button
              disabled={submitting || done}
              onClick={submit}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-pop disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="animate-spin" size={16} /> {lang === 'ka' ? 'იგზავნება...' : 'Sending...'}</> : done ? <><Check size={16} /> {lang === 'ka' ? 'გაგზავნილია' : 'Sent'}</> : t.ui.bookNow}
            </button>
          </div>
        </div>
      </div>
          </>
        )}
    </div>
  );
}

function Section({ icon, title, children, badge, badgeOver }: { icon: React.ReactNode; title: string; children: React.ReactNode; badge?: string; badgeOver?: boolean }) {
  return (
    <section className="bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-soft flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-xl md:text-2xl font-display">
          <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
          {title}
        </h2>
        {badge && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${badgeOver ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-primary/10 border-primary/30 text-primary'}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">{children}</label>;
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-4 rounded-2xl bg-input border border-border font-medium focus:border-primary outline-none" />;
}
function CartRow({ label, sub, price, onRemove }: { label: string; sub: string; price: string; onRemove?: () => void }) {
  return (
    <div className="flex justify-between items-start gap-2 pb-3 border-b border-border last:border-0">
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[9px] font-bold uppercase tracking-widest text-primary">{label}</span>
        <span className="text-sm font-bold truncate">{sub}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-display text-sm">{price}</span>
        {onRemove && <button onClick={onRemove} className="text-destructive hover:scale-110 transition-transform"><Trash2 size={14} /></button>}
      </div>
    </div>
  );
}
