"use client";

import { useState } from "react";
import { Trash2, MessageSquare, ChevronDown, ChevronRight, Plus, Edit3 } from "lucide-react";
import { deleteConversation } from "@/lib/api";

function groupConversationsByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const groups = { Today: [], Yesterday: [], "Last 7 Days": [], Older: [] };

  for (const conv of conversations) {
    const d = new Date(conv.updated_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (day >= today) groups["Today"].push(conv);
    else if (day >= yesterday) groups["Yesterday"].push(conv);
    else if (day >= lastWeek) groups["Last 7 Days"].push(conv);
    else groups["Older"].push(conv);
  }

  return groups;
}

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
      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
        isActive
          ? "bg-[#2a2a2a] text-white"
          : "text-[#b3b3b3] hover:bg-[#212121] hover:text-white"
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="flex-1 text-[13.5px] truncate leading-snug">{title}</span>
      <button
        onClick={handleDelete}
        className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 text-[#666] hover:text-red-400 hover:bg-red-400/10 transition-all"
        title="Delete"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function GroupSection({ title, items, activeThreadId, onSelect, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 w-full px-3 py-1 text-[11px] font-semibold text-[#555] uppercase tracking-widest hover:text-[#888] transition-colors"
      >
        {collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
        {title}
      </button>
      {!collapsed && (
        <div className="mt-0.5 space-y-0.5">
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

export default function Sidebar({
  conversations,
  activeThreadId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
}) {
  const groups = groupConversationsByDate(conversations);

  return (
    <aside
      style={{
        width: isOpen ? "260px" : "0px",
        minWidth: isOpen ? "260px" : "0px",
        overflow: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease",
        background: "#171717",
        borderRight: "1px solid #2b2b2b",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        flexShrink: 0,
      }}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <span className="text-[15px] font-semibold text-white tracking-tight">AgentChat</span>
        <button
          onClick={onNewChat}
          title="New chat"
          className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#2a2a2a] transition-colors"
        >
          <Edit3 size={15} />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.length === 0 ? (
          <p className="text-center text-[12px] text-[#444] mt-8 px-4 leading-relaxed">
            No conversations yet.<br />Start chatting!
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
      <div className="px-4 py-3 border-t border-[#2b2b2b] shrink-0">
        <p className="text-[11px] text-[#3a3a3a]">Agentic Chat Bot v1.0</p>
      </div>
    </aside>
  );
}
