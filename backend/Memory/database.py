from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

Path("Data").mkdir(parents=True, exist_ok=True)

DATABASE_URL = "sqlite:///Data/agent_memory.db"
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String, unique=True, index=True)
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


def init_db():
    Base.metadata.create_all(bind=engine)
    # Automatically migrate existing databases to include file_name and file_size columns
    import sqlite3
    db_path = "Data/agent_memory.db"
    if Path(db_path).exists():
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        try:
            cursor.execute("PRAGMA table_info(chat_messages);")
            columns = [row[1] for row in cursor.fetchall()]
            if "file_name" not in columns:
                cursor.execute("ALTER TABLE chat_messages ADD COLUMN file_name VARCHAR;")
            if "file_size" not in columns:
                cursor.execute("ALTER TABLE chat_messages ADD COLUMN file_size INTEGER;")
            if "tool_calls" not in columns:
                cursor.execute("ALTER TABLE chat_messages ADD COLUMN tool_calls TEXT;")
            conn.commit()
        except Exception as e:
            print("Database migration warning:", e)
        finally:
            conn.close()


#----Utility Funcitons----
def create_or_update_conversation(thread_id:str, first_message:str | None = None):
    """
    Create a new conversation or update an existing one based on the thread_id.
    If first_message is provided, it will be added to the chat_messages table.
    """
    db = SessionLocal()
    try:
        conversation = db.query(Conversation).filter(Conversation.thread_id == thread_id).first()

        if not conversation:
            title = "New Chat"
            if first_message:
                title = first_message.strip()[:40]  # Use the first 40 characters of the first message as title
                if  len(first_message) > 40:
                    title += "..."

            conversation = Conversation(
                thread_id=thread_id,
                title=title,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(conversation)
        else:
            conversation.updated_at = datetime.utcnow()

        db.commit()
    finally:
        db.close()

def list_conversations():
    """ List all conversations in the database """
    db = SessionLocal()

    try:
        return (
            db.query(Conversation)
            .order_by(Conversation.updated_at.desc())
            .all()
        )

    finally:
        db.close()
def delete_conversation(thread_id: str):
    """ Delete a conversation and its associated chat messages and long-term memories based on the thread_id. """
    db = SessionLocal()

    try:
        # Delete chat messages associated with the thread_id
        db.query(ChatMessage).filter(ChatMessage.thread_id == thread_id).delete()

        # Delete long-term memories associated with the thread_id
        db.query(LongTermMemory).filter(LongTermMemory.thread_id == thread_id).delete()

        # Delete the conversation itself
        db.query(Conversation).filter(Conversation.thread_id == thread_id).delete()

        db.commit()
    finally:
        db.close()
def save_chat_message(thread_id: str, role: str, content: str, file_name: str | None = None, file_size: int | None = None, tool_calls: str | None = None):
    """ Save a chat message to the database under the specified thread_id."""
    db = SessionLocal()

    try:
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

        conversation = (
            db.query(Conversation)
            .filter(Conversation.thread_id == thread_id)
            .first()
        )

        if conversation:
            conversation.updated_at = datetime.utcnow()

        db.commit()

    finally:
        db.close()
def get_chat_history(thread_id: str):
    db = SessionLocal()

    try:
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