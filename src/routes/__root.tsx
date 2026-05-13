import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import { Nav, Footer, Blobs } from "@/components/site/Layout";
import { ThemeApplier } from "@/components/site/ThemeApplier";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-bold">Page not found</h2>
        <Link to="/" className="mt-6 inline-flex px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm">Go home</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (isAdmin) return <><ThemeApplier /><Outlet /></>;
  return (
    <div className="min-h-screen flex flex-col relative">
      <ThemeApplier />
      <Blobs />
      <Nav />
      <main className="pt-20 md:pt-24 flex-grow relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
