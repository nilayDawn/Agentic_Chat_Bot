/**
 * lib/api.js
 * All HTTP / SSE communication with the FastAPI backend.
 *
 * Base URL is configured via the VITE_API_URL environment variable.
 * Falls back to http://localhost:8000 for local development.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── REST helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch all conversations from the backend.
 * @returns {Promise<Array>} List of conversation objects
 */
export async function fetchConversations() {
  const res = await fetch(`${BASE_URL}/conversations`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  const data = await res.json();
  return data.conversations;
}

/**
 * Fetch chat history for a specific thread.
 * @param {string} threadId
 * @returns {Promise<Array>} List of message objects { role, content, ... }
 */
export async function fetchHistory(threadId) {
  const res = await fetch(`${BASE_URL}/history/${threadId}`);
  if (!res.ok) throw new Error("Failed to fetch chat history");
  const data = await res.json();
  return data.messages;
}

/**
 * Delete a conversation by thread ID.
 * @param {string} threadId
 * @returns {Promise<void>}
 */
export async function deleteConversation(threadId) {
  const res = await fetch(`${BASE_URL}/conversations/${threadId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

/**
 * Upload a document for RAG ingestion.
 * @param {File} file
 * @param {string} threadId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function uploadDocument(file, threadId) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("thread_id", threadId);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
}

// ─── SSE streaming ────────────────────────────────────────────────────────────

/**
 * Stream a chat response from the backend using SSE.
 *
 * @param {object} params
 * @param {string}   params.message      - User message text
 * @param {string}   params.threadId     - Conversation thread ID
 * @param {string}   params.model        - Selected model name
 * @param {string}   params.provider     - Selected provider key
 * @param {object}   params.apiKeys      - { gemini, mistral, openai, groq }
 * @param {string}   [params.fileName]   - Attached file name (optional)
 * @param {number}   [params.fileSize]   - Attached file size in bytes (optional)
 * @param {function} params.onToken      - Called with each streamed text token
 * @param {function} params.onToolCall   - Called with each tool-call payload
 * @param {function} params.onDone       - Called when the stream ends cleanly
 * @param {function} params.onError      - Called with an error string on failure
 * @returns {AbortController} Call `.abort()` to cancel the stream
 */
export function streamChat({
  message,
  threadId,
  model,
  provider,
  apiKeys,
  fileName,
  fileSize,
  onToken,
  onToolCall,
  onDone,
  onError,
}) {
  const controller = new AbortController();

  fetch(`${BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      thread_id: threadId,
      model,
      provider,
      api_keys: apiKeys,
      file_name: fileName,
      file_size: fileSize,
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onError(err.error || "Request failed");
        onDone();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep the last (possibly incomplete) line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const payload = JSON.parse(raw);
            if (payload.token)          onToken(payload.token);
            else if (payload.tool_call) onToolCall?.(payload.tool_call);
            else if (payload.error)     onError(payload.error);
            else if (payload.done)      onDone();
          } catch {
            // skip malformed JSON frames
          }
        }
      }
    })
    .catch((err) => {
      if (err.name === "AbortError") return;
      onError(err.message || "Network error");
      onDone();
    });

  return controller;
}
