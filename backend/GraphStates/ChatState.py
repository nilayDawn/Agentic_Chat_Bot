
from langchain_protocol import TypedDict,Annotated
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage],add_messages]