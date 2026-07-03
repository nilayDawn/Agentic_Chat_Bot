import uuid
import streamlit as st

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
