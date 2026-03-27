import { useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { observeAuthState } from "@/lib/auth";
import AppPage from "@/routes/AppPage";
import SignInPage from "@/routes/SignInPage";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState((nextUser) => {
      setUser(nextUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-4 text-sm font-medium text-slate-700 shadow-lg backdrop-blur">
          Checking session...
        </div>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/app" : "/signin"} replace />} />
        <Route path="/signin" element={<SignInPage isAuthenticated={Boolean(user)} />} />
        <Route path="/singin" element={<Navigate to="/signin" replace />} />
        <Route
          path="/app"
          element={
            user ? <AppPage userName={user.displayName} /> : <Navigate to="/signin" replace />
          }
        />
        <Route path="*" element={<Navigate to={user ? "/app" : "/signin"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
