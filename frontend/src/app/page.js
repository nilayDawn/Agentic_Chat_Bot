"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatArea from "@/components/ChatArea";
import ChatInput from "@/components/ChatInput";
import { useChatStore } from "@/hooks/useChatStore";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    conversations,
    activeThreadId,
    messages,
    isStreaming,
    selectedModel,
    loadingHistory,
    setSelectedModel,
    selectConversation,
    startNewChat,
    sendMessage,
    stopStreaming,
    removeConversation,
  } = useChatStore();

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#212121",
        fontFamily: "inherit",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeThreadId={activeThreadId}
        onSelectConversation={selectConversation}
        onNewChat={startNewChat}
        onDeleteConversation={removeConversation}
        isOpen={sidebarOpen}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          background: "#212121",
        }}
      >
        {/* Topbar */}
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onNewChat={startNewChat}
          conversations={conversations}
          activeThreadId={activeThreadId}
        />

        {/* Chat area (scrollable) */}
        <ChatArea
          messages={messages}
          isStreaming={isStreaming}
          loadingHistory={loadingHistory}
          onSuggestionClick={sendMessage}
          activeThreadId={activeThreadId}
        />

        {/* Input bar */}
        <ChatInput
          onSend={sendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          activeThreadId={activeThreadId}
        />
      </div>
    </div>
  );
}
