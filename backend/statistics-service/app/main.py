import os
from collections import Counter, defaultdict
from datetime import datetime, timezone

import httpx
import jwt
from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI(title="Mini ToDo Statistics Service", version="1.0.0")

JWT_SECRET = os.getenv("JWT_SECRET", "mini_todo_secret_key_2024")
TODO_SERVICE_URL = os.getenv("TODO_SERVICE_URL", "http://todo-service:3003")
CATEGORY_SERVICE_URL = os.getenv("CATEGORY_SERVICE_URL", "http://category-service:3004")


def require_auth(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant.")

    token = authorization[7:]
    try:
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.") from error

    return authorization


async def fetch_json(url: str, authorization: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers={"Authorization": authorization})
    except httpx.RequestError as error:
        raise HTTPException(status_code=503, detail="Un service requis est indisponible.") from error

    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.")
    if not response.is_success:
        raise HTTPException(status_code=503, detail=f"Service distant: HTTP {response.status_code}")
    return response.json()


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def build_weekly_evolution(todos: list[dict]) -> list[dict]:
    weeks: dict[tuple[int, int], dict[str, int]] = defaultdict(
        lambda: {"created": 0, "completed": 0}
    )

    for todo in todos:
        created_at = parse_date(todo.get("createdAt"))
        if not created_at:
            continue
        iso_year, iso_week, _ = created_at.isocalendar()
        key = (iso_year, iso_week)
        weeks[key]["created"] += 1
        if todo.get("status") == "terminé":
            weeks[key]["completed"] += 1

    result = []
    for (year, week), values in sorted(weeks.items())[-8:]:
        result.append({"week": f"{year}-S{week:02d}", **values})
    return result


@app.get("/health")
async def health():
    return {
        "service": "statistics-service",
        "technology": "Python/FastAPI",
        "status": "OK",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/")
async def statistics(authorization: str = Depends(require_auth)):
    todos = await fetch_json(f"{TODO_SERVICE_URL}/", authorization)

    # Categories improve labels, but statistics remain available if that service fails.
    try:
        categories = await fetch_json(f"{CATEGORY_SERVICE_URL}/", authorization)
    except HTTPException as error:
        if error.status_code == 401:
            raise
        categories = []

    category_names = {
        category.get("_id"): category.get("name", "Catégorie") for category in categories
    }
    by_status = Counter(todo.get("status", "inconnu") for todo in todos)
    by_priority = Counter(todo.get("priority", "inconnue") for todo in todos)
    by_category = Counter(
        category_names.get(todo.get("categoryId"), "Sans catégorie") for todo in todos
    )

    total = len(todos)
    completed = by_status.get("terminé", 0)

    return {
        "totalTasks": total,
        "completedTasks": completed,
        "completionRate": round((completed / total) * 100, 1) if total else 0,
        "byStatus": {
            "à faire": by_status.get("à faire", 0),
            "en cours": by_status.get("en cours", 0),
            "terminé": completed,
        },
        "byPriority": {
            "basse": by_priority.get("basse", 0),
            "moyenne": by_priority.get("moyenne", 0),
            "haute": by_priority.get("haute", 0),
        },
        "byCategory": dict(by_category),
        "weeklyEvolution": build_weekly_evolution(todos),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
