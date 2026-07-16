# 🤖 Agentic Chat Bot

A state-of-the-art, feature-rich conversational assistant application built using a **Vite (React) frontend** and a **FastAPI + LangGraph + Supabase backend**. The bot features multi-user Supabase authentication, a PostgreSQL-powered message history and memory saver, real-time tool execution tracing, advanced RAG with hybrid search, and input security guardrails.

---

## 🌟 Key Features & Capabilities

### 1. 🔐 User Authentication & Tenant Isolation
*   **Supabase Auth**: Integrated with client-side JWT handling, providing secure login, sign-up, and session management.
*   **Secure API Requests**: Access tokens are automatically attached to all HTTP and Server-Sent Event (SSE) requests.
*   **Row-Level & Tenant Security**: All conversation history, messages, and document ingestion queries are isolated on the database level using the user's UUID.

### 2. ⚡ Advanced RAG (Retrieval-Augmented Generation)
*   **In-Memory Stream Processing**: Uploaded documents are parsed entirely in-memory (using `io.BytesIO`). Files are never written to the local disk, keeping the server completely stateless.
*   **Pinecone Vector DB with Chroma Fallback**: Vector embeddings are saved to a managed cloud database (**Pinecone**) in production, with automatic fallback to a local **ChromaDB** container if no Pinecone keys are specified.
*   **Hybrid Search (Dense + Sparse)**: In Chroma fallback mode, combines semantic vector search (Gemini Embeddings) with local keyword search (BM25) to retrieve context with high conceptual and textual accuracy.
*   **Asynchronous Ingestion**: Ingests files using FastAPI's background workers so the user interface remains responsive during processing.
*   **Ingestion Status Tracking**: Backed by a PostgreSQL `user_documents` status table. The frontend polls and displays real-time ingestion status (`processing`, `ready`, or `failed` with error logs) directly on the file card.
*   **Supported Formats**: `.pdf`, `.docx`, `.txt`, `.md`, `.py`, `.csv`.

### 3. 🔍 Real-Time Tool Execution Transparency
*   **Live Trace Indicators**: Displays glowing status tags mapping agent tool actions in real time.
*   **Progressive States**: Visualizes active processes with animations, transitioning from `"running"` to `"done"` once finished.
*   **Data Security**: Sensitive tool parameters and console outputs are kept server-side to protect system integrity.

### 4. 🧠 Long-Term Memory
*   **Global Recall**: Users can tell the assistant to save facts (e.g. *"remember my coding preferences"*), which are vectorized and recalled globally across different conversation threads.
*   **PostgreSQL Persistence**: Replaced local SQLite checkpointers with `PostgresSaver` utilizing Supabase pools configured for transactional compatibility.

### 5. 🛠️ Interactive Toolset
*   🧮 **Calculator**: Parses and executes safe Python math expressions.
*   🔍 **Web Search**: Integrates **Tavily API** to browse advanced web results.
*   ☁️ **Weather Check**: Connects to **OpenWeather API** (Geocoding + Current reports) for forecast statistics.
*   📈 **Stock Quote**: Retrieves real-time stock details from **AlphaVantage**.
*   🤝 **Stock Purchase (HITL)**: Utilizes LangGraph `interrupt` logic to pause graph workflows and request human confirmation in the UI before executing trades.

### 6. 🎨 Premium Glassmorphism UI
*   Designed using a dark neon aesthetic featuring backdrop filters, sleek sidebars, and premium visual hierarchy.
*   Built-in BYOK (Bring Your Own Key) manager to override default Gemini, OpenAI, Mistral, or Groq API keys directly from the settings drawer.

### 7. 🚦 API Rate Limiting & Abuse Prevention
*   Endpoints are protected with `slowapi` rate limiters to prevent bot abuse and control external API costs.
*   Chat streaming is limited to **30 requests/minute**, file uploads to **10 uploads/minute**, and document checking to **60 requests/minute**.

---

## 🏗️ Architecture & Flow

```mermaid
graph TD
    A[Vite React Client] -->|Auth Token + POST| B[FastAPI Backend]
    B -->|Verify JWT| S[Supabase Auth]
    B -->|Stream SSE| C[LangGraph Agent Graph]
    C -->|Guardrail Checker| G[Guardrails Node]
    G -->|If Safe| H[Chatbot Node]
    G -->|If Unsafe| I[End Graph & Return Warning]
    H -->|Invokes| D[Toolbox Node]
    D -->|Executes| E[Chroma / BM25 / Tavily / OpenWeather / AlphaVantage]
    E -->|Returns Output| D
    D -->|Tool State Update SSE| A
    H -->|Streams text tokens SSE| A
    H -->|Interrupted for Trade| F[Human-In-The-Loop Approval]
    F -->|Resume Signal| H
    C -->|Save State| P[Supabase PostgreSQL Checkpoint]
```

---

## 🚀 Getting Started

### 1. Configure the Backend
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create a `.env` file based on the required keys:
    ```env
    # Database
    DATABASE_URL=postgresql://postgres.xxxx:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?prepare_threshold=0
    DB_PUBLIC_KEY=your_supabase_anon_key

    # LLM & Tools
    GEMINI_API_KEY=your_gemini_key
    TAVILY_API_KEY=your_tavily_key
    OPENWEATHER_API_KEY=your_openweather_key
    ALPHAVANTAGE_API_KEY=your_alphavantage_key

    # Optional Production Managed Vector DB (Pinecone)
    PINECONE_API_KEY=your_pinecone_key
    PINECONE_INDEX_NAME=your_pinecone_index
    ```
3.  Launch the FastAPI server:
    ```bash
    .venv/bin/python main.py
    ```

### 2. Configure the Frontend
1.  Navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment in `frontend/.env`:
    ```env
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    VITE_API_URL=http://localhost:8000
    ```
4.  Launch the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:5173](http://localhost:5173) in your browser!
