import { createFileRoute, Link } from '@tanstack/react-router';
import { useLangStore } from '@/store/langStore';
import { useContentStore } from '@/store/contentStore';
import { ArrowRight, Users, PartyPopper, Star } from 'lucide-react';
import { VideoPlayer } from '@/components/site/VideoPlayer';
import { isVideoFile, getEmbedUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({ component: Home });

// Premium Card with organic feel
function Card({ item, type }: { item: any; type: 'animator' | 'service' | 'program' }) {
  const { lang } = useLangStore();
  
  return (
    <div className="group relative overflow-hidden rounded-[2rem] bg-white border border-border/40 transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-2">
      <div className="aspect-[4/5] overflow-hidden relative">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
        />
        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        
        {/* Warm glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-primary shadow-sm">
            {item.category}
          </span>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            {type === 'program' && item.ageRange && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-foreground">
                {item.ageRange}y+
              </span>
            )}
          </div>
          <h3 className="text-xl md:text-2xl font-heading font-bold mb-2 text-shadow">
            {item.name}
          </h3>
          <p className="text-sm opacity-90 line-clamp-2 mb-3 font-medium leading-relaxed">
            {item.description}
          </p>
          <div className="flex justify-between items-center">
            {type !== 'animator' && (
              <span className="text-2xl font-display font-bold drop-shadow-lg">
                {type === 'program' ? `${item.pricePerHour}₾` : `${item.price}₾`}
                <span className="text-sm opacity-70 font-body font-normal ml-1">
                  {type === 'program' ? (lang === 'ka' ? '/სთ' : '/hr') : ''}
                </span>
              </span>
            )}
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-primary shadow-lg group-hover:scale-110 transition-transform duration-300 ml-auto">
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Premium Feature Card with depth
function FeatureCard({ icon, title, desc, color, image }: { icon: React.ReactNode; title: string; desc: string; color: string; image?: string }) {
  const colors: Record<string, string> = {
    coral: 'bg-primary/10 text-primary',
    lavender: 'bg-accent/10 text-accent',
    mint: 'bg-secondary/20 text-amber-600',
  };

  return (
    <div 
      className={`p-6 md:p-8 rounded-[2rem] border border-border/30 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_50px_-16px_rgba(0,0,0,0.15)] transition-all duration-500 group hover:-translate-y-1 ${image ? 'bg-cover bg-center bg-white' : 'bg-white'}`}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300 bg-white/90 backdrop-blur-sm`}>
        {icon}
      </div>
      <h3 className="font-heading text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300 bg-white/80 backdrop-blur-sm inline-block px-2 rounded-lg">{title}</h3>
      <p className="text-sm text-muted-foreground font-medium leading-relaxed bg-white/80 backdrop-blur-sm p-2 rounded-lg mt-2">{desc}</p>
    </div>
  );
}

function Home() {
  const { lang } = useLangStore();
  const { translations, assets } = useContentStore();
  const t = translations[lang];
  const heroVideo = (assets as any).heroVideo as string | undefined;
  const heroFallback = (assets as any).heroFallback as string | undefined;
  const showVideo = heroVideo && (isVideoFile(heroVideo) || getEmbedUrl(heroVideo));

  const features = [
    { 
      icon: <Users size={28} />, 
      title: lang === 'ka' ? 'პროფესიონალი ანიმატორები' : 'Professional Animators', 
      desc: lang === 'ka' ? 'გამოცდილი პერსონაჟები, რომლებიც გახდიან თქვენი დღესასწაულის გმირები' : 'Experienced characters who become the heroes of your celebration',
      color: 'coral',
      image: 'https://scontent.ftbs5-2.fna.fbcdn.net/v/t1.15752-9/689939249_999202976128750_5642019169898460735_n.png?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=i8pLFFAH-F0Q7kNvwHoZtf-&_nc_oc=AdpQ1XRKLjxa7zHRohQRLeS7C9kBJ1VIX0CEUxAK-PAGtLg6_f1Qq1Rw1qsO6ZPOVoI&_nc_zt=23&_nc_ht=scontent.ftbs5-2.fna&_nc_ss=7b2a8&oh=03_Q7cD5QFl6xI4GqCiPKzwQ1kQiZ6tu-_o2KW6BdOr9lQehIl5AQ&oe=6A2394B3'
    },
    { 
      icon: <PartyPopper size={28} />, 
      title: lang === 'ka' ? 'ასაკის შესაბამისი პროგრამები' : 'Age-Appropriate Programs', 
      desc: lang === 'ka' ? 'ინდივიდუალურად შერჩეული გასართობი თითოეული ასაკისთვის' : 'Individually selected entertainment for each age group',
      color: 'lavender',
      image: 'https://scontent.ftbs5-2.fna.fbcdn.net/v/t1.15752-9/689939249_999202976128750_5642019169898460735_n.png?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=i8pLFFAH-F0Q7kNvwHoZtf-&_nc_oc=AdpQ1XRKLjxa7zHRohQRLeS7C9kBJ1VIX0CEUxAK-PAGtLg6_f1Qq1Rw1qsO6ZPOVoI&_nc_zt=23&_nc_ht=scontent.ftbs5-2.fna&_nc_ss=7b2a8&oh=03_Q7cD5QFl6xI4GqCiPKzwQ1kQiZ6tu-_o2KW6BdOr9lQehIl5AQ&oe=6A2394B3'
    },
    { 
      icon: <Star size={28} />, 
      title: lang === 'ka' ? 'სრული სერვისი' : 'Full Service', 
      desc: lang === 'ka' ? 'ფოტო, ვიდეო, დეკორაცია და ყველაფერი, რაც საჭიროა' : 'Photo, video, decoration and everything you need',
      color: 'mint',
      image: 'https://scontent.ftbs5-2.fna.fbcdn.net/v/t1.15752-9/689939249_999202976128750_5642019169898460735_n.png?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=i8pLFFAH-F0Q7kNvwHoZtf-&_nc_oc=AdpQ1XRKLjxa7zHRohQRLeS7C9kBJ1VIX0CEUxAK-PAGtLg6_f1Qq1Rw1qsO6ZPOVoI&_nc_zt=23&_nc_ht=scontent.ftbs5-2.fna&_nc_ss=7b2a8&oh=03_Q7cD5QFl6xI4GqCiPKzwQ1kQiZ6tu-_o2KW6BdOr9lQehIl5AQ&oe=6A2394B3'
    },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-28 pb-8 paper-texture">
      {/* Hero Section */}
      <section className="relative pt-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] min-h-[600px] md:min-h-[700px] shadow-[0_25px_80px_-20px_rgba(0,0,0,0.25)]">
            {/* Background */}
            {showVideo ? (
              <div className="absolute inset-0">
                {getEmbedUrl(heroVideo!) ? (
                  <VideoPlayer src={heroVideo!} />
                ) : (
                  <video src={heroVideo} autoPlay muted loop playsInline poster={heroFallback} className="w-full h-full object-cover" />
                )}
              </div>
            ) : heroFallback ? (
              <img src={heroFallback} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 gradient-hero" />
            )}
            
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,123,123,0.3),_transparent_50%)]" />
            
            {/* Content */}
            <div className="relative h-full min-h-[600px] md:min-h-[700px] flex flex-col justify-center p-8 md:p-16 lg:p-20 text-white">
              <div className="flex flex-col gap-6 max-w-2xl">
                {/* Title */}
                <h1 className="rubik-scribble-regular text-7xl md:text-9xl lg:text-[10rem] leading-[0.9] drop-shadow-2xl text-balance text-white">
                  OINEBI
                </h1>
                
                {/* Description */}
                <p className="text-lg md:text-xl font-medium max-w-xl drop-shadow-lg opacity-95 leading-relaxed">
                  {t.ui.heroDesc || (lang === 'ka' 
                    ? 'დაუვიწყარი დღესასწაულები თქვენი პატარებისთვის — ჯადოსნური მომენტები, რომლებიც სამუდამოდ დარჩება მოგონებაში'
                    : 'Unforgettable celebrations for your little ones — magical moments that will remain in memory forever')}
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-3 mt-2">
                  <Link to="/animators">
                    <Button 
                      size="lg"
                      className="group"
                    >
                      {t.ui.seeAnimators || (lang === 'ka' ? 'ანიმატორები' : 'Animators')} 
                      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/booking">
                    <Button 
                      size="lg"
                      className="group"
                    >
                      {t.ui.book || (lang === 'ka' ? 'დაჯავშნა' : 'Book Now')}
                    </Button>
                  </Link>
                </div>
                
                {/* Trust indicators */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex -space-x-2">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white flex items-center justify-center">
                        <Star size={12} className="fill-secondary text-secondary" />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-semibold">
                    {lang === 'ka' ? '500+ ბედნიერი ოჯახი' : '500+ Happy Families'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Animators Section */}
      <section className="px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
                {t.ui.animatorsSubtitle || (lang === 'ka' ? 'გაიცანით ჩვენი' : 'Meet Our')}
              </span>
              <h2 className="text-4xl md:text-6xl font-display text-primary">
                {t.ui.animatorsTitle || (lang === 'ka' ? 'გმირები' : 'Animators')}
              </h2>
            </div>
            <Link 
              to="/animators" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary/30 text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-white hover:border-primary transition-all group"
            >
              {t.ui.seeAll || (lang === 'ka' ? 'ყველა' : 'See All')} 
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {(t.animators || []).slice(0, 3).map((a: any) => (
              <Link key={a.id} to="/animators/$animatorId" params={{ animatorId: a.id }}>
                <Card item={a} type="animator" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hosts Section */}
      <section className="px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent mb-2 block">
                {t.ui.hostsSubtitle || (lang === 'ka' ? 'ჩვენი' : 'Our')}
              </span>
              <h2 className="text-4xl md:text-6xl font-display text-accent">
                {t.ui.hostsTitle || (lang === 'ka' ? 'ანიმატORები' : 'Animators')}
              </h2>
            </div>
            <Link
              to="/hosts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-accent/30 text-accent font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white hover:border-accent transition-all group"
            >
              {t.ui.seeAll || (lang === 'ka' ? 'იხილეთ ყველა' : 'See All')}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {(t.hosts || []).slice(0, 3).map((h: any) => (
              <Link key={h.id} to="/hosts/$hostId" params={{ hostId: h.id }}>
                <Card item={h} type="animator" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block">
                {t.ui.programsSubtitle || (lang === 'ka' ? 'ასაკის მიხედვით' : 'By Age Group')}
              </span>
              <h2 className="text-4xl md:text-6xl font-display text-secondary">
                {t.ui.programsTitle || (lang === 'ka' ? 'პროგრამები' : 'Programs')}
              </h2>
            </div>
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-secondary/50 text-amber-600 font-bold text-xs uppercase tracking-wider hover:bg-secondary hover:text-foreground hover:border-secondary transition-all group"
            >
              {t.ui.seeAll || (lang === 'ka' ? 'იხილეთ ყველა' : 'See All')}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {(t.programs || []).map((p: any) => (
              <Link key={p.id} to="/programs/$programId" params={{ programId: p.id }}>
                <Card item={p} type="program" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent mb-2 block">
                {t.ui.servicesSubtitle || (lang === 'ka' ? 'სპეციალურად თქვენთვის' : 'Specially For You')}
              </span>
              <h2 className="text-4xl md:text-6xl font-display text-accent">
                {t.ui.services || (lang === 'ka' ? 'სერვისები' : 'Services')}
              </h2>
            </div>
            <Link 
              to="/services" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-accent/30 text-accent font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white hover:border-accent transition-all group"
            >
              {t.ui.seeAll || (lang === 'ka' ? 'ყველა' : 'See All')} 
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {(t.services || []).slice(0, 3).map((s: any) => (
              <Link key={s.id} to="/services/$serviceId" params={{ serviceId: s.id }}>
                <Card item={s} type="service" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-[3rem] p-10 md:p-16 lg:p-20 text-center bg-primary text-white shadow-[0_20px_60px_-15px_rgba(255,123,123,0.4)]">
            {/* Decorative subtle circles */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl lg:text-6xl mb-8 text-balance text-shadow-lg text-white">
                {lang === 'ka' ? 'მზად ხართ დღესასწაულისთვის?' : 'Ready to Celebrate?'}
              </h2>
              
              <Link to="/booking">
                <Button 
                  size="lg"
                  className="group shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)]"
                >
                  {t.ui.book || (lang === 'ka' ? 'დაჯავშნა' : 'Book Now')} 
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
