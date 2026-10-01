"""The logged-in patient's own profile."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from ..db import get_db
from ..schemas import PatientOut, ProfileIn
from ..security import current_patient
from ..serializers import patient_out

router = APIRouter(prefix="/me", tags=["patient"])


@router.get("", response_model=PatientOut)
async def get_me(patient: dict = Depends(current_patient)):
    return patient_out(patient)


@router.put("", response_model=PatientOut)
async def update_me(body: ProfileIn, patient: dict = Depends(current_patient)):
    changes = {**body.model_dump(), "updated_at": datetime.now(UTC)}
    await get_db().patients.update_one({"_id": patient["_id"]}, {"$set": changes})
    return patient_out({**patient, **changes})
