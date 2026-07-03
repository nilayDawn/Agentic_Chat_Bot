from langchain.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_google_genai import ChatGoogleGenerativeAI

from dotenv import load_dotenv
load_dotenv()

#import tools
from ..Tools.calculator_tool import calculator
from ..Tools.weather_tool import WeatherTool
from ..Tools.stock_tool import StockTool
from ..Tools.search_tool import search_tool
from ..Tools.rag_tool import rag_tool
from ..prompts.prompt import SYSTEM_PROMPT

#import required classes
from ..GraphStates.ChatState import ChatState
from ..Memory.sqlite import DataBase

class AIAgent:
    def __init__(self):
        self.calculator = calculator
        self.weather_tool = WeatherTool()
        self.stock_tool = StockTool()
        self.search_tool = search_tool
        self.rag_tool = rag_tool

        # LLM 
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7
        )

        self.tools = []
        self.tools.extend([
            self.calculator,
            *self.weather_tool.tool_list,
            *self.stock_tool.tool_list,
            self.search_tool,
            self.rag_tool
        ])

        self.tool_node = ToolNode(self.tools)
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.checkpoint = DataBase().checkpoint
        self.chatbot = None
        self.system_message = SYSTEM_PROMPT
     
    def build_graph(self):
        def chat_node(state: ChatState):
            #take user query form state
            # `state["messages"]` is already a list of BaseMessage (LangChain message objects).
            # LangChain expects a *flat* list of messages, not a nested list.
            messaages = [
                self.system_message,
                *state["messages"],
            ]

            #send to llm and get response
            response = self.llm_with_tools.invoke(messaages)

            #response store state
            return {"messages": [response]}
    
        graph = StateGraph(ChatState)

        #nodes
        graph.add_node('chat_node',chat_node)
        graph.add_node('tools',self.tool_node)

        #edges
        graph.add_edge(START,'chat_node')
        graph.add_conditional_edges('chat_node',tools_condition)
        graph.add_edge('tools','chat_node')

        self.chatbot =  graph.compile(checkpointer=self.checkpoint)

        return self.chatbot

    def __call__(self):
        if self.chatbot is None:
            self.chatbot = self.build_graph()
        return self.chatbot



if __name__ == "__main__":
    config = {
        "configurable": {
            "thread_id": "test_thread"
        }
    }

    agent = AIAgent()

    chatbot = agent.build_graph()

    print("Chatbot built successfully.")

    print(chatbot)

    print("Invoking chatbot with a test message...")
    response = chatbot.invoke({"messages": [HumanMessage(content="Hello, how are you?")]},config=config)
    print(f"AI MESSAGE: {response["messages"][-1].content}")