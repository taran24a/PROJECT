import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import { useAuth } from "@/store/auth";
import { Shield, Eye, EyeOff, Settings, LogOut, Menu, Home, Wallet, Sparkles, Moon, Palette } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/investments", label: "Investments" },
  { to: "/stocks", label: "Stocks" },
  { to: "/expenses", label: "Expenses" },
  { to: "/goals", label: "Goals" },
  { to: "/insights", label: "Insights" },
  { to: "/challenges", label: "Challenges" },
  { to: "/coach", label: "Coach" },
];

function Navbar() {
  const masked = useUIStore((s) => s.masked);
  const toggleMasked = useUIStore((s) => s.toggleMasked);
  const panic = useUIStore((s) => s.panic);
  const togglePanic = useUIStore((s) => s.togglePanic);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { user, token, hydrate, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Apply theme class to html element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'midnight', 'deepblue');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      // Keep dark variants active while applying custom theme
      root.classList.add('dark');
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/60 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3 flex-1">
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
                  <nav className="grid gap-1">
                    {nav.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "px-3 py-2 rounded-lg text-sm",
                            isActive ? "text-neon-teal bg-neon-teal/10" : "text-foreground/80 hover:bg-white/5"
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                  <div className="mt-4 grid gap-2">
                    <Button onClick={() => document.dispatchEvent(new CustomEvent("open-quick-expense"))}>Quick Add Expense</Button>
                    <Button variant="secondary" onClick={() => setCommandOpen(true)}>Search (⌘K / Ctrl+K)</Button>
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-4 grid gap-2">
                    <Button variant="ghost" onClick={() => navigate("/settings")}>Settings</Button>
                    <Button variant="destructive" onClick={() => { logout(); navigate("/auth"); }}>Logout</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Link
              to="/"
              onClick={(e) => {
                if (token) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className={cn("flex min-w-0 items-center gap-2", token ? "cursor-default" : "")}
              aria-label="FinanceFlow home"
              aria-disabled={Boolean(token)}
            >
              <img src="/favicon.ico" alt="FinanceFlow" className="h-8 w-8 shrink-0" />
              <span className="font-extrabold tracking-tight text-lg truncate max-w-[8rem] sm:max-w-none">FinanceFlow</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2 ml-6">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 text-sm rounded-lg transition-colors",
                      isActive ? "text-neon-teal bg-neon-teal/10" : "text-foreground/70 hover:text-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" title="Theme">
                  <Palette className="opacity-80" />
                  <span className="hidden sm:inline">Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('midnight')}>
                  <Moon className="mr-2 h-4 w-4" /> Midnight Purple
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('deepblue')}>
                  <Moon className="mr-2 h-4 w-4" /> Deep Blue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" onClick={toggleMasked} title="Toggle masked amounts (M)">
              {masked ? <Eye className="opacity-80" /> : <EyeOff className="opacity-80" />}
              <span className="hidden sm:inline">Mask</span>
            </Button>
            <Button variant={panic ? "destructive" : "secondary"} size="sm" onClick={togglePanic} title="Panic hide numbers (H)">
              <Shield className="opacity-80" />
              <span className="hidden sm:inline">Panic</span>
            </Button>
            {/* Profile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Profile menu" className="ml-2 rounded-full border border-white/10 p-[2px] hover:border-white/20 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user?.email ? (
                    <div className="text-xs">
                      <div className="font-medium">Signed in</div>
                      <div className="opacity-80 truncate">{user.email}</div>
                    </div>
                  ) : (
                    <div className="text-xs">Not signed in</div>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); navigate("/auth"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Bottom Tab Bar (mobile only) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-sm grid grid-cols-3">
          <NavLink to="/dashboard" className={({ isActive }) => cn("flex flex-col items-center justify-center py-2 text-xs", isActive || location.pathname.startsWith("/dashboard") ? "text-neon-teal" : "text-foreground/70") }>
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => cn("flex flex-col items-center justify-center py-2 text-xs", isActive || location.pathname.startsWith("/expenses") ? "text-neon-teal" : "text-foreground/70") }>
            <Wallet className="h-5 w-5" />
            <span>Expenses</span>
          </NavLink>
          <NavLink to="/coach" className={({ isActive }) => cn("flex flex-col items-center justify-center py-2 text-xs", isActive || location.pathname.startsWith("/coach") ? "text-neon-teal" : "text-foreground/70") }>
            <Sparkles className="h-5 w-5" />
            <span>Coach</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}

export { Navbar };
export default Navbar;
