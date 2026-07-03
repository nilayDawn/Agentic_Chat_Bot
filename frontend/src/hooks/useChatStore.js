"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { fetchConversations, fetchHistory, streamChat } from "@/lib/api";

/**
 * Main state manager for the chat application.
 * Handles conversations, messages, streaming, and model selection.
 */
export function useChatStore() {
  const [conversations, setConversations] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [streamController, setStreamController] = useState(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, []);

  const selectConversation = useCallback(async (threadId) => {
    if (threadId === activeThreadId) return;
    setActiveThreadId(threadId);
    setMessages([]);
    setLoadingHistory(true);

    try {
      const history = await fetchHistory(threadId);
      setMessages(
        history.map((msg, idx) => ({
          id: `hist-${idx}`,
          role: msg.role,
          content: msg.content,
          isError: false,
        }))
      );
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [activeThreadId]);

  const startNewChat = useCallback(() => {
    const newId = uuidv4();
    setActiveThreadId(newId);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    (userText) => {
      if (!userText.trim() || isStreaming) return;

      const threadId = activeThreadId || (() => {
        const id = uuidv4();
        setActiveThreadId(id);
        return id;
      })();

      // Append user message immediately
      const userMsg = { id: uuidv4(), role: "user", content: userText, isError: false };
      const aiMsgId = uuidv4();
      const aiMsg = { id: aiMsgId, role: "assistant", content: "", isError: false };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      const controller = streamChat({
        message: userText,
        threadId,
        model: selectedModel,
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: m.content + token } : m
            )
          );
        },
        onDone: () => {
          setIsStreaming(false);
          setStreamController(null);
          loadConversations(); // refresh sidebar
        },
        onError: (errMsg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: errMsg || "An error occurred.", isError: true }
                : m
            )
          );
        },
      });

      setStreamController(controller);
    },
    [activeThreadId, isStreaming, selectedModel, loadConversations]
  );

  const stopStreaming = useCallback(() => {
    if (streamController) {
      streamController.abort();
      setIsStreaming(false);
      setStreamController(null);
    }
  }, [streamController]);

  const removeConversation = useCallback((threadId) => {
    setConversations((prev) => prev.filter((c) => c.thread_id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
      setMessages([]);
    }
  }, [activeThreadId]);

  return {
    conversations,
    activeThreadId,
    messages,
    isStreaming,
    selectedModel,
    loadingHistory,
    setSelectedModel,
    loadConversations,
    selectConversation,
    startNewChat,
    sendMessage,
    stopStreaming,
    removeConversation,
    setMessages,
    setActiveThreadId,
  };
}
