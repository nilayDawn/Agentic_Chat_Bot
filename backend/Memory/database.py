from datetime import datetime
import os
from dotenv import load_dotenv

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String, unique=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String, index=True)
    role = Column(String)
    content = Column(Text)
    file_name = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    tool_calls = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LongTermMemory(Base):
    __tablename__ = "long_term_memory"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String, index=True)
    memory = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserDocument(Base):
    __tablename__ = "user_documents"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, index=True, unique=True)
    thread_id = Column(String, index=True)
    user_id = Column(String, index=True)
    filename = Column(String)
    status = Column(String)  # "processing", "ready", "failed"
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


#----Utility Functions----
def create_or_update_conversation(thread_id: str, user_id: str, first_message: str | None = None):
    """
    Create a new conversation or update an existing one based on the thread_id and user_id.
    If first_message is provided, it will be added to the chat_messages table.
    """
    db = SessionLocal()
    try:
        conversation = db.query(Conversation).filter(Conversation.thread_id == thread_id).first()

        if not conversation:
            title = "New Chat"
            if first_message:
                title = first_message.strip()[:40]  # Use the first 40 characters of the first message as title
                if len(first_message) > 40:
                    title += "..."

            conversation = Conversation(
                thread_id=thread_id,
                user_id=user_id,
                title=title,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(conversation)
        else:
            conversation.updated_at = datetime.utcnow()
            if not conversation.user_id:
                conversation.user_id = user_id

        db.commit()
    finally:
        db.close()

def list_conversations(user_id: str):
    """ List all conversations belonging to the user_id in the database """
    db = SessionLocal()

    try:
        return (
            db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .all()
        )

    finally:
        db.close()

def delete_conversation(thread_id: str, user_id: str):
    """ Delete a conversation belonging to user_id and its associated chat messages and memories. """
    db = SessionLocal()

    try:
        # Check ownership first
        conversation = db.query(Conversation).filter(Conversation.thread_id == thread_id, Conversation.user_id == user_id).first()
        if conversation:
            # Delete chat messages associated with the thread_id
            db.query(ChatMessage).filter(ChatMessage.thread_id == thread_id).delete()

            # Delete long-term memories associated with the thread_id
            db.query(LongTermMemory).filter(LongTermMemory.thread_id == thread_id).delete()

            # Delete the conversation itself
            db.delete(conversation)
            db.commit()
    finally:
        db.close()

def save_chat_message(thread_id: str, user_id: str, role: str, content: str, file_name: str | None = None, file_size: int | None = None, tool_calls: str | None = None):
    """ Save a chat message to the database, ensuring ownership validation. """
    db = SessionLocal()

    try:
        conversation = db.query(Conversation).filter(Conversation.thread_id == thread_id).first()
        if not conversation:
            conversation = Conversation(
                thread_id=thread_id,
                user_id=user_id,
                title=content.strip()[:40] + ("..." if len(content) > 40 else ""),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(conversation)
        elif conversation.user_id != user_id:
            raise ValueError("Unauthorized access to thread")

        msg = ChatMessage(
            thread_id=thread_id,
            role=role,
            content=content,
            file_name=file_name,
            file_size=file_size,
            tool_calls=tool_calls,
            created_at=datetime.utcnow()
        )

        db.add(msg)
        conversation.updated_at = datetime.utcnow()
        db.commit()

    finally:
        db.close()

def get_chat_history(thread_id: str, user_id: str):
    """ Get chat history for a thread, verifying ownership first """
    db = SessionLocal()

    try:
        conversation = db.query(Conversation).filter(Conversation.thread_id == thread_id, Conversation.user_id == user_id).first()
        if not conversation:
            return []

        return (
            db.query(ChatMessage)
            .filter(ChatMessage.thread_id == thread_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

    finally:
        db.close()
def save_memory(thread_id: str, memory: str):
    """ Save long-term memory to the database under the specified thread_id. """
    db = SessionLocal()

    try:
        item = LongTermMemory(
            thread_id=thread_id,
            memory=memory,
            created_at=datetime.utcnow()
        )

        db.add(item)
        db.commit()

        return "Memory saved successfully."

    finally:
        db.close()
def search_memory(thread_id: str, query: str):
    """ Search for long-term memory based on the provided query. """
    db = SessionLocal()

    try:
        query_filter = db.query(LongTermMemory)
        
        # Perform substring matching if query has text
        search_text = query.strip() if query else ""
        if search_text and search_text != "*":
            search_term = f"%{search_text}%"
            query_filter = query_filter.filter(LongTermMemory.memory.like(search_term))
            
        memories = (
            query_filter
            .order_by(LongTermMemory.created_at.desc())
            .limit(20)
            .all()
        )

        # Fallback to the most recent memories if no specific matches found
        if not memories:
            memories = (
                db.query(LongTermMemory)
                .order_by(LongTermMemory.created_at.desc())
                .limit(20)
                .all()
            )

        if not memories:
            return "No saved memory found."

        return "\n".join([f"- {m.memory}" for m in memories])

    finally:
        db.close()


def create_document_tracker(file_id: str, thread_id: str, user_id: str, filename: str):
    db = SessionLocal()
    try:
        doc = UserDocument(
            file_id=file_id,
            thread_id=thread_id,
            user_id=user_id,
            filename=filename,
            status="processing",
            created_at=datetime.utcnow()
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc
    finally:
        db.close()


def update_document_status(file_id: str, status: str, error_message: str | None = None):
    db = SessionLocal()
    try:
        doc = db.query(UserDocument).filter(UserDocument.file_id == file_id).first()
        if doc:
            doc.status = status
            doc.error_message = error_message
            db.commit()
        return doc
    finally:
        db.close()


def list_documents_for_thread(thread_id: str, user_id: str):
    db = SessionLocal()
    try:
        return (
            db.query(UserDocument)
            .filter(UserDocument.thread_id == thread_id, UserDocument.user_id == user_id)
            .order_by(UserDocument.created_at.desc())
            .all()
        )
    finally:
        db.close()