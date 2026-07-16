import { useState } from "react";
import { Trash2, ChevronDown, ChevronRight, Edit3, Settings } from "lucide-react";
import { deleteConversation } from "../lib/api";
import { groupConversationsByDate } from "../utils/dateGroups";

// ─── ConversationItem ─────────────────────────────────────────────────────────

function ConversationItem({ conv, isActive, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteConversation(conv.thread_id);
      onDelete(conv.thread_id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const title =
    conv.title
      ? conv.title.length > 28
        ? conv.title.slice(0, 28) + "…"
        : conv.title
      : "New conversation";

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
        background: isActive ? "#2a2a2a" : hovered ? "#1e1e1e" : "transparent",
        color: isActive ? "#fff" : hovered ? "#fff" : "#b3b3b3",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          flex: 1,
          fontSize: "13.5px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: "1.35",
        }}
      >
        {title}
      </span>

      {hovered && (
        <button
          onClick={handleDelete}
          title="Delete conversation"
          style={{
            flexShrink: 0,
            padding: "4px",
            borderRadius: "6px",
            border: "none",
            background: "transparent",
            color: "#666",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f87171";
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#666";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ─── GroupSection ─────────────────────────────────────────────────────────────

function GroupSection({ title, items, activeThreadId, onSelect, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: "12px" }}>
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          width: "100%",
          padding: "4px 12px",
          background: "none",
          border: "none",
          color: "#555",
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          cursor: "pointer",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
      >
        {collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
        {title}
      </button>

      {!collapsed && (
        <div style={{ marginTop: "2px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {items.map((conv) => (
            <ConversationItem
              key={conv.thread_id}
              conv={conv}
              isActive={activeThreadId === conv.thread_id}
              onClick={() => onSelect(conv.thread_id)}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({
  conversations,
  activeThreadId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onOpenSettings,
  userEmail,
  onLogOut,
}) {
  const groups = groupConversationsByDate(conversations);

  return (
    <aside
      style={{
        width:     isOpen ? "260px" : "0px",
        minWidth:  isOpen ? "260px" : "0px",
        overflow:  "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease",
        background: "#171717",
        borderRight: "1px solid #2b2b2b",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: "56px",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
          AgentChat
        </span>
        <button
          onClick={onNewChat}
          title="New chat"
          style={{
            padding: "6px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "#888",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.background = "#2a2a2a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#888";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Edit3 size={15} />
        </button>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        {conversations.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#444",
              marginTop: "32px",
              padding: "0 16px",
              lineHeight: 1.6,
            }}
          >
            No conversations yet.
            <br />
            Start chatting!
          </p>
        ) : (
          Object.entries(groups).map(([groupName, items]) => (
            <GroupSection
              key={groupName}
              title={groupName}
              items={items}
              activeThreadId={activeThreadId}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #2b2b2b",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11.5px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }} title={userEmail}>
            {userEmail || "user@example.com"}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={onOpenSettings}
              title="Settings"
              style={{
                padding: "4px",
                borderRadius: "6px",
                border: "none",
                background: "transparent",
                color: "#888",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "#2a2a2a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#888";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Settings size={13} />
            </button>
            <button
              onClick={onLogOut}
              style={{
                fontSize: "11px",
                color: "#888",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#888";
                e.currentTarget.style.background = "none";
              }}
            >
              Log Out
            </button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: "10px", color: "#3a3a3a", textAlign: "center" }}>
          Agentic Chat Bot v1.0
        </p>
      </div>
    </aside>
  );
}
