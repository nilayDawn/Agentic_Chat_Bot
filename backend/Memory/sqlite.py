from langgraph.checkpoint.sqlite import SqliteSaver
import os
import sqlite3

class DataBase:
    def __init__(self, db_path='database/chatbot_state.db'):
            self.db_path = db_path
            
            # Check if directory exists
            if not os.path.exists('database'):
                os.mkdir('database')
            
            # Check if the file exists
            db_exists = os.path.exists(self.db_path)
            
            # Connect
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.checkpoint = SqliteSaver(self.conn)
            
            if not db_exists:
                print(f"New database created at {self.db_path}")

    def get_all_thread_ids(self):
        all_threads = set()
        for ckpt in self.checkpoint.list(None):
            all_threads.add(ckpt.config['configurable']['thread_id'])
        return list(all_threads)

