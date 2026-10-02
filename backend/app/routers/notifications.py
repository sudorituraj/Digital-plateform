"""Patient inbox (in-app messages) and the staff view of simulated WhatsApp/SMS messages."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query

from ..db import get_db
from ..notifications import TYPES, run_due_reminders
from ..schemas import InboxOut, NotificationOut, OutboxItemOut
from ..security import current_patient, require_role

router = APIRouter(tags=["notifications"])


def out(doc: dict, cls=NotificationOut):
    extra = {"patient_name": doc.get("patient_name"), "phone": doc["phone"]} if cls is OutboxItemOut else {}
    return cls(
        id=str(doc["_id"]),
        type=doc["type"],
        request_id=doc.get("request_id"),
        params={k: str(v) for k, v in doc.get("params", {}).items()},
        channel=doc.get("channel", "whatsapp"),
        delivery=doc.get("delivery", "simulated"),
        created_at=doc["created_at"],
        read=doc.get("read_at") is not None,
        **extra,
    )


@router.get("/notifications", response_model=InboxOut)
async def inbox(patient: dict = Depends(current_patient)):
    db = get_db()
    await run_due_reminders(db)
    docs = await db.notifications.find({"patient_id": patient["_id"]}).sort("created_at", -1).to_list(50)
    unread = await db.notifications.count_documents({"patient_id": patient["_id"], "read_at": None})
    return InboxOut(items=[out(d) for d in docs], unread=unread)


@router.get("/notifications/unread", response_model=InboxOut)
async def unread_count(patient: dict = Depends(current_patient)):
    """Cheap check for the header bell."""
    db = get_db()
    await run_due_reminders(db)
    return InboxOut(items=[], unread=await db.notifications.count_documents({"patient_id": patient["_id"], "read_at": None}))


@router.post("/notifications/read", status_code=204)
async def mark_all_read(patient: dict = Depends(current_patient)):
    await get_db().notifications.update_many(
        {"patient_id": patient["_id"], "read_at": None}, {"$set": {"read_at": datetime.now(UTC)}}
    )


@router.get("/staff/messages", response_model=list[OutboxItemOut])
async def outbox(
    type: str | None = Query(None, max_length=20),
    staff: dict = Depends(require_role("reception")),
):
    """Every message the system would have sent by WhatsApp/SMS (simulated in the demo)."""
    db = get_db()
    await run_due_reminders(db)
    query = {"type": type} if type in TYPES else {}
    docs = await db.notifications.find(query).sort("created_at", -1).to_list(200)
    return [out(d, OutboxItemOut) for d in docs]
