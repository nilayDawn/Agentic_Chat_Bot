from langchain_core.tools import tool
from Memory.database import save_memory, search_memory

from langchain_core.runnables import RunnableConfig

CURRENT_THREAD_ID = "default"


def set_current_thread_id(thread_id: str):
    global CURRENT_THREAD_ID
    CURRENT_THREAD_ID = thread_id


@tool
def remember_this(memory: str, config: RunnableConfig ) -> str:
    """
    Save an important user preference or fact into long-term memory.
    Use this when the user asks you to remember something.
    """
    thread_id = None
    if config:
        thread_id = config.get("configurable", {}).get("thread_id")
    if not thread_id:
        thread_id = CURRENT_THREAD_ID

    return save_memory(
        thread_id=thread_id,
        memory=memory
    )
@tool
def recall_memory(query: str, config: RunnableConfig ) -> str:
    """
    Recall saved long-term memories about the user or this conversation.
    """
    thread_id = None
    if config:
        thread_id = config.get("configurable", {}).get("thread_id")
    if not thread_id:
        thread_id = CURRENT_THREAD_ID

    return search_memory(
        thread_id=thread_id,
        query=query
    )

tools = [remember_this, recall_memory]