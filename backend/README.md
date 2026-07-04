# Agentic Chat Bot Backend

This is the FastAPI + LangGraph backend service for the Agentic Chat Bot. It orchestrates the LLM agent, executes tools (calculator, weather, search, stock check, RAG), manages conversational memory in SQLite, and streams responses to the client using Server-Sent Events (SSE).

---

## 1. Directory Structure

```
backend/
├── main.py                # FastAPI entry point, routers, and SSE event streaming
├── pyproject.toml         # Python packaging and dependency config
├── uv.lock                # Locked dependency tree (managed via uv)
├── Agent/
│   └── chatbot.py         # LangGraph workflow compile, model routing, and state definitions
├── Memory/
│   └── database.py        # SQLAlchemy schema definitions, DB helpers, and migrations
├── Tools/
│   ├── calculator_tool.py # Eval-based math execution tool
│   ├── weather_tool.py    # OpenWeather Geocoding + Current Weather tool
│   ├── stock_tool.py      # AlphaVantage global quote retriever + human-in-the-loop stock purchase
│   ├── search_tool.py     # Tavily Search client integration
│   ├── rag_tool.py        # Document text extraction (PyPDF/Docx/CSV) and FAISS vector index
│   └── memory_toos.py     # Wrapper tools for writing/reading global long-term memory
├── Utils/
│   └── helpers.py         # SSE packaging, stream chunk validation, and token parser
├── prompts/
│   └── prompt.py          # Instructions and behavior definitions for the agent
└── Data/                  # Created at runtime (gitignored)
    ├── agent_memory.db    # SQLite database for conversation and long-term memory
    └── checkpoints.sqlite # LangGraph state preservation checkpoint db
```

---

## 2. API Endpoints

### 2.1 Health Check
- **`GET /health`**
  - **Description**: Returns server readiness status.
  - **Response**: `{"status": "healthy", ...}`

### 2.2 Conversation Management
- **`GET /conversations`**
  - **Description**: List all active thread records.
  - **Response**: List of `{thread_id, title, created_at, updated_at}`.
- **`DELETE /conversations/{thread_id}`**
  - **Description**: Delete a conversation thread and its associated chat messages.

### 2.3 Conversation History
- **`GET /history/{thread_id}`**
  - **Description**: Fetch all stored messages for a specific conversation thread.
  - **Response**: Array of `{role, content, file_name, file_size, tool_calls}`.

### 2.4 Document Upload & RAG Ingestion
- **`POST /upload`**
  - **Form Data**: `file` (UploadFile), `thread_id` (string)
  - **Description**: Immediately parses, chunks, and indexes documents into the FAISS vector database.
  - **Supported Types**: `.pdf`, `.docx`, `.txt`, `.md`, `.py`, `.csv`.

### 2.5 Real-Time Chat Stream
- **`POST /chat/stream`**
  - **Body (JSON)**: `{message, thread_id, model, file_name, file_size}`
  - **Description**: Receives user inputs and streams tokens, live tool calls, and completion indicators.
  - **SSE Event Payloads**:
    - **Standard Tokens**: `data: {"token": "..."}\n\n`
    - **Tool Calls**: `data: {"tool_call": {"id", "name", "args", "status", "output"}}\n\n`
    - **Completion**: `data: {"done": true}\n\n`
    - **Error**: `data: {"error": "..."}\n\n`

---

## 3. Database Schema

Stored in `Data/agent_memory.db` via SQLite:

### 3.1 ChatMessage Table
- `id` (Integer, Primary Key)
- `thread_id` (String)
- `role` (String: `"user"` or `"assistant"`)
- `content` (Text)
- `file_name` (String, Nullable)
- `file_size` (Integer, Nullable)
- `tool_calls` (Text, Nullable) - Stored as a JSON string containing the execution trace of the assistant's tools.
- `created_at` (DateTime)

### 3.2 LongTermMemory Table
- `id` (Integer, Primary Key)
- `thread_id` (String)
- `memory` (Text) - Saved user preferences or facts.
- `created_at` (DateTime)

*Note: Memory query searches the entire database globally across all threads, performing substring filtering with a fallback to the latest memories.*

---

## 4. How to Run

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Set up environment variables in a `.env` file:
   ```env
   TAVILY_API_KEY=your_key
   OPENWEATHER_API_KEY=your_key
   ALPHAVANTAGE_API_KEY=your_key
   GEMINI_API_KEY=your_key
   ```
3. Run the server using the virtual environment:
   ```bash
   .venv/bin/python main.py
   ```
