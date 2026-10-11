import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB", "nyayalens")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is missing from .env")

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)

db = client[MONGODB_DB]
judgments = db["judgments"]
analyses = db["analyses"]

def check_database():
    client.admin.command("ping")
    return True