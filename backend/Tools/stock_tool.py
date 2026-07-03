
from langchain.tools import tool
import requests
import os
from dotenv import load_dotenv



class StockTool:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("ALPHAVANTAGE_API_KEY")
        self.tool_list = self._setup_tools()
    def _setup_tools(self):
        """Set up stock tools"""
        @tool
        def get_stock_price(symbol: str) -> dict:
            """
            Fetch latest stock price for a given symbol (e.g. 'AAPL', 'TSLA') 
            using Alpha Vantage with API key in the URL.
            """
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={self.api_key}"
            r = requests.get(url)
            return r.json()

        # Return the list of tools
        return [get_stock_price]