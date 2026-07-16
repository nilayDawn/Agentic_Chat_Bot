from pypdf import PdfReader
import docx2txt
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain.tools import tool
from langchain_core.documents import Document
import os
import io
from pathlib import Path
import Tools.memory_toos as _memory_state

Path('database').mkdir(parents=True, exist_ok=True)

# Embeddings model
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

def read_file_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    suffix = Path(filename).suffix.lower()

    if suffix == ".pdf":
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""

        for page in reader.pages:
            text += page.extract_text() or ""
            text += "\n"

        return text

    if suffix == ".docx":
        return docx2txt.process(io.BytesIO(file_bytes))

    if suffix in [".txt", ".md", ".py", ".csv"]:
        return file_bytes.decode("utf-8", errors="ignore")

    raise ValueError("Unsupported file type. Upload PDF, DOCX, TXT, MD, PY, or CSV.")

def ingest_document(file_bytes: bytes, filename: str, thread_id: str, file_id: str | None = None):
    try:
        text = read_file_text_from_bytes(file_bytes, filename)

        if not text.strip():
            raise ValueError("The document is empty or could not be read.")
        
        # Split documents
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

        chunks = splitter.split_text(text)

        docs:list[Document] = [
            Document(
                page_content=chunk,
                metadata={"source": filename, "thread_id": thread_id}
            )
            for chunk in chunks
        ]

        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        if pinecone_api_key:
            from langchain_pinecone import PineconeVectorStore
            index_name = os.getenv("PINECONE_INDEX_NAME", "agentic-bot")
            PineconeVectorStore.from_documents(
                docs,
                embeddings,
                index_name=index_name,
                pinecone_api_key=pinecone_api_key
            )
        else:
            db_path = 'database/chroma_db'
            db = Chroma(
                persist_directory=db_path,
                embedding_function=embeddings,
                collection_name="rag_documents"
            )
            db.add_documents(docs)

        # Update status to ready
        if file_id:
            from Memory.database import update_document_status
            update_document_status(file_id, "ready")

    except Exception as e:
        # Update status to failed
        if file_id:
            from Memory.database import update_document_status
            update_document_status(file_id, "failed", error_message=str(e))
        raise e

def retrieve_hybrid_documents(query: str, thread_id: str, k: int = 4) -> list:
    """
    Perform a hybrid search combining dense semantic similarity and sparse keyword search (BM25)
    over documents matching the given thread_id.
    """
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    if pinecone_api_key:
        from langchain_pinecone import PineconeVectorStore
        index_name = os.getenv("PINECONE_INDEX_NAME", "agentic-bot")
        db = PineconeVectorStore(
            index_name=index_name,
            embedding=embeddings,
            pinecone_api_key=pinecone_api_key
        )
        return db.similarity_search(query, k=k, filter={"thread_id": thread_id})

    # Chroma Local flow
    db_path = 'database/chroma_db'
    if not os.path.exists(db_path):
        raise FileNotFoundError("Chroma database not found.")
    
    db = Chroma(
        persist_directory=db_path,
        embedding_function=embeddings,
        collection_name="rag_documents"
    )

    # 1. Fetch dense semantic results
    semantic_results = db.similarity_search(query, k=k, filter={"thread_id": thread_id})

    # 2. Fetch sparse keyword results by fetching all docs in thread and applying BM25
    keyword_results = []
    try:
        all_data = db.get(where={"thread_id": thread_id})
        if all_data and all_data.get("documents"):
            all_docs = [
                Document(page_content=doc, metadata=meta)
                for doc, meta in zip(all_data["documents"], all_data["metadatas"])
            ]
            from langchain_community.retrievers import BM25Retriever
            bm25 = BM25Retriever.from_documents(all_docs)
            bm25.k = min(k, len(all_docs))
            keyword_results = bm25.invoke(query)
    except Exception as e:
        # Fallback if BM25 index initialization fails
        pass

    # Combine and de-duplicate preserving order
    seen = set()
    combined_docs = []
    for doc in semantic_results + keyword_results:
        content_id = doc.page_content.strip()
        if content_id not in seen:
            seen.add(content_id)
            combined_docs.append(doc)

    return combined_docs[:k]


from langchain_core.runnables import RunnableConfig

@tool
def rag_tool(query: str, config: RunnableConfig) -> str:
    """
    A tool that uses a retriever to fetch relevant information based on the query. Use this tool to answer questions based on the ingested documents. The tool will return a string response containing the relevant information.

    Args:
        query (str): The query to be answered based on the ingested documents.

    Returns:
        str: A string response containing the relevant information based on the query.
    """
    try:
        thread_id = None
        if config:
            thread_id = config.get("configurable", {}).get("thread_id")
        if not thread_id:
            thread_id = _memory_state.CURRENT_THREAD_ID
        docs = retrieve_hybrid_documents(query, thread_id=thread_id)
    except FileNotFoundError:
        return "No documents have been uploaded yet. Please upload documents before querying."

    if not docs:
        return "No relevant information found in the given documents."

    formatted_docs = []
    for i, doc in enumerate(docs, start=1):
        source = doc.metadata.get("source", "uploaded document")
        formatted_docs.append(
            f"[Source {i}: {source}]\n{doc.page_content}"
        )
    return "\n\n".join(formatted_docs)