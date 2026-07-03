const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
 * @returns {Promise<Array>} List of message objects { role, content }
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
 * @returns {Promise<{success: boolean, message: string}>}
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

/**
 * Stream chat response from the backend using SSE.
 * @param {string} message - User message
 * @param {string} threadId - Conversation thread ID
 * @param {string} model - Selected model name
 * @param {function} onToken - Callback per token: (token: string) => void
 * @param {function} onDone - Callback when stream ends
 * @param {function} onError - Callback on error: (error: string) => void
 * @returns {AbortController} - To cancel the request
 */
export function streamChat({ message, threadId, model, onToken, onDone, onError }) {
  const controller = new AbortController();

  fetch(`${BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, thread_id: threadId, model }),
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
        buffer = lines.pop(); // keep last incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const payload = JSON.parse(raw);
            if (payload.token) {
              onToken(payload.token);
            } else if (payload.error) {
              onError(payload.error);
            } else if (payload.done) {
              onDone();
            }
          } catch {
            // skip malformed JSON
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
