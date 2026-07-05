import { BookOpenCheck, LogOut, Mic2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  userName: string | null;
  subtitle: string;
};

const navItems = [
  { to: "/app", label: "Practice", icon: Mic2 },
  { to: "/flash_cards", label: "Cards", icon: BookOpenCheck },
];

function AppHeader({ userName, subtitle }: AppHeaderProps) {
  const location = useLocation();

  return (
    <header className="space-y-4 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-start gap-5">
          <img
            src="/app_icon.png"
            alt="re-say icon"
            className="h-16 w-16 rounded-2xl shadow-md ring-1 ring-black/10"
          />
          <div className="space-y-1">
            <span className="text-balance text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
              re-say!
            </span>
            <p className="text-sm font-light text-slate-600 dark:text-slate-300">{subtitle}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={logout}
          className="h-11 shrink-0 border-slate-300/80 bg-white/85 px-4 text-sm"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  isActive
                    ? "border-orange-500 bg-orange-500 text-white shadow-sm hover:bg-orange-500/90"
                    : "border-slate-300/80 bg-white/85 text-slate-700 shadow-xs hover:bg-cyan-50 hover:text-slate-950",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {userName && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Signed in as {userName}
          </p>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
