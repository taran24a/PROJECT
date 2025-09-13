import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function LandingNavbar() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/60 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 flex-1">
          {/* Mobile menu */}
          <div className="md:hidden shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex items-center gap-2 mb-4">
                  <img src="/favicon.ico" alt="FinanceFlow" className="h-8 w-8" />
                  <span className="font-extrabold tracking-tight text-lg">FinanceFlow</span>
                </div>
                <nav className="grid gap-1 text-sm">
                  <a href="#features" className="px-3 py-2 rounded-lg hover:bg-white/5">Features</a>
                  <a href="#reviews" className="px-3 py-2 rounded-lg hover:bg-white/5">Reviews</a>
                  <a href="#pricing" className="px-3 py-2 rounded-lg hover:bg-white/5">Pricing</a>
                  <a href="#about" className="px-3 py-2 rounded-lg hover:bg-white/5">About</a>
                </nav>
                <div className="mt-6 grid gap-2">
                  <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-700" onClick={() => navigate("/auth")}>Get Started</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="FinanceFlow landing">
            <img src="/favicon.ico" alt="FinanceFlow" className="h-8 w-8 shrink-0" />
            <span className="font-extrabold tracking-tight text-lg truncate max-w-[8rem] sm:max-w-none">FinanceFlow</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-foreground/80">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#reviews" className="hover:text-foreground">Reviews</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#about" className="hover:text-foreground">About</a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/auth")}>Sign In</Button>
          <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-700" onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </div>
    </header>
  );
}