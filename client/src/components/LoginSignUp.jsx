import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Home } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const user = isLogin
        ? await login(email, password)
        : await signup(name, email, password);

      const redirectTo = searchParams.get("redirect");
      navigate(redirectTo || (user.role === "admin" ? "/admin" : "/dashboard"));
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.Error || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Theme toggle + back-to-home, pinned to the top-right of the whole
          page (this route has no site Header of its own). */}
      <div className="fixed right-4 top-4 z-20 flex items-center gap-1 rounded-full bg-card/80 p-1 shadow-sm ring-1 ring-border backdrop-blur-sm">
        <ThemeToggle />
        <Link
          to="/"
          aria-label="Back to home"
          className="p-1 text-navy transition-colors hover:text-gold dark:text-white"
        >
          <Home size={20} />
        </Link>
      </div>

      {/* Left — brand image + tagline, hidden below lg so the form gets full
          width on phones/tablets instead of squeezing both panels in. */}
      <div className="relative hidden lg:flex lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1462536943532-57a629f6cc60?w=1200&h=1600&fit=crop"
          alt="Graduates celebrating their success"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/20" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-[#faf4e8] p-1 ring-1 ring-gold/40">
              <img className="h-9 w-9 object-contain" src="/mKai2Tech.png" alt="logo" />
            </span>
            <span className="text-lg font-semibold">M Kai² Tech Academy</span>
          </Link>

          <div className="max-w-md space-y-3">
            <h1 className="text-4xl font-bold leading-tight">
              Give us a chance to improve your life
            </h1>
            <p className="text-base text-white/80">
              Join students building real skills through hands-on, in-person
              coaching in Lucknow — school academics, competitive exams, and
              programming.
            </p>
          </div>
        </div>
      </div>

      {/* Right — the actual login/signup form */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center space-y-2">
            <Link
              to="/"
              className="mx-auto lg:hidden inline-flex items-center justify-center rounded-full bg-[#faf4e8] p-1.5 ring-1 ring-black/5 dark:ring-gold/40"
            >
              <img className="w-11 h-11 object-contain" src="/mKai2Tech.png" alt="logo" />
            </Link>
            <CardTitle className="text-2xl">
              {isLogin ? "Login" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Enter your credentials to access your account"
                : "Fill the details to create your account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {!isLogin && (
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
              </Button>
            </form>

            <p className="text-sm text-center">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span
                className="underline cursor-pointer"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
              >
                {isLogin ? "Sign up" : "Login"}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
