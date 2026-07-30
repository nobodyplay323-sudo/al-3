from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict, BeforeValidator
from typing import List, Optional, Annotated, Any
from datetime import datetime, timezone, timedelta, date
from bson import ObjectId
import logging
import bcrypt
import jwt
import uuid

# ------------------------------------------------------------------
# DB + App setup
# ------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="Renaștere - Recovery Platform API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
PyObjectId = Annotated[str, BeforeValidator(str)]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now_utc() + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Nu ești autentificat")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utilizator inexistent")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesiune expirată")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalid")


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "sobriety_start": user.get("sobriety_start"),
        "addiction_types": user.get("addiction_types", []),
        "daily_cost": user.get("daily_cost", 0),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at"),
    }


# ------------------------------------------------------------------
# Models
# ------------------------------------------------------------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    sobriety_start: Optional[str] = None  # ISO date
    addiction_types: Optional[List[str]] = None
    daily_cost: Optional[float] = None


class JournalInput(BaseModel):
    mood: int = Field(ge=1, le=5)
    emotions: List[str] = []
    note: str = ""
    entry_date: Optional[str] = None  # ISO date, defaults today


class GoalInput(BaseModel):
    title: str
    description: str = ""
    target_days: Optional[int] = None


class PostInput(BaseModel):
    content: str = Field(min_length=1)
    anonymous: bool = False


class CommentInput(BaseModel):
    content: str = Field(min_length=1)


class ChatInput(BaseModel):
    message: str
    session_id: Optional[str] = None


# ------------------------------------------------------------------
# Auth endpoints
# ------------------------------------------------------------------
@api_router.post("/auth/register")
async def register(data: RegisterInput):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Acest email este deja înregistrat")
    doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": "user",
        "sobriety_start": now_utc().date().isoformat(),
        "addiction_types": [],
        "daily_cost": 0,
        "created_at": now_utc().isoformat(),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    token = create_access_token(uid, email)
    doc["id"] = uid
    return {"token": token, "user": public_user(doc)}


@api_router.post("/auth/login")
async def login(data: LoginInput):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    uid = str(user["_id"])
    user["id"] = uid
    token = create_access_token(uid, email)
    return {"token": token, "user": public_user(user)}


@api_router.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return public_user(current)


@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdate, current=Depends(get_current_user)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"_id": ObjectId(current["id"])}, {"$set": update})
    user = await db.users.find_one({"_id": ObjectId(current["id"])})
    user["id"] = str(user["_id"])
    return public_user(user)


# ------------------------------------------------------------------
# Tracker / Stats
# ------------------------------------------------------------------
MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365, 730]


def days_sober(sobriety_start: Optional[str]) -> int:
    if not sobriety_start:
        return 0
    try:
        start = date.fromisoformat(sobriety_start[:10])
    except Exception:
        return 0
    return max(0, (now_utc().date() - start).days)


@api_router.get("/tracker/stats")
async def tracker_stats(current=Depends(get_current_user)):
    d = days_sober(current.get("sobriety_start"))
    daily_cost = current.get("daily_cost", 0) or 0
    money_saved = round(d * daily_cost, 2)
    next_milestone = next((m for m in MILESTONES if m > d), None)
    reached = [m for m in MILESTONES if m <= d]
    return {
        "days_sober": d,
        "sobriety_start": current.get("sobriety_start"),
        "money_saved": money_saved,
        "daily_cost": daily_cost,
        "next_milestone": next_milestone,
        "reached_milestones": reached,
        "all_milestones": MILESTONES,
    }


@api_router.post("/tracker/reset")
async def tracker_reset(current=Depends(get_current_user)):
    today = now_utc().date().isoformat()
    await db.users.update_one({"_id": ObjectId(current["id"])}, {"$set": {"sobriety_start": today}})
    return {"sobriety_start": today}


# ------------------------------------------------------------------
# Journal
# ------------------------------------------------------------------
@api_router.post("/journal")
async def create_journal(data: JournalInput, current=Depends(get_current_user)):
    entry_date = data.entry_date or now_utc().date().isoformat()
    doc = {
        "user_id": current["id"],
        "mood": data.mood,
        "emotions": data.emotions,
        "note": data.note,
        "entry_date": entry_date[:10],
        "created_at": now_utc().isoformat(),
    }
    # upsert by day
    await db.journal.update_one(
        {"user_id": current["id"], "entry_date": entry_date[:10]},
        {"$set": doc},
        upsert=True,
    )
    saved = await db.journal.find_one({"user_id": current["id"], "entry_date": entry_date[:10]})
    saved["id"] = str(saved["_id"])
    saved.pop("_id", None)
    return saved


@api_router.get("/journal")
async def list_journal(current=Depends(get_current_user)):
    entries = await db.journal.find({"user_id": current["id"]}).sort("entry_date", -1).to_list(500)
    for e in entries:
        e["id"] = str(e["_id"])
        e.pop("_id", None)
    return entries


