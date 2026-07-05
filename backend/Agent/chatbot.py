import os
import sqlite3
from langgraph.graph import StateGraph, START, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver
from pathlib import Path
from langchain_core.runnables import RunnableConfig

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

#import guardrails
from Agent.guardrails import guardrails_node, guardrails_condition, guess_provider

Path('Data').mkdir(parents=True, exist_ok=True)

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def normalize_model_name(model_name: str | None) -> str:
    """
    Normalize the model name. If not provided, returns the default model.
    """
    if not model_name:
        return DEFAULT_MODEL
    return model_name.strip()

def build_agent(model_name: str | None = None):
    """
    Build and return the agent's state graph based on the specified model name.
    """
    selected_model = normalize_model_name(model_name)
    
    tools = [
        calculator, 
        *WeatherTool().tool_list, 
        *StockTool().tool_list,
        search_tool,
        rag_tool,
        remember_this,
        recall_memory
    ]

    def chatbot_node(state: MessagesState, config: RunnableConfig):
        # 1. Retrieve the model name, provider, and API keys from the configuration
        configurable = config.get("configurable", {})
        model = configurable.get("model_name", selected_model)
        provider = configurable.get("provider")
        api_keys = configurable.get("api_keys", {})

        # Determine provider if not specified
        if not provider:
            provider = guess_provider(model)

        # 2. Get API key (custom or from env)
        api_key = api_keys.get(provider)
        if not api_key:
            if provider == "gemini":
                api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            elif provider == "mistral":
                api_key = os.getenv("MISTRAL_API_KEY")
            elif provider == "openai":
                api_key = os.getenv("OPENAI_API_KEY")
            elif provider == "groq":
                api_key = os.getenv("GROQ_API_KEY")

        # 3. Instantiate the selected model
        if provider == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(model=model, google_api_key=api_key)
        elif provider == "mistral":
            from langchain_mistralai import ChatMistralAI
            llm = ChatMistralAI(model_name=model, mistral_api_key=api_key)
        elif provider == "openai":
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model=model, api_key=api_key)
        elif provider == "groq":
            from langchain_groq import ChatGroq
            llm = ChatGroq(model=model, groq_api_key=api_key)
        else:
            raise ValueError(f"Unsupported provider: {provider}")

        # 4. Bind the tools
        llm_with_tools = llm.bind_tools(tools)

        # 5. Invoke
        # Normalize message contents for strict providers (e.g., Mistral requires string content only)
        normalized_messages = []
        for m in [SYSTEM_PROMPT] + state["messages"]:
            # LangChain message objects expose .content; providers like Mistral reject non-string content
            content = getattr(m, "content", "")
            if not isinstance(content, str):
                # Fallback: stringify to avoid 422 errors
                content = str(content)

            # Re-wrap into the same message type with normalized string content
            # (preserve any additional kwargs safely)
            if m.__class__.__name__ == "SystemMessage":
                from langchain_core.messages import SystemMessage
                normalized_messages.append(SystemMessage(content=content))
            elif m.__class__.__name__ == "HumanMessage":
                from langchain_core.messages import HumanMessage
                normalized_messages.append(HumanMessage(content=content))
            else:
                # AIMessage / other message types
                from langchain_core.messages import AIMessage
                normalized_messages.append(AIMessage(content=content, additional_kwargs=getattr(m, "additional_kwargs", {}) or {}))

        response = llm_with_tools.invoke(normalized_messages)


        return {
            "messages": [response]
        }

    tool_node = ToolNode(tools)

    workflow = StateGraph(MessagesState)

    workflow.add_node("guardrails", guardrails_node)
    workflow.add_node("chatbot", chatbot_node)
    workflow.add_node("tools", tool_node)

    workflow.add_edge(START, "guardrails")
    workflow.add_conditional_edges("guardrails", guardrails_condition)
    workflow.add_conditional_edges("chatbot", tools_condition)
    workflow.add_edge("tools", "chatbot")

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