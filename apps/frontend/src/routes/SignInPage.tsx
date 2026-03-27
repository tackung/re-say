import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Chrome, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginWithGoogle } from "@/lib/auth";

type SignInPageProps = {
  isAuthenticated: boolean;
};

function SignInPage({ isAuthenticated }: SignInPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleGoogleSignIn = async (): Promise<void> => {
    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-100">
        <div className="absolute left-[-8%] top-[-8%] h-80 w-80 rounded-full bg-orange-300/40 blur-3xl" />
        <div className="absolute right-[-12%] top-[10%] h-[28rem] w-[28rem] rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute bottom-[-16%] left-[34%] h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-md">
          <div className="space-y-6 rounded-[2rem] border border-white/60 bg-white/70 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4">
              <img
                src="/app_icon.png"
                alt="re-say icon"
                className="h-16 w-16 rounded-2xl shadow-md ring-1 ring-black/10"
              />
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-[0.28em] text-slate-500 uppercase">
                  re-say!
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Practice out loud.
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Chrome className="size-4" />
                )}
                {isSubmitting ? "Signing in..." : "Sign in with Google"}
              </Button>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </div>
            <div className="-mt-2 space-y-1">
              <p className="text-sm leading-4 text-slate-600">
                Sign in with your
                <br />
                Google account to continue.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default SignInPage;