@api_router.delete("/journal/{entry_id}")
async def delete_journal(entry_id: str, current=Depends(get_current_user)):
    await db.journal.delete_one({"_id": ObjectId(entry_id), "user_id": current["id"]})
    return {"ok": True}


# ------------------------------------------------------------------
# Goals & Badges
# ------------------------------------------------------------------
@api_router.post("/goals")
async def create_goal(data: GoalInput, current=Depends(get_current_user)):
    doc = {
        "user_id": current["id"],
        "title": data.title,
        "description": data.description,
        "target_days": data.target_days,
        "completed": False,
        "created_at": now_utc().isoformat(),
    }
    res = await db.goals.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@api_router.get("/goals")
async def list_goals(current=Depends(get_current_user)):
    goals = await db.goals.find({"user_id": current["id"]}).sort("created_at", -1).to_list(200)
    for g in goals:
        g["id"] = str(g["_id"])
        g.pop("_id", None)
    return goals


@api_router.put("/goals/{goal_id}/toggle")
async def toggle_goal(goal_id: str, current=Depends(get_current_user)):
    goal = await db.goals.find_one({"_id": ObjectId(goal_id), "user_id": current["id"]})
    if not goal:
        raise HTTPException(status_code=404, detail="Obiectiv inexistent")
    new_val = not goal.get("completed", False)
    await db.goals.update_one({"_id": ObjectId(goal_id)}, {"$set": {"completed": new_val}})
    goal["completed"] = new_val
    goal["id"] = str(goal["_id"])
    goal.pop("_id", None)
    return goal


@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current=Depends(get_current_user)):
    await db.goals.delete_one({"_id": ObjectId(goal_id), "user_id": current["id"]})
    return {"ok": True}


BADGE_DEFS = [
    {"key": "start", "days": 0, "title": "Primul Pas", "desc": "Ai început călătoria"},
    {"key": "day1", "days": 1, "title": "O Zi", "desc": "24 de ore de curaj"},
    {"key": "week", "days": 7, "title": "O Săptămână", "desc": "7 zile de forță"},
    {"key": "month", "days": 30, "title": "O Lună", "desc": "30 de zile de libertate"},
    {"key": "quarter", "days": 90, "title": "Trei Luni", "desc": "90 de zile de transformare"},
    {"key": "halfyear", "days": 180, "title": "Jumătate de An", "desc": "180 de zile de renaștere"},
    {"key": "year", "days": 365, "title": "Un An", "desc": "365 de zile de victorie"},
]


@api_router.get("/badges")
async def get_badges(current=Depends(get_current_user)):
    d = days_sober(current.get("sobriety_start"))
    goals = await db.goals.count_documents({"user_id": current["id"], "completed": True})
    journal_count = await db.journal.count_documents({"user_id": current["id"]})
    badges = []
    for b in BADGE_DEFS:
        badges.append({**b, "earned": d >= b["days"]})
    # extra badges
    badges.append({"key": "journaler", "title": "Cronicar", "desc": "10 intrări în jurnal", "earned": journal_count >= 10})
    badges.append({"key": "achiever", "title": "Realizator", "desc": "5 obiective atinse", "earned": goals >= 5})
    return {"badges": badges, "days_sober": d}


# ------------------------------------------------------------------
# Community
# ------------------------------------------------------------------
@api_router.get("/community/posts")
async def list_posts(current=Depends(get_current_user)):
    posts = await db.posts.find({}).sort("created_at", -1).to_list(200)
    result = []
    for p in posts:
        pid = str(p["_id"])
        comments = await db.comments.find({"post_id": pid}).sort("created_at", 1).to_list(200)
        for c in comments:
            c["id"] = str(c["_id"])
            c.pop("_id", None)
        result.append({
            "id": pid,
            "author_name": p.get("author_name", "Anonim"),
            "content": p["content"],
            "likes": p.get("likes", []),
            "liked_by_me": current["id"] in p.get("likes", []),
            "like_count": len(p.get("likes", [])),
            "is_mine": p.get("user_id") == current["id"],
            "created_at": p.get("created_at"),
            "comments": comments,
        })
    return result


@api_router.post("/community/posts")
async def create_post(data: PostInput, current=Depends(get_current_user)):
    doc = {
        "user_id": current["id"],
        "author_name": "Anonim" if data.anonymous else current.get("name", "Anonim"),
        "content": data.content,
        "likes": [],
        "created_at": now_utc().isoformat(),
    }
    res = await db.posts.insert_one(doc)
    doc.pop("_id", None)
    return {"id": str(res.inserted_id), **doc, "comments": [], "like_count": 0, "liked_by_me": False, "is_mine": True}


