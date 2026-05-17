"""
server/db.py — Async MongoDB client using Motor.
"""

import motor.motor_asyncio
from pymongo import MongoClient
from pipeline.config import settings

class Database:
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    sync_client: MongoClient = None
    db = None

db = Database()

def get_db():
    if db.client is None:
        db.client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongo_uri)
        db.db = db.client[settings.db_name]
    return db.db

def get_sync_client():
    if db.sync_client is None:
        db.sync_client = MongoClient(settings.mongo_uri)
    return db.sync_client

async def create_indexes():
    """Ensure database indexes exist for performance and uniqueness."""
    database = get_db()
    # Users: Unique email
    await database.users.create_index("email", unique=True)
    # Exams: Fast lookup by ID
    await database.exams.create_index("id", unique=True)
    # Submissions: Fast lookup by exam_id
    await database.submissions.create_index("exam_id")
    # Rubrics: Fast lookup by ID
    await database.rubrics.create_index("id", unique=True)
    print("[db] Database indexes verified/created.")

async def close_db_connection():
    if db.client:
        db.client.close()
    if db.sync_client:
        db.sync_client.close()
