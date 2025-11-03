import os
from typing import Optional

class Settings:
    PROJECT_NAME: str = "Restaurant Analytics API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://challenge:challenge_2024@localhost:5432/challenge_db"
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["*"]

settings = Settings()