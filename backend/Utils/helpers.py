import json
from langchain_core.messages import AIMessage, AIMessageChunk, ToolMessage

def sse_data(payload: dict) -> str:
    """Serialize a python dict payload into Server-Sent Events (SSE) format."""
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

def should_stream_chunk(chunk, metadata) -> bool:
    """
    Prevents raw tool/search/RAG JSON from appearing in the frontend message stream.
    Only allows normal assistant text messages to pass.
    """
    metadata = metadata or {}
    node_name = str(metadata.get("langgraph_node", "")).lower()

    if "tool" in node_name:
        return False

    if isinstance(chunk, ToolMessage):
        return False

    if not isinstance(chunk, (AIMessage, AIMessageChunk)):
        return False

    if getattr(chunk, "tool_calls", None):
        return False

    if getattr(chunk, "invalid_tool_calls", None):
        return False

    additional_kwargs = getattr(chunk, "additional_kwargs", {}) or {}
    if additional_kwargs.get("tool_calls"):
        return False

    return True

def extract_text_from_chunk(chunk) -> str:
    """Extract standard text from LangChain message chunks securely."""
    content = getattr(chunk, "content", "")

    if not content:
        return ""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, str):
                text_parts.append(item)
            elif isinstance(item, dict):
                if item.get("type") == "text" and isinstance(item.get("text"), str):
                    text_parts.append(item["text"])
                elif isinstance(item.get("text"), str):
                    text_parts.append(item["text"])
                elif isinstance(item.get("content"), str):
                    text_parts.append(item["content"])
        return "".join(text_parts)

    return ""


def guess_provider(model_name: str) -> str:
    """
    Determine the model provider based on the model name.
    """
    model_lower = model_name.lower()
    if "gemini" in model_lower:
        return "gemini"
    elif "mistral" in model_lower:
        return "mistral"
    elif "gpt-" in model_lower or "o1-" in model_lower or "o3-" in model_lower or "openai" in model_lower:
        return "openai"
    elif "llama" in model_lower or "mixtral" in model_lower or "groq" in model_lower:
        return "groq"
    else: return  "gemini"