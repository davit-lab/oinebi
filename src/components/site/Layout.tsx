import { Link } from '@tanstack/react-router';
import { useLangStore } from '@/store/langStore';
import { useContentStore } from '@/store/contentStore';
import { useCartStore } from '@/store/cartStore';
import { Menu, X, ShoppingBag, Instagram, Facebook } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function Logo({ className = 'w-12 h-12' }: { className?: string }) {
  const { assets } = useContentStore();
  return (
    <div className="relative">
      <img src={assets.logo} alt="Oinebi" className={`${className} object-contain drop-shadow-lg relative z-10`} />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl -z-0 scale-150" />
    </div>
  );
}

function LangSwitch() {
  const { lang, setLang } = useLangStore();
  return (
    <div className="flex items-center gap-1 glass rounded-full p-1">
      {(['ka', 'en'] as const).map((c) => (
        <button
          key={c}
          onClick={() => setLang(c)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
            lang === c 
              ? 'bg-primary text-white shadow-md' 
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function Nav() {
  const { lang } = useLangStore();
  const { translations } = useContentStore();
  const cart = useCartStore();
  const cartCount = Object.keys(cart.animators).length + Object.keys(cart.services).length + (cart.timeSlotTime ? 1 : 0);
  const t = translations[lang];
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = (t.nav || []).filter((l: any) => l.href !== '/menu');

  return (
    <>
      <nav 
        className={`fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50 transition-all duration-300 ${
          scrolled ? 'top-2' : 'top-4'
        }`}
      >
        <div className={`bg-white/80 backdrop-blur-xl rounded-[2rem] px-4 md:px-6 py-3 flex items-center justify-between border border-white/50 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 ${
          scrolled ? 'shadow-[0_16px_50px_-16px_rgba(0,0,0,0.18)] bg-white/95' : ''
        }`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Logo className="w-16 h-16 md:w-20 md:h-20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link: any) => (
              <Link
                key={link.href}
                to={link.href}
                className="relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all group"
                activeProps={{ className: 'text-primary bg-primary/10' }}
              >
                {link.label}
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full group-hover:w-4 transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <LangSwitch />
            <div className="relative">
              <Link to="/booking">
                <Button size="sm" className="relative inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5">
                  <ShoppingBag size={16} />
                  <span className="hidden sm:inline">{t.ui.book}</span>
                </Button>
              </Link>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-foreground text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <button 
              className="lg:hidden p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" 
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden fixed top-24 left-4 right-4 z-40">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 flex flex-col gap-2 shadow-[0_16px_50px_-16px_rgba(0,0,0,0.2)] border border-white/50">
            {navLinks.map((link: any) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-2xl text-base font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                activeProps={{ className: 'bg-primary text-white' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function Footer() {
  const { lang } = useLangStore();
  const { translations } = useContentStore();
  const t = translations[lang];
  
  const footerLinks = [
    { title: t.ui.product || 'Services', links: [
      { label: t.ui.animatorsTitle, href: '/animators' },
      { label: t.ui.services, href: '/services' },
    ]},
    { title: t.ui.company || 'Company', links: [
      { label: t.ui.faq, href: '/faq' },
      { label: t.ui.book, href: '/booking' },
    ]},
  ];

  return (
    <footer className="w-full mt-20 md:mt-32 relative">
      {/* Decorative top wave */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-cream/50" />
      
      <div className="bg-cream/50 backdrop-blur-sm pt-16 md:pt-24 pb-8 px-4 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
            {/* Brand Column */}
            <div className="md:col-span-5 flex flex-col gap-5">
              <Link to="/" className="flex items-center gap-3 group w-fit">
                <Logo className="w-12 h-12" />
                <span className="font-display text-2xl gradient-text">Oinebi</span>
              </Link>
              <p className="text-muted-foreground font-medium leading-relaxed max-w-sm">
                {t.ui.footerDesc || 'Creating magical moments for your little ones. Premium entertainment for children\'s parties and events.'}
              </p>
              <div className="flex gap-3 mt-2">
                <SocialButton icon={<Instagram size={18} />} href="https://www.instagram.com/oinebi/" />
                <SocialButton icon={<Facebook size={18} />} href="https://www.facebook.com/oinebi" />
              </div>
            </div>

            {/* Links Columns */}
            {footerLinks.map((section) => (
              <div key={section.title} className="md:col-span-3 flex flex-col gap-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary">{section.title}</h4>
                <ul className="flex flex-col gap-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        to={link.href}
                        className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                      >
                        <span className="w-0 h-px bg-primary group-hover:w-3 transition-all duration-300" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact Column */}
            <div className="md:col-span-1 flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary">{lang === 'ka' ? 'კონტაქტი' : 'Contact'}</h4>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-muted-foreground">+995 555 53 57 54</span>
                <span className="text-sm font-semibold text-muted-foreground">ooinebii@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t.ui.copyright || `© ${new Date().getFullYear()} Oinebi. All rights reserved.`}
            </p>
            <div className="flex items-center gap-1">
              <a href="https://codezero.ge" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">Made by CodeZero Academy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialButton({ icon, href }: { icon: React.ReactNode; href: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary hover:scale-110 transition-all duration-300 shadow-card"
    >
      {icon}
    </a>
  );
}

export function Blobs() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Static subtle background blobs - no animation */}
      <div className="absolute bg-primary/20 w-[40vw] h-[40vw] -top-20 -left-10 rounded-full blur-[100px]" />
      <div className="absolute bg-accent/15 w-[35vw] h-[35vw] top-1/4 -right-10 rounded-full blur-[100px]" />
      <div className="absolute bg-accent-2/15 w-[30vw] h-[30vw] bottom-20 left-1/3 rounded-full blur-[100px]" />
    </div>
  );
}
