import sys
from pathlib import Path
# Force the project root directory into Python's search path
sys.path.append(str(Path(__file__).resolve().parent.parent))

#-------PACKAGE IMPORTS-------
from backend.chatbot import chatbot, get_all_thread_ids
from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage,ToolMessage
import streamlit as st
import uuid    # for generating unique thread ids

#=========UTILITY FUNCTIONS=========
def generate_thread_id():
    return str(uuid.uuid4())

def add_thread_id_to_session(thread_id):
    
    if 'thread_ids' not in st.session_state:
        st.session_state['thread_ids'] = []
    if thread_id not in st.session_state['thread_ids']:
        st.session_state['thread_ids'].append(thread_id)

# Create a completely new chat conversation
def reset_conversation():
    # Clear the current chat messages from the UI
    st.session_state['message_history'] = []
    # Generate a new string thread id
    new_id = generate_thread_id()
    st.session_state['current_thread_id'] = new_id
    # Add thread to the conversation list in the sidebar
    add_thread_id_to_session(new_id)


#========== STREAMLIT APP INITIALIZATION ==========

st.title("Agentic Chat Bot")

# 1. Master list storing all conversation IDs
if 'thread_ids' not in st.session_state:
    st.session_state['thread_ids'] = get_all_thread_ids()

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
    button_label = f"💬 Chat {display_index}: {thread_id[:8]}..."
    
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


#========== MAIN CHAT INTERFACE ==========
# Loading the conversation history from the session state
for message in st.session_state['message_history']:
    with st.chat_message(message["role"]):
        st.markdown(message["content"]) # Using markdown handles layout cleaner than st.text

user_input = st.chat_input("Type your message here...")

if user_input:
    # Add message to session state
    st.session_state['message_history'].append({"role": "user", "content": user_input})
    
    # Display the user message in the chat interface
    with st.chat_message('user'): 
        st.markdown(user_input)

    with st.chat_message("assistant"):

        # Container to show tool activity
        tool_status = st.status("🤔 Thinking...", expanded=True)

        # Placeholder for the streamed response
        response_placeholder = st.empty()

        full_response = ""
        used_tools = set()

        # Stream from your chatbot/graph
        for message_chunk, metadata in chatbot.stream(
            {"messages": [HumanMessage(content=user_input)]},
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
    st.session_state.message_history.append(
        {"role": "assistant", "content": full_response}
    )       
   
