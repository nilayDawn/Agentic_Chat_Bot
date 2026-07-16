import { useRef, useCallback, useState } from "react";
import { Send, Square, Paperclip, ChevronDown, Key } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { uploadDocument } from "../lib/api";
import { validateFile } from "../utils/fileUtils";
import { MODELS } from "../constants/models";
import FileCard from "./FileCard";

/**
 * ChatInput
 * The message input bar at the bottom of the chat.
 * Handles text input, file attachment/upload, model selection,
 * and the send/stop lifecycle.
 */
export default function ChatInput({
  onSend,
  onStop,
  isStreaming,
  selectedModel,
  selectedProvider,
  onModelChange,
  activeThreadId,
  setActiveThreadId,
  onOpenSettings,
}) {
  const [inputText,   setInputText]   = useState("");
  const [attachedFile,setAttachedFile]= useState(null);
  const [uploadState, setUploadState] = useState("idle"); // "idle" | "uploading" | "success" | "error"
  const [uploadError, setUploadError] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Textarea auto-resize ──────────────────────────────────────────────────
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isStreaming || uploadState === "uploading") return;

    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const fileInfo =
      uploadState === "success" && attachedFile
        ? { name: attachedFile.name, size: attachedFile.size }
        : null;

    onSend(text, fileInfo);

    setAttachedFile(null);
    setUploadState("idle");
    setUploadError("");
  }, [inputText, isStreaming, uploadState, attachedFile, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── File attachment ───────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      setAttachedFile(file);
      setUploadState("idle");
      setUploadError("");

      if (!validateFile(file, setUploadState, setUploadError)) return;

      setUploadState("uploading");

      // Ensure a thread ID exists before uploading
      let threadId = activeThreadId;
      if (!threadId) {
        threadId = uuidv4();
        setActiveThreadId?.(threadId);
      }

      try {
        await uploadDocument(file, threadId);
        setUploadState("success");
        setUploadError("");
      } catch (err) {
        setUploadState("error");
        setUploadError(err.message || "Ingestion failed");
      }
    },
    [activeThreadId, setActiveThreadId]
  );

  const handleRemoveFile = useCallback(() => {
    setAttachedFile(null);
    setUploadState("idle");
    setUploadError("");
  }, []);

  // ── Model selector ────────────────────────────────────────────────────────
  const hasModel    = MODELS.some((m) => m.value === selectedModel);
  const selectModels = hasModel
    ? MODELS
    : [...MODELS, { value: selectedModel, label: `Custom (${selectedModel})`, provider: selectedProvider || "gemini" }];

  const handleModelChange = (e) => {
    const val   = e.target.value;
    const found = selectModels.find((m) => m.value === val);
    onModelChange(val, found?.provider ?? selectedProvider ?? "gemini");
  };

  const canSend = inputText.trim().length > 0 && !isStreaming && uploadState !== "uploading";

  return (
    <div
      style={{
        padding: "12px 16px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Input box */}
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
      >
        {/* Attached file preview */}
        {attachedFile && (
          <div style={{ padding: "14px 16px 0", display: "flex", gap: "10px" }}>
            <FileCard
              file={attachedFile}
              onRemove={handleRemoveFile}
              uploadState={uploadState}
              uploadError={uploadError}
            />
          </div>
        )}

        {/* Text input */}
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
          {/* Left: attach + model selector + API keys */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              style={toolbarBtnStyle}
              onMouseEnter={(e) => applyHover(e, "#3a3a3a", "#aaa")}
              onMouseLeave={(e) => applyHover(e, "transparent", "#666")}
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
                onChange={handleModelChange}
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
                onMouseEnter={(e) => (e.currentTarget.style.color = "#aaa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
              >
                {selectModels.map((m) => (
                  <option key={m.value} value={m.value} style={{ background: "#1a1a1a", color: "#ececec" }}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                style={{ position: "absolute", right: "2px", color: "#555", pointerEvents: "none" }}
              />
            </div>

            {/* API Keys shortcut */}
            <button
              onClick={onOpenSettings}
              title="Configure API Keys"
              style={{ ...toolbarBtnStyle, width: "28px", height: "28px", borderRadius: "6px", marginLeft: "4px" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#3a3a3a"; e.currentTarget.style.color = "#a855f7"; }}
              onMouseLeave={(e) => applyHover(e, "transparent", "#666")}
            >
              <Key size={13} style={{ strokeWidth: 2.2 }} />
            </button>
          </div>

          {/* Right: send / stop */}
          {isStreaming ? (
            <button
              onClick={onStop}
              title="Stop generating"
              style={sendStopBtnStyle({ active: true, enabled: true })}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              title="Send message"
              style={sendStopBtnStyle({ active: false, enabled: canSend })}
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>

      <p style={{ marginTop: "10px", fontSize: "11.5px", color: "#3a3a3a", textAlign: "center" }}>
        AgentChat can make mistakes. Verify important information.
      </p>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const toolbarBtnStyle = {
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
};

function applyHover(e, bg, color) {
  e.currentTarget.style.background = bg;
  e.currentTarget.style.color = color;
}

function sendStopBtnStyle({ active, enabled }) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "none",
    background: active ? "#ececec" : enabled ? "#ececec" : "#2a2a2a",
    color: active ? "#212121" : enabled ? "#212121" : "#444",
    cursor: active || enabled ? "pointer" : "default",
    flexShrink: 0,
    transition: "background 0.15s, color 0.15s, opacity 0.15s",
  };
}
