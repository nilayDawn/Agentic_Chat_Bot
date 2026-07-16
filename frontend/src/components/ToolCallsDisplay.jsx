import { Terminal, Search, Cloud, TrendingUp, Calculator, Loader2 } from "lucide-react";

// ─── Tool-name → display config ───────────────────────────────────────────────

const TOOL_PATTERNS = [
  {
    test: (n) => /rag|document|paper|query_documents/.test(n),
    label: "Searching documents (RAG)",
    icon:  Search,
    iconColor: "#3b82f6",
  },
  {
    test: (n) => /stock|market|ticker|price/.test(n),
    label: "Fetching stock data",
    icon:  TrendingUp,
    iconColor: "#10b981",
  },
  {
    test: (n) => /weather/.test(n),
    label: "Checking weather",
    icon:  Cloud,
    iconColor: "#06b6d4",
  },
  {
    test: (n) => /web|search/.test(n),
    label: "Searching the web",
    icon:  Search,
    iconColor: "#a855f7",
  },
  {
    test: (n) => /calculat|math|calculator/.test(n),
    label: "Calculating",
    icon:  Calculator,
    iconColor: "#f59e0b",
  },
];

function getToolDetails(name) {
  const n = name.toLowerCase();
  const match = TOOL_PATTERNS.find((p) => p.test(n));
  return match ?? { label: `Running tool: ${name}`, icon: Terminal, iconColor: "#ececec" };
}

// ─── ToolCallItem ─────────────────────────────────────────────────────────────

function ToolCallItem({ toolCall }) {
  const details       = getToolDetails(toolCall.name);
  const IconComponent = details.icon;
  const isRunning     = toolCall.status === "running";

  return (
    <div
      style={{
        background: "#1e1e1e",
        border: "1px solid #2e2e2e",
        borderRadius: "8px",
        marginBottom: "6px",
        width: "100%",
        maxWidth: "480px",
        overflow: "hidden",
        fontSize: "12.5px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComponent size={14} color={details.iconColor} />
          </div>
          <span style={{ fontWeight: 500, color: "#d1d1d1" }}>{details.label}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {isRunning ? (
            <Loader2 size={12} color="#f59e0b" className="spin" />
          ) : (
            <span style={{ color: "#10b981", fontSize: "11px", fontWeight: 600 }}>Done</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ToolCallsDisplay ─────────────────────────────────────────────────────────

/**
 * Renders a list of tool-call status chips above the assistant reply.
 * Returns null when there are no tool calls to show.
 */
export default function ToolCallsDisplay({ toolCalls }) {
  if (!toolCalls?.length) return null;

  return (
    <div style={{ marginTop: "4px", marginBottom: "8px", width: "100%" }}>
      {toolCalls.map((tc) => (
        <ToolCallItem key={tc.id} toolCall={tc} />
      ))}
    </div>
  );
}
