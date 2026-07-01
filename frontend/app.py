import sys
from pathlib import Path
# Force the project root directory into Python's search path
sys.path.append(str(Path(__file__).resolve().parent.parent))

#-------PACKAGE IMPORTS-------

from backend.chatbot import chatbot
from langchain_core.messages import HumanMessage
import streamlit as st

# thread_id  = "1"
# config = {'configurable' : {
#     'thread_id' : thread_id
# }}


st.title("Agentic Chat Bot")

#create session
if 'message_history' not in st.session_state:
    st.session_state['message_history'] = []
#loading the conversation history from the session state
for message in st.session_state['message_history']:
    with st.chat_message(message["role"]):
        st.text(message["content"])



user_input = st.chat_input("Type your message here...")

if user_input:
    #add message to session state
    st.session_state['message_history'].append({"role": "user", "content": user_input})

    with st.chat_message('user'): 
        st.text(user_input)


    with st.chat_message('assistant'):
        #for streaming response from the chatbot
        ai_message = st.write_stream(
            message_chunk.content for message_chunk,metadata in chatbot.stream(
                {'messages': [HumanMessage(content=user_input)]},
                config = {'configurable':{'thread_id': 'thread-1'}},
                stream_mode = 'messages'
            )
        )
    #store ai message to session state
    st.session_state['message_history'].append({"role": "assistant", "content": ai_message})
