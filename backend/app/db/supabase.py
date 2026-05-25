import os
from supabase import create_client, Client
from app.core.logging import get_logger

logger = get_logger()

# Global Supabase client instance
_supabase: Client | None = None
from app.core.config import settings

def get_supabase() -> Client:
    """
    Initializes and returns the Supabase client.
    Uses SUPABASE_URL and SUPABASE_SERVICE_KEY from the environment.
    """
    global _supabase
    if _supabase is not None:
        return _supabase
        
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_SERVICE_KEY
    
    if not url or not key:
        logger.warning("SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. Supabase integration is disabled or will fail.")
        # We don't raise an exception here so that the app can still start if someone doesn't have supabase config yet.
        # However, saving will fail later if these are missing.
        # A more robust approach might be to raise an error if integration is strictly required.
        
    try:
        _supabase = create_client(url, key)
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        raise
        
    return _supabase
