"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import { Loader2 } from "lucide-react";

const SUGGESTIONS = [
  {
    icon: "📈",
    label: "Stock info",
    text: "What is the current stock price of Apple (AAPL)?",
  },
  {
    icon: "🌤",
    label: "Weather",
    text: "What is the weather in New York City right now?",
  },
  {
    icon: "🔍",
    label: "Web search",
    text: "Search the web for the latest AI news.",
  },
  {
    icon: "🧮",
    label: "Calculator",
    text: "Calculate 15% tip on a $87.50 restaurant bill.",
  },
];

function WelcomeScreen({ onSuggestionClick }) {
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
      {/* Icon */}
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
          marginBottom: "36px",
        }}
      >
        Agentic AI with tools for weather, stocks, web search,
        calculations, and document Q&amp;A.
      </p>

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
          <SuggestionCard key={s.label} item={s} onClick={() => onSuggestionClick(s.text)} />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ item, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px",
        padding: "16px",
        borderRadius: "12px",
        background: hovered ? "#2a2a2a" : "#212121",
        border: hovered ? "1px solid #19c37d44" : "1px solid #2b2b2b",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{item.icon}</span>
        <span
          style={{
            fontSize: "13.5px",
            fontWeight: 600,
            color: hovered ? "#19c37d" : "#d1d1d1",
            transition: "color 0.15s",
          }}
        >
          {item.label}
        </span>
      </div>
      <span
        style={{
          fontSize: "12px",
          color: "#555",
          lineHeight: 1.5,
        }}
      >
        {item.text}
      </span>
    </button>
  );
}

export default function ChatArea({
  messages,
  isStreaming,
  loadingHistory,
  onSuggestionClick,
}) {
  const bottomRef = useRef(null);

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
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "13px" }}>Loading conversation…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (messages.length === 0) {
    return <WelcomeScreen onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", width: "100%", paddingBottom: "8px" }}>
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={
              isStreaming && idx === messages.length - 1 && msg.role === "assistant"
            }
          />
        ))}
        <div ref={bottomRef} style={{ height: "8px" }} />
      </div>
    </div>
  );
}
