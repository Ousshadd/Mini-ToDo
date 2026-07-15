import json
import os
from datetime import datetime, timezone

import httpx
import jwt
import redis.asyncio as redis
from redis.exceptions import RedisError
from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI(title="Mini ToDo Notification Service", version="1.0.0")

JWT_SECRET = os.getenv("JWT_SECRET", "mini_todo_secret_key_2024")
TODO_SERVICE_URL = os.getenv("TODO_SERVICE_URL", "http://todo-service:3003")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis-notifications:6379/0")
CACHE_SECONDS = 3600
STATE_SECONDS = 30 * 24 * 3600

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


def require_auth(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant.")

    try:
        payload = jwt.decode(authorization[7:], JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.") from error

    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token invalide.")
    return {"authorization": authorization, "user_id": str(user_id)}


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


async def fetch_todos(authorization: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{TODO_SERVICE_URL}/", headers={"Authorization": authorization}
            )
    except httpx.RequestError as error:
        raise HTTPException(status_code=503, detail="Le service des tâches est indisponible.") from error

    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.")
    if not response.is_success:
        raise HTTPException(status_code=503, detail=f"Todo Service: HTTP {response.status_code}")
    return response.json()


def create_alerts(todos: list[dict], read_ids: set[str], dismissed_ids: set[str]) -> list[dict]:
    now = datetime.now(timezone.utc)
    alerts = []

    for todo in todos:
        todo_id = str(todo.get("_id", ""))
        if not todo_id or todo_id in dismissed_ids or todo.get("status") == "terminé":
            continue

        due_date = parse_date(todo.get("dueDate"))
        if not due_date:
            continue

        remaining_hours = (due_date - now).total_seconds() / 3600
        if remaining_hours < 0:
            alert_type = "overdue"
            message = "La date limite est dépassée."
        elif remaining_hours <= 24:
            alert_type = "due_soon"
            message = "La date limite est dans moins de 24 heures."
        else:
            continue

        alerts.append(
            {
                "id": todo_id,
                "todoId": todo_id,
                "title": todo.get("title", "Tâche"),
                "message": message,
                "type": alert_type,
                "dueDate": due_date.isoformat(),
                "read": todo_id in read_ids,
            }
        )

    return sorted(alerts, key=lambda alert: alert["dueDate"])


async def scan_notifications(auth: dict) -> list[dict]:
    user_id = auth["user_id"]
    read_key = f"notifications:read:{user_id}"
    dismissed_key = f"notifications:dismissed:{user_id}"

    todos = await fetch_todos(auth["authorization"])
    read_ids = await redis_client.smembers(read_key)
    dismissed_ids = await redis_client.smembers(dismissed_key)
    alerts = create_alerts(todos, read_ids, dismissed_ids)

    await redis_client.setex(
        f"notifications:cache:{user_id}", CACHE_SECONDS, json.dumps(alerts)
    )
    return alerts


@app.get("/health")
async def health():
    try:
        redis_ok = bool(await redis_client.ping())
    except RedisError:
        redis_ok = False

    return {
        "service": "notification-service",
        "technology": "Python/FastAPI + Redis",
        "status": "OK" if redis_ok else "DEGRADED",
        "redis": redis_ok,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/")
async def notifications(auth: dict = Depends(require_auth)):
    alerts = await scan_notifications(auth)
    return {
        "notifications": alerts,
        "unreadCount": sum(not alert["read"] for alert in alerts),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


@app.put("/{todo_id}/read")
async def mark_as_read(todo_id: str, auth: dict = Depends(require_auth)):
    key = f"notifications:read:{auth['user_id']}"
    await redis_client.sadd(key, todo_id)
    await redis_client.expire(key, STATE_SECONDS)
    return {"message": "Notification marquée comme lue.", "todoId": todo_id}


@app.delete("/{todo_id}")
async def dismiss(todo_id: str, auth: dict = Depends(require_auth)):
    key = f"notifications:dismissed:{auth['user_id']}"
    await redis_client.sadd(key, todo_id)
    await redis_client.expire(key, STATE_SECONDS)
    return {"message": "Notification supprimée.", "todoId": todo_id}
