import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Wait a moment for the hash to be processed by Supabase auth
        await new Promise(resolve => setTimeout(resolve, 500));

        // Now try to get the session - Supabase should have processed the hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          setTimeout(() => navigate("/auth"), 2000);
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to chat
          navigate("/chat");
        } else {
          // Still no session, redirect to auth
          navigate("/auth");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setTimeout(() => navigate("/auth"), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h2>Authenticating...</h2>
        {error && <p style={styles.error}>{error}</p>}
        <p>Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  content: {
    background: "white",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center" as const,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
  },
  error: {
    color: "#e74c3c",
    marginTop: "10px",
  },
} as const;
