import { useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ChatArea from "./components/ChatArea";
import ChatInput from "./components/ChatInput";
import SettingsModal from "./components/SettingsModal";
import { useChatStore } from "./hooks/useChatStore";

/**
 * App — root component.
 * Owns sidebar-open / settings-open UI state and wires
 * all sub-components to the shared useChatStore hook.
 */
export default function App() {
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    conversations,
    activeThreadId,
    messages,
    isStreaming,
    selectedModel,
    selectedProvider,
    apiKeys,
    loadingHistory,
    setSelectedModel,
    setApiKeys,
    selectConversation,
    startNewChat,
    sendMessage,
    stopStreaming,
    removeConversation,
    setActiveThreadId,
  } = useChatStore();

  const handleToggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const openSettings  = useCallback(() => setSettingsOpen(true),  []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#212121",
      }}
    >
      <Sidebar
        conversations={conversations}
        activeThreadId={activeThreadId}
        onSelectConversation={selectConversation}
        onNewChat={startNewChat}
        onDeleteConversation={removeConversation}
        isOpen={sidebarOpen}
        onOpenSettings={openSettings}
      />

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
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onNewChat={startNewChat}
          conversations={conversations}
          activeThreadId={activeThreadId}
          onOpenSettings={openSettings}
        />

        <ChatArea
          messages={messages}
          isStreaming={isStreaming}
          loadingHistory={loadingHistory}
          onSuggestionClick={sendMessage}
          activeThreadId={activeThreadId}
          onOpenSettings={openSettings}
        />

        <ChatInput
          onSend={sendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          selectedProvider={selectedProvider}
          onModelChange={setSelectedModel}
          activeThreadId={activeThreadId}
          setActiveThreadId={setActiveThreadId}
          onOpenSettings={openSettings}
        />
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={closeSettings}
        apiKeys={apiKeys}
        onSaveKeys={setApiKeys}
        selectedModel={selectedModel}
        selectedProvider={selectedProvider}
        onSelectModelProvider={setSelectedModel}
      />
    </div>
  );
}
