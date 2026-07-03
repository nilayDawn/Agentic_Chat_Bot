"use client";

import { PanelLeft, Plus } from "lucide-react";

export default function Topbar({
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  conversations,
  activeThreadId,
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
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
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
        <PanelLeft size={18} />
      </button>

      {/* New chat (only when sidebar is hidden) */}
      {!sidebarOpen && (
        <button
          onClick={onNewChat}
          title="New chat"
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
          <Plus size={18} />
        </button>
      )}

      {/* Title */}
      <span
        style={{
          fontSize: "14px",
          color: "#888",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {title}
      </span>
    </header>
  );
}
