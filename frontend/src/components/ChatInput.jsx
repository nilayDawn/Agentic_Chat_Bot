"use client";

import { useRef, useCallback, useState } from "react";
import { Send, Square, Paperclip, X, Loader2, AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { uploadDocument } from "@/lib/api";

const MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "mistral-small-latest", label: "Mistral Small" },
  { value: "mistral-medium-latest", label: "Mistral Medium" },
  { value: "mistral-large-latest", label: "Mistral Large" },
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".py", ".csv"];

function FileBadge({ file, onRemove, uploadState }) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  const allowed = ALLOWED_EXTENSIONS.includes(ext);

  const color =
    !allowed || uploadState === "error"
      ? { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", text: "#ef4444" }
      : uploadState === "success"
      ? { bg: "rgba(25,195,125,0.15)", border: "rgba(25,195,125,0.3)", text: "#19c37d" }
      : { bg: "#2a2a2a", border: "#3a3a3a", text: "#999" };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "20px",
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
        fontSize: "12px",
      }}
    >
      {uploadState === "uploading" ? (
        <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
      ) : uploadState === "success" ? (
        <CheckCircle size={11} />
      ) : !allowed || uploadState === "error" ? (
        <AlertCircle size={11} />
      ) : (
        <Paperclip size={11} />
      )}
      <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {file.name}
      </span>
      <button
        onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex" }}
      >
        <X size={11} />
      </button>
    </div>
  );
}

export default function ChatInput({
  onSend,
  onStop,
  isStreaming,
  selectedModel,
  onModelChange,
  activeThreadId,
}) {
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadState, setUploadState] = useState("idle");
  const [uploadError, setUploadError] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    if (attachedFile && uploadState === "idle" && activeThreadId) {
      setUploadState("uploading");
      try {
        await uploadDocument(attachedFile, activeThreadId);
        setUploadState("success");
        setTimeout(() => {
          setAttachedFile(null);
          setUploadState("idle");
          setUploadError("");
        }, 2000);
      } catch (err) {
        setUploadState("error");
        setUploadError(err.message || "Upload failed");
        return;
      }
    }

    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(text);
  }, [inputText, isStreaming, attachedFile, uploadState, activeThreadId, onSend]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    setUploadState("idle");
    setUploadError("");
    e.target.value = "";
  };

  const canSend = inputText.trim().length > 0 && !isStreaming;

  return (
    <div
      style={{
        padding: "12px 16px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {uploadError && uploadState === "error" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "8px",
            fontSize: "12px",
            color: "#ef4444",
          }}
        >
          <AlertCircle size={12} />
          {uploadError}
        </div>
      )}

      {/* Main input box */}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          borderRadius: "16px",
          background: "#2f2f2f",
          border: "1px solid #3a3a3a",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "border-color 0.2s",
        }}
        onFocus={() => {}}
      >
        {/* File badge */}
        {attachedFile && (
          <div style={{ padding: "10px 14px 0" }}>
            <FileBadge
              file={attachedFile}
              onRemove={() => { setAttachedFile(null); setUploadState("idle"); setUploadError(""); }}
              uploadState={uploadState}
            />
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); adjustHeight(); }}
          onKeyDown={handleKeyDown}
          placeholder="Message AgentChat…"
          rows={1}
          disabled={isStreaming}
          style={{
            width: "100%",
            resize: "none",
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "14px 16px 6px",
            fontSize: "14px",
            color: "#ececec",
            lineHeight: "1.6",
            minHeight: "50px",
            maxHeight: "180px",
            fontFamily: "inherit",
          }}
        />

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 10px 10px",
          }}
        >
          {/* Left tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* Attach file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#666",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#3a3a3a"; e.currentTarget.style.color = "#aaa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#666"; }}
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.py,.csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/* Model selector */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                style={{
                  appearance: "none",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#666",
                  fontSize: "12px",
                  cursor: "pointer",
                  paddingRight: "16px",
                  paddingLeft: "6px",
                  paddingTop: "4px",
                  paddingBottom: "4px",
                  borderRadius: "6px",
                  fontFamily: "inherit",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#aaa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; }}
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value} style={{ background: "#1a1a1a", color: "#ececec" }}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                style={{
                  position: "absolute",
                  right: "2px",
                  color: "#555",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              onClick={onStop}
              title="Stop generating"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "none",
                background: "#ececec",
                color: "#212121",
                cursor: "pointer",
                flexShrink: 0,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              title="Send message"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "none",
                background: canSend ? "#ececec" : "#2a2a2a",
                color: canSend ? "#212121" : "#444",
                cursor: canSend ? "pointer" : "default",
                flexShrink: 0,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ marginTop: "10px", fontSize: "11.5px", color: "#3a3a3a", textAlign: "center" }}>
        AgentChat can make mistakes. Verify important information.
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
