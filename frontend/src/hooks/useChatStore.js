import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { fetchConversations, fetchHistory, streamChat } from "../lib/api";
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "../constants/models";

const LS_KEYS = {
  apiKeys:  "agent_api_keys",
  model:    "agent_selected_model",
  provider: "agent_selected_provider",
};

/** Safely read a JSON value from localStorage. Returns `null` on any failure. */
function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Safely write a value to localStorage as JSON. */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/**
 * useChatStore
 * Central state manager for the chat application.
 * Handles: conversations list, active thread, messages,
 * streaming lifecycle, and model / API-key persistence.
 */
export function useChatStore() {
  const [conversations,   setConversations]   = useState([]);
  const [activeThreadId,  setActiveThreadId]  = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [isStreaming,     setIsStreaming]      = useState(false);
  const [selectedModel,   setSelectedModelRaw]= useState(DEFAULT_MODEL);
  const [selectedProvider,setSelectedProvider]= useState(DEFAULT_PROVIDER);
  const [apiKeys,         setApiKeysRaw]      = useState({ gemini: "", mistral: "", openai: "", groq: "" });
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [streamController,setStreamController]= useState(null);

  // ── Initial load ─────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      setConversations(await fetchConversations());
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, []);

  useEffect(() => {
    loadConversations();

    // Restore settings from localStorage
    const storedKeys     = lsGet(LS_KEYS.apiKeys);
    const storedModel    = lsGet(LS_KEYS.model);
    const storedProvider = lsGet(LS_KEYS.provider);

    if (storedKeys)     setApiKeysRaw(storedKeys);
    if (storedModel)    setSelectedModelRaw(storedModel);
    if (storedProvider) setSelectedProvider(storedProvider);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Settings persistence ──────────────────────────────────────────────────
  const setApiKeys = useCallback((keys) => {
    setApiKeysRaw(keys);
    lsSet(LS_KEYS.apiKeys, keys);
  }, []);

  const setSelectedModel = useCallback((model, provider) => {
    setSelectedModelRaw(model);
    lsSet(LS_KEYS.model, model);
    if (provider) {
      setSelectedProvider(provider);
      lsSet(LS_KEYS.provider, provider);
    }
  }, []);

  // ── Conversation actions ──────────────────────────────────────────────────
  const selectConversation = useCallback(async (threadId) => {
    if (threadId === activeThreadId) return;
    setActiveThreadId(threadId);
    setMessages([]);
    setLoadingHistory(true);

    try {
      const history = await fetchHistory(threadId);
      setMessages(
        history.map((msg, idx) => {
          let parsedToolCalls = [];
          if (msg.tool_calls) {
            try {
              parsedToolCalls =
                typeof msg.tool_calls === "string"
                  ? JSON.parse(msg.tool_calls)
                  : msg.tool_calls;
            } catch (e) {
              console.error("Failed to parse tool calls:", e);
            }
          }
          return {
            id:        `hist-${idx}`,
            role:      msg.role,
            content:   msg.content,
            isError:   false,
            fileName:  msg.file_name  || null,
            fileSize:  msg.file_size  || null,
            toolCalls: parsedToolCalls,
          };
        })
      );
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [activeThreadId]);

  const startNewChat = useCallback(() => {
    setActiveThreadId(uuidv4());
    setMessages([]);
  }, []);

  const removeConversation = useCallback((threadId) => {
    setConversations((prev) => prev.filter((c) => c.thread_id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
      setMessages([]);
    }
  }, [activeThreadId]);

  // ── Streaming ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (userText, fileInfo = null) => {
      if (!userText.trim() || isStreaming) return;

      // Ensure a thread ID exists
      const threadId = activeThreadId ?? (() => {
        const id = uuidv4();
        setActiveThreadId(id);
        return id;
      })();

      const userMsg = {
        id:       uuidv4(),
        role:     "user",
        content:  userText,
        isError:  false,
        fileName: fileInfo?.name || null,
        fileSize: fileInfo?.size || null,
      };
      const aiMsgId = uuidv4();
      const aiMsg = {
        id:        aiMsgId,
        role:      "assistant",
        content:   "",
        isError:   false,
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      const controller = streamChat({
        message:  userText,
        threadId,
        model:    selectedModel,
        provider: selectedProvider,
        apiKeys,
        fileName: fileInfo?.name || null,
        fileSize: fileInfo?.size || null,

        onToken: (token) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: m.content + token } : m
            )
          ),

        onToolCall: (toolCall) =>
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiMsgId) return m;
              const existing = m.toolCalls ?? [];
              const idx = existing.findIndex((tc) => tc.id === toolCall.id);
              const updated =
                idx !== -1
                  ? existing.map((tc, i) => (i === idx ? { ...tc, ...toolCall } : tc))
                  : [...existing, toolCall];
              return { ...m, toolCalls: updated };
            })
          ),

        onDone: () => {
          setIsStreaming(false);
          setStreamController(null);
          loadConversations(); // refresh sidebar title
        },

        onError: (errMsg) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: errMsg || "An error occurred.", isError: true }
                : m
            )
          ),
      });

      setStreamController(controller);
    },
    [activeThreadId, isStreaming, selectedModel, selectedProvider, apiKeys, loadConversations]
  );

  const stopStreaming = useCallback(() => {
    if (streamController) {
      streamController.abort();
      setIsStreaming(false);
      setStreamController(null);
    }
  }, [streamController]);

  // ── Public API ────────────────────────────────────────────────────────────
  return {
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
    setMessages,
    setActiveThreadId,
  };
}
