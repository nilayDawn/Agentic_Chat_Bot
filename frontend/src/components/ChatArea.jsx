import { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { SUGGESTIONS } from "../constants/suggestions";

// ─── SuggestionCard ───────────────────────────────────────────────────────────

function SuggestionCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="suggestion-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px",
        padding: "16px",
        borderRadius: "12px",
        background: "#212121",
        border: "1px solid #2b2b2b",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{item.icon}</span>
        <span
          style={{ fontSize: "13.5px", fontWeight: 600, color: "#d1d1d1", transition: "color 0.15s" }}
          className="suggestion-label"
        >
          {item.label}
        </span>
      </div>
      <span style={{ fontSize: "12px", color: "#555", lineHeight: 1.5 }}>{item.text}</span>
    </button>
  );
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

function WelcomeScreen({ onSuggestionClick, onOpenSettings }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        overflowY: "auto",
      }}
    >
      {/* Brand icon */}
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #19c37d 0%, #0d9e65 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(25,195,125,0.25)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z"
            fill="white"
            opacity="0.9"
          />
          <path d="M9 21h6M10 18h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h1
        style={{
          fontSize: "30px",
          fontWeight: 700,
          color: "#ececec",
          marginBottom: "10px",
          letterSpacing: "-0.5px",
          textAlign: "center",
        }}
      >
        How can I help you?
      </h1>

      <p
        style={{
          fontSize: "14px",
          color: "#666",
          maxWidth: "340px",
          textAlign: "center",
          lineHeight: 1.6,
          marginBottom: "20px",
        }}
      >
        Agentic AI with tools for weather, stocks, web search, calculations, and document Q&amp;A.
      </p>

      {/* API key notice */}
      <div
        onClick={onOpenSettings}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpenSettings()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 16px",
          borderRadius: "10px",
          background: "rgba(168, 85, 247, 0.08)",
          border: "1px solid rgba(168, 85, 247, 0.2)",
          fontSize: "12.5px",
          color: "#c084fc",
          cursor: "pointer",
          marginBottom: "32px",
          width: "100%",
          maxWidth: "480px",
          textAlign: "center",
          justifyContent: "center",
          transition: "background 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(168, 85, 247, 0.12)";
          e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(168, 85, 247, 0.08)";
          e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.2)";
        }}
      >
        <span style={{ fontSize: "14px" }}>🔑</span>
        <span>
          Configure your custom <strong>API Keys</strong> in{" "}
          <span style={{ textDecoration: "underline", color: "#d8b4fe", fontWeight: 600 }}>
            Settings
          </span>{" "}
          to use different models
        </span>
      </div>

      {/* Suggestion cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
          width: "100%",
          maxWidth: "560px",
        }}
      >
        {SUGGESTIONS.map((s) => (
          <SuggestionCard
            key={s.label}
            item={s}
            onClick={() => onSuggestionClick(s.text)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── ChatArea ─────────────────────────────────────────────────────────────────

/**
 * Renders the scrollable message list, a loading skeleton, or the welcome screen.
 */
export default function ChatArea({
  messages,
  isStreaming,
  loadingHistory,
  onSuggestionClick,
  onOpenSettings,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (loadingHistory) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
          color: "#555",
        }}
      >
        <Loader2 size={24} className="spin" />
        <span style={{ fontSize: "13px" }}>Loading conversation…</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <WelcomeScreen
        onSuggestionClick={onSuggestionClick}
        onOpenSettings={onOpenSettings}
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div
        style={{ maxWidth: "720px", margin: "0 auto", width: "100%", paddingBottom: "8px" }}
      >
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"}
          />
        ))}
        <div ref={bottomRef} style={{ height: "8px" }} />
      </div>
    </div>
  );
}
