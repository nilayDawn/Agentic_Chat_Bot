from pypdf import PdfReader
import docx2txt
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain.tools import tool
from langchain_core.documents import Document
import os
from pathlib import Path
import Tools.memory_toos as _memory_state

Path('uploads').mkdir(parents=True, exist_ok=True)
Path('database').mkdir(parents=True, exist_ok=True)

# Embeddings model
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

def read_file_text(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        reader = PdfReader(file_path)
        text = ""

        for page in reader.pages:
            text += page.extract_text() or ""
            text += "\n"

        return text

    if suffix == ".docx":
        return docx2txt.process(file_path)

    if suffix in [".txt", ".md", ".py", ".csv"]:
        return path.read_text(encoding="utf-8", errors="ignore")

    raise ValueError("Unsupported file type. Upload PDF, DOCX, TXT, MD, PY, or CSV.")

def ingest_document(file_path: str, thread_id: str):
    text = read_file_text(file_path)

    if not text.strip():
        raise ValueError("The document is empty or could not be read.")
    
    # Split documents
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    chunks = splitter.split_text(text)

    docs:list[Document] = [
        Document(
            page_content=chunk,
            metadata={"source": os.path.basename(file_path), "thread_id": thread_id}
        )
        for chunk in chunks
    ]

    db_path = 'database/chroma_db'
    db = Chroma(
        persist_directory=db_path,
        embedding_function=embeddings,
        collection_name="rag_documents"
    )
    db.add_documents(docs)

def get_retriever(query: str, k: int = 4, thread_id: str | None = None):
    thread_id = thread_id or _memory_state.CURRENT_THREAD_ID
    db_path = 'database/chroma_db'
    if not os.path.exists(db_path):
        raise FileNotFoundError("Chroma database not found. Please ingest documents first.")
    
    db = Chroma(
        persist_directory=db_path,
        embedding_function=embeddings,
        collection_name="rag_documents"
    )
    retriever = db.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": k,
            "filter": {"thread_id": thread_id}
        }
    )
    return retriever


@tool
def rag_tool(query: str) -> str:
    """
    A tool that uses a retriever to fetch relevant information based on the query. Use this tool to answer questions based on the ingested documents. The tool will return a string response containing the relevant information.

    Args:
        query (str): The query to be answered based on the ingested documents.

    Returns:
        str: A string response containing the relevant information based on the query.
    """
    try:
        thread_id = _memory_state.CURRENT_THREAD_ID
        retriever = get_retriever(query, thread_id=thread_id)
        docs = retriever.invoke(query)
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