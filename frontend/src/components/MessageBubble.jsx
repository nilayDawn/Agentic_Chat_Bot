import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import AttachmentCard from "./AttachmentCard";
import ToolCallsDisplay from "./ToolCallsDisplay";

// ─── CodeBlock ────────────────────────────────────────────────────────────────

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid #2b2b2b",
        margin: "10px 0",
        fontSize: "13px",
      }}
    >
      {/* Code block header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          background: "#1a1a1a",
          borderBottom: "1px solid #2b2b2b",
        }}
      >
        <span style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            color: copied ? "#19c37d" : "#666",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.15s",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "#141414",
          fontSize: "12.5px",
          lineHeight: "1.6",
          padding: "14px",
        }}
        codeTagProps={{ style: { fontFamily: "monospace" } }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

// ─── MarkdownContent ──────────────────────────────────────────────────────────

function MarkdownContent({ content }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Render fenced code blocks with syntax highlighting
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline ? (
              <CodeBlock language={match?.[1]}>{children}</CodeBlock>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Strip redundant <pre> wrappers — CodeBlock renders its own container
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── TypingCursor ─────────────────────────────────────────────────────────────

function TypingCursor() {
  return (
    <span
      className="typing-cursor"
      style={{
        display: "inline-block",
        width: "2px",
        height: "16px",
        marginLeft: "2px",
        background: "#ececec",
        verticalAlign: "middle",
        borderRadius: "1px",
      }}
    />
  );
}

// ─── Avatars ──────────────────────────────────────────────────────────────────

function UserAvatar() {
  return (
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "#2f2f2f",
        border: "1px solid #3a3a3a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "12px",
        fontWeight: 600,
        color: "#888",
      }}
    >
      U
    </div>
  );
}

function BotAvatar() {
  return (
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #19c37d, #0d9e65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(25,195,125,0.3)",
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z"
          fill="white"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

/**
 * Renders a single user or assistant message with avatars, markdown,
 * tool-call indicators, error styling, and a copy button.
 */
export default function MessageBubble({ message, isStreaming }) {
  const [copied,  setCopied]  = useState(false);
  const [hovered, setHovered] = useState(false);

  const isUser  = message.role === "user";
  const isEmpty = !isUser && !message.content && isStreaming;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "18px 24px",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isUser && <BotAvatar />}

      <div
        style={{
          maxWidth: "72%",
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        {isUser ? (
          /* User bubble */
          <div
            style={{
              background: "#2f2f2f",
              border: "1px solid #3a3a3a",
              borderRadius: "18px",
              borderTopRightRadius: "4px",
              padding: "10px 16px",
              fontSize: "14px",
              color: "#ececec",
              lineHeight: "1.6",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            {message.fileName && (
              <AttachmentCard
                fileName={message.fileName}
                fileSize={message.fileSize}
              />
            )}
            <div>{message.content}</div>
          </div>
        ) : (
          /* Assistant bubble */
          <div>
            {message.isError ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "13.5px",
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                {message.content}
              </div>
            ) : isEmpty && !message.toolCalls?.length ? (
              /* Thinking indicator */
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#555" }}>
                <span
                  className="pulse"
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#19c37d",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: "13px" }}>Thinking…</span>
              </div>
            ) : (
              <div>
                <ToolCallsDisplay toolCalls={message.toolCalls} />
                {message.content && <MarkdownContent content={message.content} />}
                {isStreaming && <TypingCursor />}

                {/* Copy button (visible on hover after streaming ends) */}
                {!isStreaming && message.content && hovered && (
                  <button
                    onClick={handleCopy}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      marginTop: "8px",
                      fontSize: "11.5px",
                      color: copied ? "#19c37d" : "#555",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      transition: "color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#2a2a2a";
                      if (!copied) e.currentTarget.style.color = "#aaa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      if (!copied) e.currentTarget.style.color = "#555";
                    }}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && <UserAvatar />}
    </div>
  );
}
