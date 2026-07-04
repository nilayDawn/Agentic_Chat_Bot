import os
import sqlite3
from langgraph.graph import StateGraph, START, END , MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mistralai import ChatMistralAI
from langgraph.checkpoint.sqlite import SqliteSaver
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

#import tools
from Tools.calculator_tool import calculator
from Tools.weather_tool import WeatherTool
from Tools.stock_tool import StockTool
from Tools.search_tool import search_tool
from Tools.rag_tool import rag_tool
from Tools.memory_toos import remember_this, recall_memory
from prompts.prompt import SYSTEM_PROMPT



load_dotenv()

Path('Data').mkdir(parents=True, exist_ok=True)


DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

ALLOWED_MODELS = {
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite", # Included the lite version if needed
    "gemini-1.5-flash",      # Kept for fallback compatibility 
    "gemini-1.5-pro",
    "mistral-small-latest",
    "mistral-medium-latest",
    "mistral-large-latest",
}

def normalize_model_name(model_name: str | None) -> str:
    """
    Normalize the model name to ensure it is in the allowed set.
    If the provided model name is not in the allowed set, default to DEFAULT_MODEL.
    """
    if model_name is None:
        return DEFAULT_MODEL
    model_name = model_name.strip().lower()
    if model_name not in ALLOWED_MODELS:
        print(f"Warning: Model '{model_name}' is not recognized. Defaulting to '{DEFAULT_MODEL}'.")
        return DEFAULT_MODEL
    return model_name


def build_agent(model_name: str | None = None):
    """
    Build and return the agent's state graph based on the specified model name.
    """
    selected_model = normalize_model_name(model_name)
    
    # Initialize the appropriate model based on the normalized model name
    if selected_model.startswith("gemini"):
        llm = ChatGoogleGenerativeAI(model=selected_model)
    elif selected_model.startswith("mistral"):
        llm = ChatMistralAI(model_name=selected_model)
    else:
        raise ValueError(f"Unsupported model: {selected_model}")

    tools = [calculator, 
            *WeatherTool().tool_list, 
            *StockTool().tool_list,
            search_tool,
            rag_tool,
            remember_this,
            recall_memory
            ]

    #bind tools
    llm_with_tools = llm.bind_tools(tools)

    def chatbot_node(state:MessagesState):
        messages = [SYSTEM_PROMPT] + state["messages"]
        response = llm_with_tools.invoke(messages)

        return{
            "messages": [response]
        }
    tool_node = ToolNode(tools)

    workflow = StateGraph(MessagesState)

    workflow.add_node("chatbot",chatbot_node)
    workflow.add_node("tools",tool_node)

    workflow.add_edge(START, "chatbot")
    workflow.add_conditional_edges("chatbot",tools_condition)
    workflow.add_edge("tools","chatbot")

    conn = sqlite3.connect('Data/checkpoints.sqlite', check_same_thread=False)

    checkpointer = SqliteSaver(conn)

    return workflow.compile(checkpointer = checkpointer)
        

_AGENT_CACHE = {}

def get_agent(model_name: str | None = None):
    """
    Retrieve the agent for the specified model name from cache or build a new one if not cached.
    """
    selected_model = normalize_model_name(model_name)
    
    if selected_model not in _AGENT_CACHE:
        _AGENT_CACHE[selected_model] = build_agent(selected_model)
    
    return _AGENT_CACHE[selected_model]

if __name__ == "__main__":
    pass