@api_router.put("/community/posts/{post_id}/like")
async def like_post(post_id: str, current=Depends(get_current_user)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Postare inexistentă")
    likes = post.get("likes", [])
    if current["id"] in likes:
        likes.remove(current["id"])
    else:
        likes.append(current["id"])
    await db.posts.update_one({"_id": ObjectId(post_id)}, {"$set": {"likes": likes}})
    return {"like_count": len(likes), "liked_by_me": current["id"] in likes}


@api_router.post("/community/posts/{post_id}/comments")
async def add_comment(post_id: str, data: CommentInput, current=Depends(get_current_user)):
    doc = {
        "post_id": post_id,
        "user_id": current["id"],
        "author_name": current.get("name", "Anonim"),
        "content": data.content,
        "created_at": now_utc().isoformat(),
    }
    res = await db.comments.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@api_router.delete("/community/posts/{post_id}")
async def delete_post(post_id: str, current=Depends(get_current_user)):
    await db.posts.delete_one({"_id": ObjectId(post_id), "user_id": current["id"]})
    await db.comments.delete_many({"post_id": post_id})
    return {"ok": True}


# ------------------------------------------------------------------
# AI Chat (Claude Sonnet 4.5, streaming)
# ------------------------------------------------------------------
SYSTEM_PROMPT = (
    "Ești 'Speranță', un asistent AI empatic și cald, specializat în sprijinirea persoanelor "
    "care se luptă cu dependențe (alcool, droguri, jocuri de noroc, nicotină și altele). "
    "Răspunzi ÎNTOTDEAUNA în limba română, cu compasiune, fără să judeci. "
    "Oferi încurajare, tehnici de gestionare a poftelor, strategii de prevenire a recăderilor și motivație. "
    "Nu ești medic; pentru situații de criză (gânduri suicidare, sevraj sever) încurajezi persoana să sune "
    "imediat la 112 sau la linia de urgență. Răspunsurile sunt concise, calde și practice."
)


async def chat_stream_generator(message: str, session_id: str, user_id: str):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

    # load prior history into system context is handled by session; but library
    # keeps history only in-memory. We reconstruct by re-sending recent history.
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    # replay previous messages so context is preserved across requests
    prior = await db.chat_messages.find(
        {"session_id": session_id, "user_id": user_id}
    ).sort("created_at", 1).to_list(50)

    full_history = "".join(
        [f"\n[{m['role']}]: {m['content']}" for m in prior]
    )
    prompt_text = message
    if full_history:
        prompt_text = (
            "Context conversație anterioară:" + full_history +
            "\n\n[Mesaj nou al utilizatorului]: " + message
        )

    # save user message
    await db.chat_messages.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "role": "user",
        "content": message,
        "created_at": now_utc().isoformat(),
    })

    assistant_text = ""
    try:
        async for event in chat.stream_message(UserMessage(text=prompt_text)):
            if isinstance(event, TextDelta):
                assistant_text += event.content
                yield event.content
            elif isinstance(event, StreamDone):
                break
    except Exception as e:
        logger.error(f"Chat error: {e}")
        if not assistant_text:
            yield "Îmi pare rău, a apărut o problemă. Te rog încearcă din nou."

    # save assistant message
    if assistant_text:
        await db.chat_messages.insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "role": "assistant",
            "content": assistant_text,
            "created_at": now_utc().isoformat(),
        })


@api_router.post("/chat/stream")
async def chat_stream(data: ChatInput, current=Depends(get_current_user)):
    session_id = data.session_id or f"{current['id']}-{uuid.uuid4().hex[:8]}"
    return StreamingResponse(
        chat_stream_generator(data.message, session_id, current["id"]),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "X-Session-Id": session_id},
    )


@api_router.get("/chat/sessions")
async def chat_sessions(current=Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": current["id"]}},
        {"$sort": {"created_at": 1}},
        {"$group": {
            "_id": "$session_id",
            "last": {"$last": "$content"},
            "updated": {"$last": "$created_at"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"updated": -1}},
    ]
    sessions = await db.chat_messages.aggregate(pipeline).to_list(100)
    return [{"session_id": s["_id"], "preview": s["last"][:60], "updated": s["updated"], "count": s["count"]} for s in sessions]


@api_router.get("/chat/history/{session_id}")
async def chat_history(session_id: str, current=Depends(get_current_user)):
    msgs = await db.chat_messages.find(
        {"session_id": session_id, "user_id": current["id"]}
    ).sort("created_at", 1).to_list(500)
    for m in msgs:
        m["id"] = str(m["_id"])
        m.pop("_id", None)
    return msgs


@api_router.get("/")
async def root():
    return {"message": "Renaștere API"}


# ------------------------------------------------------------------
# Startup
# ------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.journal.create_index([("user_id", 1), ("entry_date", 1)])
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@recovery.ro")
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_pw),
            "name": "Admin",
            "role": "admin",
            "sobriety_start": (now_utc().date() - timedelta(days=45)).isoformat(),
            "addiction_types": ["alcool"],
            "daily_cost": 30,
            "created_at": now_utc().isoformat(),
        })
        logger.info("Admin user seeded")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
