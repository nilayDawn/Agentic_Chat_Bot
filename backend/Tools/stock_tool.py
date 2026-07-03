
from langchain.tools import tool
import requests
import os
from dotenv import load_dotenv
from langgraph.types import interrupt, Command


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

        @tool
        def purchase_stock(symbol: str, quantity: int) -> dict:
            """
            Simulate purchasing a given quantity of a stock symbol.

            HUMAN-IN-THE-LOOP:
            Before confirming the purchase, this tool will interrupt
            and wait for a human decision ("yes" / anything else).
            """
            decision = interrupt(f"Approve buying {quantity} shares of {symbol}? (yes/no)")

            if isinstance(decision, str) and decision.lower() == "yes":
                return {
                    "status": "success",
                    "message": f"Purchase order placed for {quantity} shares of {symbol}.",
                    "symbol": symbol,
                    "quantity": quantity,
                }
            
            else:
                return {
                    "status": "cancelled",
                    "message": f"Purchase of {quantity} shares of {symbol} was declined by human.",
                    "symbol": symbol,
                    "quantity": quantity,
                }




        # Return the list of tools
        return [get_stock_price, purchase_stock]