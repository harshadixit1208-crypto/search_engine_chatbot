import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

interface ChatProps {
  session: Session;
}

export default function Chat({ session }: ChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    // Get user email from session
    setUserEmail(session.user?.email || null);

    // Create or get a conversation for this user
    initializeConversation();
  }, [session]);

  const initializeConversation = async () => {
    try {
      // Create a new conversation
      const { data: conversation, error: convError } = await supabase
        .from("Conversation")
        .insert({
          title: `Chat - ${new Date().toLocaleString()}`,
          slug: `chat-${Date.now()}`,
          userId: session.user.id,
        })
        .select("id")
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        return;
      }

      setConversationId(conversation.id);
    } catch (err) {
      console.error("Error initializing conversation:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Save user message to database
      await supabase.from("Message").insert({
        content: input,
        role: "User",
        conversationId,
      });

      // Call your backend API to get the answer
      const response = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant message to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to database
      await supabase.from("Message").insert({
        content: data.answer,
        role: "Assistant",
        conversationId,
      });
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `Error: ${
          error instanceof Error ? error.message : "Failed to get response"
        }`,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarContent}>
          <h2 style={styles.sidebarTitle}>Chat</h2>
          <button style={styles.newChatButton}>+ New Chat</button>
        </div>
        <div style={styles.userSection}>
          <p style={styles.userEmail}>{userEmail}</p>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <h2>Welcome to Search Engine Chatbot</h2>
              <p>Ask any question and get instant answers from the web</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={
                  msg.role === "user"
                    ? styles.userMessageWrapper
                    : styles.assistantMessageWrapper
                }
              >
                <div
                  style={
                    msg.role === "user"
                      ? styles.userMessage
                      : styles.assistantMessage
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={styles.assistantMessageWrapper}>
              <div style={styles.assistantMessage}>Thinking...</div>
            </div>
          )}
        </div>

        <div style={styles.inputArea}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask anything..."
            style={styles.input}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            style={styles.sendButton}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex" as const,
    height: "100vh",
    background: "#fff",
  },
  sidebar: {
    width: "260px",
    background: "#f7f7f7",
    borderRight: "1px solid #e5e5e5",
    display: "flex" as const,
    flexDirection: "column" as const,
    justifyContent: "space-between" as const,
    padding: "16px",
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarTitle: {
    fontSize: "20px",
    fontWeight: "bold" as const,
    marginBottom: "16px",
    color: "#333",
  },
  newChatButton: {
    width: "100%",
    padding: "10px 16px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer" as const,
    fontSize: "14px",
    fontWeight: "500" as const,
    color: "#333",
    transition: "all 0.3s ease",
  },
  userSection: {
    borderTop: "1px solid #e5e5e5",
    paddingTop: "16px",
  },
  userEmail: {
    fontSize: "12px",
    color: "#666",
    marginBottom: "12px",
    wordBreak: "break-word" as const,
  },
  logoutButton: {
    width: "100%",
    padding: "8px 12px",
    background: "#ef4444",
    color: "white",
    border: "none" as const,
    borderRadius: "6px",
    cursor: "pointer" as const,
    fontSize: "14px",
    fontWeight: "500" as const,
  },
  mainContent: {
    flex: 1,
    display: "flex" as const,
    flexDirection: "column" as const,
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "20px",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: "12px",
  },
  emptyState: {
    display: "flex" as const,
    flexDirection: "column" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    height: "100%",
    color: "#999",
    textAlign: "center" as const,
  },
  userMessageWrapper: {
    display: "flex" as const,
    justifyContent: "flex-end" as const,
    marginBottom: "8px",
  },
  assistantMessageWrapper: {
    display: "flex" as const,
    justifyContent: "flex-start" as const,
    marginBottom: "8px",
  },
  userMessage: {
    background: "#667eea",
    color: "white",
    padding: "12px 16px",
    borderRadius: "12px",
    maxWidth: "70%",
    wordWrap: "break-word" as const,
    fontSize: "14px",
  },
  assistantMessage: {
    background: "#f3f3f3",
    color: "#333",
    padding: "12px 16px",
    borderRadius: "12px",
    maxWidth: "70%",
    wordWrap: "break-word" as const,
    fontSize: "14px",
  },
  inputArea: {
    display: "flex" as const,
    gap: "8px",
    padding: "16px 20px",
    borderTop: "1px solid #e5e5e5",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none" as const,
  },
  sendButton: {
    padding: "10px 20px",
    background: "#667eea",
    color: "white",
    border: "none" as const,
    borderRadius: "6px",
    cursor: "pointer" as const,
    fontSize: "14px",
    fontWeight: "500" as const,
    transition: "all 0.3s ease",
  },
};
