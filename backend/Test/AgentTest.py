import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from Agent.chatbot import get_agent
from Memory.database import init_db
from langchain_core.messages import HumanMessage

init_db()  # Initialize the database when the module is imported

agent = get_agent("mistral-small-latest")

config = {
    "configurable": {
        "thread_id": "test_thread_id"
    }
}

for message_chunk, metadata in agent.stream(
    {
        "messages":[HumanMessage(content="Hello, how are you?")],
    },
    config=config,
    stream_mode="messages"
):
    if message_chunk.content:
        print(message_chunk.content, end="", flush=True)
