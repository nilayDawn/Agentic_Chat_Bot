import { PanelLeft, Plus, Settings } from "lucide-react";

/** Reusable icon-button used multiple times in the Topbar. */
function IconButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        border: "none",
        background: "transparent",
        color: "#888",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#2a2a2a";
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#888";
      }}
    >
      {children}
    </button>
  );
}

export default function Topbar({
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  conversations,
  activeThreadId,
  onOpenSettings,
}) {
  const activeConv = conversations.find((c) => c.thread_id === activeThreadId);
  const title =
    activeConv?.title
      ? activeConv.title.length > 48
        ? activeConv.title.slice(0, 48) + "…"
        : activeConv.title
      : "AgentChat";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        height: "56px",
        padding: "0 16px",
        borderBottom: "1px solid #2b2b2b",
        background: "#212121",
        flexShrink: 0,
      }}
    >
      <IconButton
        onClick={onToggleSidebar}
        title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <PanelLeft size={18} />
      </IconButton>

      {/* Show New-Chat button only when sidebar is hidden */}
      {!sidebarOpen && (
        <IconButton onClick={onNewChat} title="New chat">
          <Plus size={18} />
        </IconButton>
      )}

      <span
        style={{
          flex: 1,
          fontSize: "14px",
          color: "#888",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>

      <IconButton onClick={onOpenSettings} title="Settings">
        <Settings size={18} />
      </IconButton>
    </header>
  );
}
