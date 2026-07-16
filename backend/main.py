from dotenv import load_dotenv
from pathlib import Path
import uuid
import json

import uvicorn
from fastapi import FastAPI, Request, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from langchain_core.messages import AIMessage, HumanMessage,ToolMessage,AIMessageChunk

from Agent.chatbot import get_agent
from Memory.database import init_db,save_chat_message,get_chat_history,create_or_update_conversation,list_conversations,delete_conversation
from Tools.rag_tool import ingest_document
from Tools.memory_toos import set_current_thread_id
from Utils.auth import get_current_user

app = FastAPI(
    title="Agentic Chat Bot Backend",
    description="This is the backend for the Agentic Chat Bot, which provides an API for interacting with the chatbot, managing conversations, and handling memory.",
    version="0.0.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



Path('Data').mkdir(parents=True, exist_ok=True)

init_db()  # Initialize the database when the application starts

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "This is the backend for the Agentic Chat Bot. The API is up and running."}

@app.get("/conversations")
async def conversations(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    items = list_conversations(user_id)

    return {
        "conversations": [
            {
                "thread_id": item.thread_id,
                "title": item.title,
                "created_at": item.created_at.isoformat(),
                "updated_at": item.updated_at.isoformat()
            }
            for item in items
        ]
    }
@app.get("/history/{thread_id}")
async def history(thread_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    messages = get_chat_history(thread_id, user_id)

    return {
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "file_name": msg.file_name,
                "file_size": msg.file_size,
                "tool_calls": msg.tool_calls
            }
            for msg in messages
        ]
    }

@app.delete("/conversations/{thread_id}")
async def delete_conversation_endpoint(thread_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    try:
        delete_conversation(thread_id, user_id)
        return {"success": True, "message": f"Conversation {thread_id} deleted."}
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    thread_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    try:
        allowed_extensions = [".pdf", ".docx", ".txt", ".md", ".py", ".csv"]

        filename = file.filename or "uploaded_file"
        suffix = Path(filename).suffix.lower()

        if suffix not in allowed_extensions:
            return JSONResponse(
                {
                    "success": False,
                    "message": "Unsupported file type. Upload PDF, DOCX, TXT, MD, PY, or CSV."
                },
                status_code=400
            )

        # Read file bytes in memory
        file_bytes = await file.read()

        create_or_update_conversation(thread_id, user_id, "Uploaded document")

        # Run ingest_document asynchronously entirely in-memory
        background_tasks.add_task(ingest_document, file_bytes, filename, thread_id)

        return JSONResponse({
            "success": True,
            "message": f"Uploaded {filename} successfully. Processing started in the background."
        })

    except Exception as e:
        return JSONResponse(
            {
                "success": False,
                "message": str(e)
         },
            status_code=500
        )
    

from Utils.helpers import sse_data, should_stream_chunk, extract_text_from_chunk

@app.post("/chat/stream")
async def chat_stream(request: Request, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(
            {"error": "Invalid JSON body."},
            status_code=400
        )

    user_message = data.get("message", "")
    thread_id = data.get("thread_id", "default")
    selected_model = data.get("model", "gemini-2.5-flash")
    provider = data.get("provider", None)
    api_keys = data.get("api_keys", {})
    file_name = data.get("file_name", None)
    file_size = data.get("file_size", None)

    if not user_message.strip():
        return JSONResponse(
            {"error": "Message is required."},
            status_code=400
        )

    agent = get_agent(selected_model)

    create_or_update_conversation(thread_id, user_id, user_message)
    save_chat_message(thread_id, user_id, "user", user_message, file_name=file_name, file_size=file_size)

    set_current_thread_id(thread_id)

    config = {
        "configurable": {
            "thread_id": thread_id,
            "model_name": selected_model,
            "provider": provider,
            "api_keys": api_keys
        }
    }

    def event_generator():
        final_answer = ""
        tool_calls_data = {}

        try:
            # Check if the graph is currently interrupted (paused for human-in-the-loop input)
            state = agent.get_state(config)
            is_interrupted = bool(state.next and any(task.interrupts for task in state.tasks))

            if is_interrupted:
                from langgraph.types import Command
                inputs = Command(resume=user_message)
            else:
                inputs = {
                    "messages": [
                        HumanMessage(content=user_message)
                    ]
                }

            for chunk, metadata in agent.stream(
                inputs,
                config=config,
                stream_mode="messages"
            ):
                # Intercept tool call requests from AI models
                if isinstance(chunk, (AIMessage, AIMessageChunk)) and getattr(chunk, "tool_calls", None):
                    for tc in chunk.tool_calls:
                        tc_id = tc.get("id")
                        tc_name = tc.get("name")
                        if tc_id and tc_name:
                            tool_calls_data[tc_id] = {
                                "id": tc_id,
                                "name": tc_name,
                                "status": "running"
                            }
                            yield sse_data({
                                "tool_call": tool_calls_data[tc_id]
                            })

                # Intercept tool call responses/executions
                elif isinstance(chunk, ToolMessage):
                    tc_id = chunk.tool_call_id
                    if tc_id:
                        if tc_id not in tool_calls_data:
                            tool_calls_data[tc_id] = {
                                "id": tc_id,
                                "name": chunk.name or "tool",
                            }
                        tool_calls_data[tc_id]["status"] = "done"
                        yield sse_data({
                            "tool_call": tool_calls_data[tc_id]
                        })

                if not should_stream_chunk(chunk, metadata):
                    continue

                token = extract_text_from_chunk(chunk)

                if token:
                    final_answer += token
                    yield sse_data({"token": token})

            # Save the message with tool calls JSON if they exist
            tool_calls_json = None
            if tool_calls_data:
                tool_calls_json = json.dumps(list(tool_calls_data.values()))

            if final_answer.strip():
                save_chat_message(thread_id, user_id, "assistant", final_answer, tool_calls=tool_calls_json)

            yield sse_data({"done": True})

        except Exception as e:
            yield sse_data({"error": str(e)})
            yield sse_data({"done": True})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
