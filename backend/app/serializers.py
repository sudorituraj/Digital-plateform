"""Convert MongoDB documents to API responses (never leak internal fields like _id or hashes)."""

from .schemas import AppointmentOut, PatientOut


def patient_out(doc: dict) -> PatientOut:
    return PatientOut(**{k: doc.get(k) for k in PatientOut.model_fields})


def appointment_out(doc: dict) -> AppointmentOut:
    return AppointmentOut(
        request_id=doc["request_id"],
        patient_name=doc["patient_name"],
        doctor=doc["doctor"],
        date=doc["date"],
        time_slot=doc["time_slot"],
        reason=doc.get("reason"),
        status=doc["status"],
        token=doc.get("token"),
        created_at=doc["created_at"],
        payment=doc.get("payment"),
    )
