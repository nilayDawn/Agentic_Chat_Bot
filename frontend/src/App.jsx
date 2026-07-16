import { useState, useCallback, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ChatArea from "./components/ChatArea";
import ChatInput from "./components/ChatInput";
import SettingsModal from "./components/SettingsModal";
import Auth from "./components/Auth";
import { supabase } from "./lib/supabaseClient";
import { useChatStore } from "./hooks/useChatStore";

/**
 * App — root component.
 * Handles Supabase session state and wires all sub-components.
 */
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    loadConversations,
    selectConversation,
    startNewChat,
    sendMessage,
    stopStreaming,
    removeConversation,
    setActiveThreadId,
  } = useChatStore();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Reload conversations when a user logs in
  useEffect(() => {
    if (session) {
      loadConversations();
    }
  }, [session, loadConversations]);

  const handleToggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const openSettings  = useCallback(() => setSettingsOpen(true),  []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const handleLogOut  = useCallback(() => supabase.auth.signOut(), []);

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100vw",
          height: "100vh",
          background: "#171717",
          color: "#888",
          fontSize: "14px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div className="spinner" style={{ width: "24px", height: "24px", border: "2px solid #333", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

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
        userEmail={session.user?.email}
        onLogOut={handleLogOut}
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
