import os
import requests
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

SUPABASE_URL = "https://ncvtrtmkttamhpzcfqwj.supabase.co"
# The public anonymous key serves as the project's API key
SUPABASE_ANON_KEY = os.getenv("DB_PUBLIC_KEY", "")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Validate the incoming JWT against Supabase's Auth API.
    Returns the Supabase user profile dictionary if valid.
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}"
    }
    
    # Query Supabase user info endpoint
    response = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
        
    return response.json()
