from fastapi import Depends
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.cache import get_redis


def get_db_session():
    yield from get_db()


def get_cache():
    return get_redis()
