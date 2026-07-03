import sys
from pathlib import Path
# Force the project root directory into Python's search path
sys.path.append(str(Path(__file__).resolve().parent.parent))

#-------PACKAGE IMPORTS-------
from backend.Agent.chatbot import AIAgent
from backend.Memory.sqlite import DataBase
from langchain_core.messages import  AIMessageChunk, HumanMessage
from langgraph.types import Command
import streamlit as st
from utils import *
from backend.Tools.rag_tool import ingest_document
import os



#initialize the chatbot
agent = AIAgent()
chatbot = agent.build_graph()

#========== STREAMLIT APP INITIALIZATION ==========

st.title("Agentic Chat Bot")

# Premium CSS styling injection
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    
    /* Apply premium font family globally */
    html, body, [class*="css"] {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }
    
    /* Premium Title styling */
    .stTitle h1 {
        background: linear-gradient(90deg, #ff8c00 0%, #ff3d00 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        letter-spacing: -0.5px;
    }
    
    /* Styled container for HITL */
    div[data-testid="stVerticalBlock"] > div:has(button[key="hitl_approve"]) {
        background: rgba(255, 140, 0, 0.05) !important;
        border: 1px solid rgba(255, 140, 0, 0.2) !important;
        border-radius: 12px !important;
        padding: 20px !important;
        box-shadow: 0 8px 32px 0 rgba(255, 140, 0, 0.08) !important;
        backdrop-filter: blur(8px) !important;
        animation: slideUp 0.4s ease-out;
    }
    
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Customise primary buttons */
    button[data-testid="baseButton-primary"] {
        background: linear-gradient(135deg, #ff8c00 0%, #ff4500 100%) !important;
        border: none !important;
        color: white !important;
        box-shadow: 0 4px 15px rgba(255, 69, 0, 0.3) !important;
        transition: all 0.3s ease !important;
    }
    button[data-testid="baseButton-primary"]:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(255, 69, 0, 0.4) !important;
    }
    
    /* Customise secondary buttons */
    button[data-testid="baseButton-secondary"] {
        transition: all 0.3s ease !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    button[data-testid="baseButton-secondary"]:hover {
        transform: translateY(-2px) !important;
        background-color: rgba(255, 255, 255, 0.05) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
    }
</style>
""", unsafe_allow_html=True)


# 1. Master list storing all conversation IDs
if 'thread_ids' not in st.session_state:
    st.session_state['thread_ids'] = DataBase().get_all_thread_ids()

# 2. String storing the active conversation ID
if 'current_thread_id' not in st.session_state:
    st.session_state['current_thread_id'] = generate_thread_id()
    add_thread_id_to_session(st.session_state['current_thread_id'])

# 3. List storing the UI message history
if 'message_history' not in st.session_state:
    st.session_state['message_history'] = []



# Pass the single string current_thread_id here, NOT the full list
CONFIG = {'configurable': {'thread_id': st.session_state['current_thread_id']}}


#========== SIDEBAR THREADING ==========
st.sidebar.title("All Conversations")

# Button to start a new conversation
if st.sidebar.button("➕ New Conversation", use_container_width=True):
    reset_conversation()
    st.rerun()

# Display current active thread ID for clarity
st.sidebar.caption(f"Active Session: {st.session_state['current_thread_id'][:8]}...")


st.sidebar.write("---")
st.sidebar.subheader("Recent Chats")

# 2. Render all threads. [::-1] reverses the list to show the newest thread first.
for index, thread_id in enumerate(st.session_state['thread_ids'][::-1]):
    # Format the button label nicely (e.g., "Chat 1: a1b2c3d4...")
    display_index = len(st.session_state['thread_ids']) - index
    is_interrupted = check_thread_interrupted(chatbot, thread_id)
    icon = "⚠️" if is_interrupted else "💬"
    button_label = f"{icon} Chat {display_index}: {thread_id[:8]}..."
    
    # Highlight the currently active thread using type="primary"
    is_active = thread_id == st.session_state['current_thread_id']
    button_type = "primary" if is_active else "secondary"
    
    # Create a button for each thread
    if st.sidebar.button(button_label, key=f"thread_{thread_id}", type=button_type, use_container_width=True):
        # Switch the active thread ID
        st.session_state['current_thread_id'] = thread_id
        
        # 💡 IMPORTANT: Load historical messages from LangGraph's state memory
        # Fetching state history directly from your LangGraph chatbot instance
        try:
            state_history = chatbot.get_state({'configurable': {'thread_id': thread_id}})
            messages = state_history.values.get("messages", [])
            
            # Map LangChain message objects back to Streamlit UI roles
            st.session_state['message_history'] = [
                {
                    "role": "user" if isinstance(msg, HumanMessage) else "assistant", 
                    "content": msg.content
                }
                for msg in messages
            ]
        except Exception:
            # Fallback if the state graph is empty or hasn't started yet
            st.session_state['message_history'] = []
            
        st.rerun()

#========== DOCUMENT UPLOAD ==========

# Store uploaded document info
if 'uploaded_document' not in st.session_state:
    st.session_state['uploaded_document'] = None

# Upload area placed above the chat
uploaded_file = st.file_uploader(
    "Upload PDF",
    type=["pdf"],
    label_visibility="collapsed"
)

# Process uploaded file only once
if uploaded_file is not None:

    if (
        st.session_state['uploaded_document'] is None
        or st.session_state['uploaded_document'] != uploaded_file.name
    ):

        with st.spinner("Processing document..."):

            # Create uploads folder
            os.makedirs("uploads", exist_ok=True)

            # Save uploaded PDF locally
            file_path = os.path.join(
                "uploads",
                uploaded_file.name
            )

            with open(file_path, "wb") as f:
                f.write(uploaded_file.getbuffer())

            # Ingest document into vector database
            ingest_document(file_path)

            st.session_state['uploaded_document'] = uploaded_file.name

        st.success(
            f"Document '{uploaded_file.name}' added successfully."
        )

# ChatGPT-style attachment indicator
if st.session_state['uploaded_document']:

    with st.container(border=True):
        col1, col2 = st.columns([1, 10])

        with col1:
            st.markdown("📄")

        with col2:
            st.markdown(
                f"**{st.session_state['uploaded_document']}**"
            )
            st.caption(
                "Attached document available for retrieval"
            )

#========== MAIN CHAT INTERFACE ==========
# Check if there is an active interrupt for the current thread
has_interrupt = False
interrupt_prompt = ""
try:
    state_snapshot = chatbot.get_state(CONFIG)
    if state_snapshot.tasks:
        for task in state_snapshot.tasks:
            if task.interrupts:
                has_interrupt = True
                interrupt_prompt = task.interrupts[0].value
                break
except Exception:
    pass

def stream_response(input_data):
    with st.chat_message("assistant"):
        # Container to show tool activity
        tool_status = st.status("🤔 Thinking...", expanded=True)

        # Placeholder for the streamed response
        response_placeholder = st.empty()

        full_response = ""
        used_tools = set()

        # Stream from your chatbot/graph
        for message_chunk, metadata in chatbot.stream(
            input_data,
            config=CONFIG,
            stream_mode="messages"
        ):
            # Detect tool calls
            if isinstance(message_chunk, AIMessageChunk):
                tool_calls = getattr(message_chunk, "tool_calls", [])

                for tool_call in tool_calls:
                    tool_name = tool_call.get("name", "Unknown Tool")

                    # Avoid showing the same tool repeatedly
                    if tool_name not in used_tools:
                        used_tools.add(tool_name)
                        tool_status.write(f"🔧 Using **{tool_name}**")

            # Stream assistant text
            if isinstance(message_chunk, AIMessageChunk):
                content = message_chunk.content

                # Case 1: content is a string
                if isinstance(content, str):
                    full_response += content

                # Case 2: content is a list
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            if item.get("type") == "text":
                                full_response += item.get("text", "")
                        elif isinstance(item, str):
                            full_response += item

                if full_response.strip():
                    response_placeholder.markdown(full_response)

        # Update final status
        if used_tools:
            tool_status.update(
                label=f"✅ Finished ({len(used_tools)} tool(s) used)",
                state="complete",
                expanded=False
            )
        else:
            tool_status.update(
                label="✅ Response generated",
                state="complete",
                expanded=False
            )

    # Save to chat history if needed
    if full_response.strip():
        st.session_state.message_history.append(
            {"role": "assistant", "content": full_response}
        )

# Loading the conversation history from the session state
for message in st.session_state['message_history']:
    with st.chat_message(message["role"]):
        st.markdown(message["content"]) # Using markdown handles layout cleaner than st.text

# If there is a pending interrupt, show the HITL action container
if has_interrupt:
    with st.container():
        st.markdown(
            f"""
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 24px;">⚠️</span>
                <div style="font-weight: 600; font-size: 1.1em; color: #ff9800; font-family: 'Outfit', sans-serif;">
                    HUMAN APPROVAL REQUIRED
                </div>
            </div>
            <div style="font-size: 1.05em; margin-bottom: 15px; padding-left: 34px; color: #eceff1; font-family: 'Outfit', sans-serif;">
                {interrupt_prompt}
            </div>
            """, 
            unsafe_allow_html=True
        )
        
        col1, col2 = st.columns([1, 1])
        with col1:
            if st.button("✅ Approve", key="hitl_approve", use_container_width=True, type="primary"):
                # Add human action message to history for UI
                st.session_state['message_history'].append({"role": "user", "content": "Approved purchase."})
                # Resume execution with "yes"
                stream_response(Command(resume="yes"))
                st.rerun()
        with col2:
            if st.button("❌ Decline", key="hitl_decline", use_container_width=True):
                # Add human action message to history for UI
                st.session_state['message_history'].append({"role": "user", "content": "Declined purchase."})
                # Resume execution with "no"
                stream_response(Command(resume="no"))
                st.rerun()

# Render chat input
if has_interrupt:
    user_input = st.chat_input("Please resolve the pending approval above...", disabled=True)
else:
    user_input = st.chat_input("Type your message here...")

if user_input:
    # Add message to session state
    st.session_state['message_history'].append({"role": "user", "content": user_input})
    
    # Display the user message in the chat interface
    with st.chat_message('user'): 
        st.markdown(user_input)

    # Stream the chatbot response
    stream_response({"messages": [HumanMessage(content=user_input)]})
    st.rerun()

   
