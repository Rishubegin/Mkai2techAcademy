import { useState } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn, resolveMediaUrl } from "@/lib/utils";
import NotificationBell from "@/components/common/NotificationBell";
import ThemeToggle from "@/components/common/ThemeToggle";

// Primary links stay flat in the desktop nav; the "Explore" dropdown groups
// the lower-traffic pages so the desktop bar doesn't get crowded. The
// mobile menu ignores this split and shows every link flat (see below).
const primaryLinks = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Gallery", to: "/gallery" },
];

const exploreLinks = [
  { label: "Faculty", to: "/faculty" },
  { label: "Events", to: "/events" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "FAQ", to: "/faq" },
];

const navLinks = [...primaryLinks, ...exploreLinks];

const navLinkClass = ({ isActive }) =>
  cn(
    "pb-1 border-b-2 transition-colors",
    isActive
      ? "border-gold text-navy dark:text-gold font-medium"
      : "border-transparent text-dark-gray dark:text-white/80 hover:border-gold/50 hover:text-navy dark:hover:text-gold",
  );

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExploreActive = exploreLinks.some((link) => link.to === location.pathname);

  const handleLogout = async () => {
    // Navigate away first: clearing the user while still on a protected
    // page (e.g. /dashboard, /admin/*, the enrolment form) makes
    // ProtectedRoute redirect to /loginSignUp on its own, racing with this
    // navigation. Leaving the protected route before logging out avoids
    // that race entirely.
    navigate("/");
    await logout();
  };

  const dashboardPath = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="bg-card text-foreground border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-[#faf4e8] p-1 ring-1 ring-black/5 dark:ring-gold/40"
          >
            <img
              className="w-9 h-9 object-contain"
              src="/mKai2Tech.png"
              alt="logo"
            />
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-navy dark:text-white">
            M Kai<sup>2</sup> Tech Academy
          </h1>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex items-center gap-6">
          <ul className="flex items-center gap-6">
            {primaryLinks.map((link) => (
              <li key={link.to} className="cursor-pointer">
                <NavLink to={link.to} end={link.to === "/"} className={navLinkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="relative">
            <button
              type="button"
              onClick={() => setExploreOpen(!exploreOpen)}
              className={cn(
                "flex items-center gap-1 pb-1 border-b-2 transition-colors cursor-pointer outline-none",
                isExploreActive
                  ? "border-gold text-navy dark:text-gold font-medium"
                  : "border-transparent text-dark-gray dark:text-white/80 hover:border-gold/50 hover:text-navy dark:hover:text-gold",
              )}
            >
              Explore
              <ChevronDown size={16} className={cn("transition-transform", exploreOpen && "rotate-180")} />
            </button>

            {exploreOpen && (
              <>
                {/* Click-outside-to-close backdrop, same pattern as the gallery lightbox */}
                <div className="fixed inset-0 z-40" onClick={() => setExploreOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 min-w-40 rounded-md border border-border bg-popover text-popover-foreground shadow-lg py-1">
                  {exploreLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setExploreOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "block px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "text-navy dark:text-gold font-medium"
                            : "text-dark-gray dark:text-white/80 hover:bg-light-blue/40 dark:hover:bg-white/5 hover:text-navy dark:hover:text-gold",
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>

          <ThemeToggle />
          <NotificationBell />

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === "student" && (
                  <Link to="/profile">
                    <Avatar className="h-8 w-8 ring-2 ring-gold">
                      <AvatarImage
                        src={user.profileImage ? resolveMediaUrl(user.profileImage) : undefined}
                      />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                )}
                <Button variant="outline" asChild>
                  <Link to={dashboardPath}>{user.name?.split(" ")[0]}</Link>
                </Button>
                <Button onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/loginSignUp?mode=login">Login</Link>
                </Button>

                <Button asChild>
                  <Link to="/loginSignUp?mode=signup">Signup</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-3">
          <ThemeToggle />
          <button
            className="cursor-pointer text-navy dark:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-border px-4 py-4 space-y-4">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.to} className="cursor-pointer">
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <Button variant="outline" asChild>
                  <Link to={dashboardPath} onClick={() => setIsOpen(false)}>
                    {user.name?.split(" ")[0]}
                  </Link>
                </Button>
                <Button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/loginSignUp?mode=login" onClick={() => setIsOpen(false)}>
                    Login
                  </Link>
                </Button>

                <Button asChild>
                  <Link to="/loginSignUp?mode=signup" onClick={() => setIsOpen(false)}>
                    Signup
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
