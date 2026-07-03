from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.tools import tool
import os

# Embeddings model
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

def ingest_document(file_path: str):
    db_path = 'database/faiss_db'
    # Check if directory exists
    if not os.path.exists('database'):
        os.mkdir('database')
                
    # Check if the file exists
    db_exists = os.path.exists(db_path)

    # Load documents
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    # Split documents
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)

    # Create or load FAISS vector store
    if db_exists:
        db = FAISS.load_local(
            db_path,
            embeddings,
            allow_dangerous_deserialization=True
        )
        db.add_documents(chunks)
    else:
        db = FAISS.from_documents(chunks, embeddings)

    db.save_local(db_path)

def get_retriever():
    db_path = 'database/faiss_db'
    if not os.path.exists(db_path):
        raise FileNotFoundError("FAISS database not found. Please ingest documents first.")
    
    db = FAISS.load_local(db_path, embeddings , allow_dangerous_deserialization=True)
    retriever =  db.as_retriever(
        search_type="similarity",  # Use similarity search
        search_kwargs={"k": 4}  # Retrieve top 4 relevant chunks
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
    retriever = get_retriever()
    docs = retriever.invoke(query)

    if not docs:
        return "No relevant information found in the given documents."

    formatted_docs = []

    for index, doc in enumerate(docs):
        source = doc.metadata.get("source", "Unknown Source")
        page = doc.metadata.get("page", "Unknown Page")

        formatted_docs.append(
            f"Document {index +1}\n"
            f"Source: {source}\n"
            f"Page: {page}\n"
            f"Content: {doc.page_content}\n"
        )
    return "\n\n".join(formatted_docs)