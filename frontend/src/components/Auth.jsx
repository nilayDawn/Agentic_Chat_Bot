import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({
          text: "Registration successful! Please check your email inbox to verify your account.",
          type: "success",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setMessage({ text: err.message || "An error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle at 10% 20%, rgb(26, 20, 35) 0%, rgb(15, 15, 18) 90.2%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "40px",
          borderRadius: "24px",
          background: "rgba(23, 23, 27, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          textAlign: "center",
        }}
      >
        {/* Glow Element */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "120px",
            height: "120px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "28px",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.03em",
          }}
        >
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p
          style={{
            margin: "0 0 28px 0",
            fontSize: "14px",
            color: "#8e8e93",
          }}
        >
          {isSignUp
            ? "Sign up to begin chatting with Agentic Bot"
            : "Sign in to access your secure chat history"}
        </p>

        {message.text && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              textAlign: "left",
              marginBottom: "20px",
              lineHeight: "1.4",
              background: message.type === "error" ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
              border: message.type === "error" ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid rgba(16, 185, 129, 0.15)",
              color: message.type === "error" ? "#f87171" : "#34d399",
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ textAlign: "left" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#a1a1aa",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s, background-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8b5cf6";
                e.target.style.background = "rgba(255, 255, 255, 0.05)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.target.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            />
          </div>

          <div style={{ textAlign: "left" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#a1a1aa",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s, background-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8b5cf6";
                e.target.style.background = "rgba(255, 255, 255, 0.05)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.target.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "12px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.1s active, opacity 0.2s",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
            }}
          >
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "24px", fontSize: "13px", color: "#a1a1aa" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage({ text: "", type: "" });
            }}
            style={{
              background: "none",
              border: "none",
              color: "#a78bfa",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
