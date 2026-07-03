from langgraph.graph import StateGraph, START, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from typing import Annotated, TypedDict
#from langgraph.checkpoint.memory import MemorySaver       # --saves conversation to ram and can be used to save to disk or database
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph.message import add_messages

import sqlite3

from langchain_ollama import ChatOllama
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatOllama(
    model="llama3:latest",
    base_url= os.getenv("OLLAMA_BASE_URL"),
    temperature=0.5,  
)

class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage],add_messages]

def chat_node(state: ChatState):
    #take user query form state
    messaages = state["messages"]

    #send to llm and get response
    response = llm.invoke(messaages)

    #response store state
    return {"messages": [response]}

#CREATE GRAPH
os.mkdir('database') if not os.path.exists('database') else None
conn = sqlite3.connect(database = 'database/chatbot_state.db',check_same_thread=False)
checkpoint = SqliteSaver(conn)

graph = StateGraph(ChatState)

#nodes
graph.add_node('chat_node',chat_node)

#edges
graph.add_edge(START,'chat_node')
graph.add_edge('chat_node',END)

chatbot = graph.compile(checkpointer=checkpoint)

def get_all_thread_ids():
    all_threads = set()
    for ckpt in checkpoint.list(None):
        all_threads.add(ckpt.config['configurable']['thread_id'])
    return list(all_threads)

if __name__ == "__main__":
    CONFIG = {
        "configurable": {
            'thread_id': "test_thread_id"
        }
    }
    #res = chatbot.invoke({"messages":[HumanMessage(content="Hello, how are you? My name is Abir.")]},config=CONFIG)
    print(get_all_thread_ids())