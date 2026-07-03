
from pypdf import PdfReader
import docx2txt
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_mistralai import MistralAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.tools import tool
from langchain_core.documents import Document
import os

from pathlib import Path

Path('uploads').mkdir(parents=True, exist_ok=True)


CURRENT_THREAD_ID = "default"


def set_current_thread_id(thread_id: str):
    global CURRENT_THREAD_ID
    CURRENT_THREAD_ID = thread_id

# Embeddings model
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
#embeddings = MistralAIEmbeddings(model="mistral-embed")

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

    db_path = 'database/faiss_db'
    db_exists = os.path.exists(db_path)
    # Create or load FAISS vector store
    if db_exists:
        db = FAISS.load_local(
            db_path,
            embeddings,
            allow_dangerous_deserialization=True
        )
        db.add_documents(docs)
    else:
        db = FAISS.from_documents(docs, embeddings)

    db.save_local(db_path)

def get_retriever(query: str, k: int = 4, thread_id: str = CURRENT_THREAD_ID):
    db_path = 'database/faiss_db'
    if not os.path.exists(db_path):
        raise FileNotFoundError("FAISS database not found. Please ingest documents first.")
    
    db = FAISS.load_local(db_path, embeddings , allow_dangerous_deserialization=True)
    retriever =  db.as_retriever(
        query=query,
        search_type="similarity",  # Use similarity search
        search_kwargs={"k": k},  # Retrieve top k relevant chunks
        filter = {"thread_id": thread_id}
    )
    return retriever


@tool
def rag_tool(query: str, thread_id: str = CURRENT_THREAD_ID) -> str:
    """
    A tool that uses a retriever to fetch relevant information based on the query. Use this tool to answer questions based on the ingested documents. The tool will return a string response containing the relevant information.

    Args:
        query (str): The query to be answered based on the ingested documents.

    Returns:
        str: A string response containing the relevant information based on the query.
    """
    retriever = get_retriever(query, thread_id=thread_id)  
    docs = retriever.invoke(query, thread_id=thread_id)

    if not docs:
        return "No relevant information found in the given documents."

    formatted_docs = []

    for index, doc in enumerate(docs):
        source = doc.metadata.get("source", "Unknown Source")
        page = doc.metadata.get("page", "Unknown Page")

        for i, doc in enumerate(docs, start=1):
            source = doc.metadata.get("source", "uploaded document")
            formatted_docs.append(
                f"[Source {i}: {source}]\n{doc.page_content}"
            )
    return "\n\n".join(formatted_docs)