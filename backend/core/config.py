from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    IG_ACCESS_TOKEN: str = os.getenv("IG_ACCESS_TOKEN", "")
    IG_USER_ID: str = os.getenv("IG_USER_ID", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

settings = Settings()
