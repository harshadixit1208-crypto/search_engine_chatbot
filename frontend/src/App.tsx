import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { createOrUpdateUser } from "./services/userService";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Callback from "./pages/Callback";

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Create or update user in database
        createOrUpdateUser(session.user).catch(err => {
          console.error("Failed to sync user:", err);
        });
      }
      setSession(session);
      setLoading(false);
    });

    // Listen for authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          // Create or update user in database when they log in
          await createOrUpdateUser(session.user).catch(err => {
            console.error("Failed to sync user:", err);
          });
        }
        setSession(session);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666"
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* OAuth callback route */}
        <Route path="/auth/callback" element={<Callback />} />

        {/* If user is logged in, redirect to chat; otherwise show auth */}
        <Route
          path="/auth"
          element={session ? <Navigate to="/chat" replace /> : <Auth />}
        />
        {/* If user is logged in, show chat; otherwise redirect to auth */}
        <Route
          path="/chat"
          element={session ? <Chat session={session} /> : <Navigate to="/auth" replace />}
        />
        {/* Default route redirects to auth if not logged in, chat if logged in */}
        <Route
          path="/"
          element={session ? <Navigate to="/chat" replace /> : <Navigate to="/auth" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;