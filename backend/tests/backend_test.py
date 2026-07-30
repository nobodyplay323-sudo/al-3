"""Backend API tests for Renaștere recovery platform."""
import os
import uuid
import time
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://recovery-hub-238.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@recovery.ro"
ADMIN_PASSWORD = "admin123"

# Fresh test user
TEST_EMAIL = f"maria+{uuid.uuid4().hex[:8]}@test.ro"
TEST_PASSWORD = "test123"
TEST_NAME = "Maria Test"

state = {}


# ---------------- Auth ----------------
def test_register_new_user():
    r = requests.post(f"{API}/auth/register", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["email"] == TEST_EMAIL
    assert data["user"]["name"] == TEST_NAME
    state["user_token"] = data["token"]
    state["user_id"] = data["user"]["id"]


def test_register_duplicate_email():
    r = requests.post(f"{API}/auth/register", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME
    })
    assert r.status_code == 400


def test_login_admin():
    r = requests.post(f"{API}/auth/login", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"].get("role") == "admin"
    state["admin_token"] = data["token"]


def test_login_bad_password():
    r = requests.post(f"{API}/auth/login", json={
        "email": ADMIN_EMAIL, "password": "wrongpass"
    })
    assert r.status_code == 401


def test_me_endpoint():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {state['user_token']}"})
    assert r.status_code == 200
    assert r.json()["email"] == TEST_EMAIL


def test_me_no_auth():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_update_profile():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    r = requests.put(f"{API}/auth/profile", headers=hdr, json={
        "name": "Maria Updated",
        "sobriety_start": "2025-12-01",
        "daily_cost": 25.5,
        "addiction_types": ["alcool", "nicotina"]
    })
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["name"] == "Maria Updated"
    assert d["daily_cost"] == 25.5
    assert d["sobriety_start"] == "2025-12-01"
    assert "alcool" in d["addiction_types"]


# ---------------- Tracker ----------------
def test_tracker_stats_reflects_profile():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    r = requests.get(f"{API}/tracker/stats", headers=hdr)
    assert r.status_code == 200
    d = r.json()
    assert d["days_sober"] >= 0
    assert d["daily_cost"] == 25.5
    # money saved = days * cost
    assert d["money_saved"] == round(d["days_sober"] * 25.5, 2)
    assert isinstance(d["reached_milestones"], list)


def test_tracker_reset():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    r = requests.post(f"{API}/tracker/reset", headers=hdr)
    assert r.status_code == 200
    # Verify sobriety_start is today
    r2 = requests.get(f"{API}/tracker/stats", headers=hdr)
    assert r2.json()["days_sober"] == 0


# ---------------- Journal ----------------
def test_journal_create_list_delete():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    r = requests.post(f"{API}/journal", headers=hdr, json={
        "mood": 4, "emotions": ["speranță", "calm"], "note": "TEST_ zi bună"
    })
    assert r.status_code == 200, r.text
    entry = r.json()
    assert entry["mood"] == 4
    assert "id" in entry
    entry_id = entry["id"]

    r2 = requests.get(f"{API}/journal", headers=hdr)
    assert r2.status_code == 200
    assert any(e["id"] == entry_id for e in r2.json())

    # upsert same day
    r3 = requests.post(f"{API}/journal", headers=hdr, json={
        "mood": 5, "emotions": ["bucurie"], "note": "TEST_ updated"
    })
    assert r3.status_code == 200
    assert r3.json()["mood"] == 5

    r4 = requests.delete(f"{API}/journal/{entry_id}", headers=hdr)
    assert r4.status_code == 200


# ---------------- Goals ----------------
def test_goals_crud():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    r = requests.post(f"{API}/goals", headers=hdr, json={
        "title": "TEST_ Goal", "description": "desc", "target_days": 30
    })
    assert r.status_code == 200
    goal = r.json()
    gid = goal["id"]
    assert goal["completed"] is False

    r2 = requests.get(f"{API}/goals", headers=hdr)
    assert any(g["id"] == gid for g in r2.json())

    r3 = requests.put(f"{API}/goals/{gid}/toggle", headers=hdr)
    assert r3.status_code == 200
    assert r3.json()["completed"] is True

    r4 = requests.delete(f"{API}/goals/{gid}", headers=hdr)
    assert r4.status_code == 200


# ---------------- Community ----------------
def test_community_post_like_comment_delete():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    r = requests.post(f"{API}/community/posts", headers=hdr, json={
        "content": "TEST_ community post", "anonymous": False
    })
    assert r.status_code == 200, r.text
    post = r.json()
    pid = post["id"]

    # list
    r2 = requests.get(f"{API}/community/posts", headers=hdr)
    assert r2.status_code == 200
    assert any(p["id"] == pid for p in r2.json())

    # like
    r3 = requests.put(f"{API}/community/posts/{pid}/like", headers=hdr)
    assert r3.status_code == 200
    assert r3.json()["liked_by_me"] is True
    assert r3.json()["like_count"] == 1

    # unlike
    r3b = requests.put(f"{API}/community/posts/{pid}/like", headers=hdr)
    assert r3b.json()["liked_by_me"] is False

    # comment
    r4 = requests.post(f"{API}/community/posts/{pid}/comments", headers=hdr, json={"content": "TEST_ comment"})
    assert r4.status_code == 200

    # delete
    r5 = requests.delete(f"{API}/community/posts/{pid}", headers=hdr)
    assert r5.status_code == 200


def test_anonymous_post():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    r = requests.post(f"{API}/community/posts", headers=hdr, json={
        "content": "TEST_ anon", "anonymous": True
    })
    assert r.status_code == 200
    pid = r.json()["id"]
    # Cleanup
    requests.delete(f"{API}/community/posts/{pid}", headers=hdr)
    assert r.json()["author_name"] == "Anonim"


# ---------------- Badges ----------------
def test_badges():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    r = requests.get(f"{API}/badges", headers=hdr)
    assert r.status_code == 200
    d = r.json()
    assert "badges" in d
    assert isinstance(d["badges"], list)
    # Start badge should always be earned (days>=0)
    start = next((b for b in d["badges"] if b.get("key") == "start"), None)
    assert start and start["earned"] is True


# ---------------- Chat (AI streaming) ----------------
def test_chat_stream():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    session_id = f"test-{uuid.uuid4().hex[:8]}"
    r = requests.post(f"{API}/chat/stream", headers=hdr, json={
        "message": "Salut, cum mă poți ajuta?",
        "session_id": session_id
    }, stream=True, timeout=60)
    assert r.status_code == 200, r.text
    content = b""
    for chunk in r.iter_content(chunk_size=64):
        content += chunk
        if len(content) > 20:
            break
    r.close()
    assert len(content) > 0, "No streamed content"
    state["chat_session"] = session_id


def test_chat_history():
    hdr = {"Authorization": f"Bearer {state['user_token']}"}
    # Give backend a moment to save the assistant message
    time.sleep(2)
    r = requests.get(f"{API}/chat/history/{state['chat_session']}", headers=hdr)
    assert r.status_code == 200
    msgs = r.json()
    assert len(msgs) >= 1
    roles = [m["role"] for m in msgs]
    assert "user" in roles
