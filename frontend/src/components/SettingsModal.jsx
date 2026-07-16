import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Key, HelpCircle, Save } from "lucide-react";
import { PROVIDERS } from "../constants/providers";
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "../constants/models";

/**
 * SettingsModal
 * Floating modal for managing per-provider API keys and model selection.
 * Settings are propagated to the parent via onSaveKeys / onSelectModelProvider.
 */
export default function SettingsModal({
  isOpen,
  onClose,
  apiKeys,
  onSaveKeys,
  selectedModel,
  selectedProvider,
  onSelectModelProvider,
}) {
  const [activeTab,     setActiveTab]     = useState(DEFAULT_PROVIDER);
  const [localKeys,     setLocalKeys]     = useState({ gemini: "", mistral: "", openai: "", groq: "" });
  const [localModel,    setLocalModel]    = useState(DEFAULT_MODEL);
  const [localProvider, setLocalProvider] = useState(DEFAULT_PROVIDER);
  const [showKey,       setShowKey]       = useState(false);

  // Sync with current global state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalKeys({
        gemini:  apiKeys.gemini  || "",
        mistral: apiKeys.mistral || "",
        openai:  apiKeys.openai  || "",
        groq:    apiKeys.groq    || "",
      });
      setLocalModel(selectedModel);
      setLocalProvider(selectedProvider);
      setActiveTab(selectedProvider || DEFAULT_PROVIDER);
    }
  }, [isOpen, apiKeys, selectedModel, selectedProvider]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKeys(localKeys);
    onSelectModelProvider(localModel, localProvider);
    onClose();
  };

  const switchTab = (key) => {
    setActiveTab(key);
    setLocalProvider(key);
    // Reset model to provider default to prevent cross-provider mismatches
    setLocalModel(PROVIDERS[key].suggestedModels[0]);
    setShowKey(false);
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#262626",
          border: "1px solid #383838",
          borderRadius: "16px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          color: "#ececec",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #333",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Key size={18} style={{ color: "#a855f7" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>API &amp; Model Settings</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Provider tabs */}
        <div
          style={{
            display: "flex",
            background: "#1c1c1c",
            borderBottom: "1px solid #333",
            padding: "4px 8px 0",
          }}
        >
          {Object.entries(PROVIDERS).map(([key, provider]) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                color: activeTab === key ? "#ececec" : "#888",
                fontSize: "13px",
                fontWeight: activeTab === key ? 600 : 400,
                cursor: "pointer",
                borderBottom: activeTab === key ? "2px solid #a855f7" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "color 0.15s",
              }}
            >
              {provider.name}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Info banner */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(168, 85, 247, 0.08)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
              fontSize: "12px",
              lineHeight: "1.5",
              color: "#c084fc",
            }}
          >
            <HelpCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              Custom keys are stored only in your browser. If left blank, the application will use
              the default backend API keys.
            </div>
          </div>

          {/* API key input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#aaa" }}>
              {PROVIDERS[activeTab].name} API Key
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showKey ? "text" : "password"}
                value={localKeys[activeTab]}
                onChange={(e) =>
                  setLocalKeys((prev) => ({ ...prev, [activeTab]: e.target.value }))
                }
                placeholder={PROVIDERS[activeTab].placeholder}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Model name input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#aaa" }}>
              Desired Model Name
            </label>
            <input
              type="text"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              placeholder="Enter model name..."
              style={inputStyle}
            />
          </div>

          {/* Suggested models */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#aaa" }}>
              Suggested Models
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {PROVIDERS[activeTab].suggestedModels.map((model) => {
                const isSelected = localModel === model;
                return (
                  <button
                    key={model}
                    onClick={() => setLocalModel(model)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: isSelected ? "1px solid #a855f7" : "1px solid #3a3a3a",
                      background: isSelected ? "rgba(168, 85, 247, 0.15)" : "#222",
                      color: isSelected ? "#c084fc" : "#bbb",
                      fontSize: "11.5px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {model}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            background: "#1c1c1c",
            borderTop: "1px solid #333",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#bbb",
              fontSize: "13px",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#bbb")}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 16px",
              background: "#a855f7",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#9333ea")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#a855f7")}
          >
            <Save size={14} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  padding: "10px 40px 10px 12px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#1c1c1c",
  color: "#ececec",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
};
