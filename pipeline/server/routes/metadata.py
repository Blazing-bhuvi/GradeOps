"""
server/routes/metadata.py — Persistent storage for Courses, Rubrics, and Exams via MongoDB.
"""

from __future__ import annotations
import uuid
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from pipeline.server.db import get_db
from pipeline.server.routes.auth import get_current_user, UserOut, check_role

router = APIRouter(prefix="/metadata", tags=["metadata"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class Course(BaseModel):
    id: str = Field(default_factory=lambda: f"course_{uuid.uuid4().hex[:8]}")
    name: str
    code: str

class RubricMetadata(BaseModel):
    id: str = Field(default_factory=lambda: f"rubric_{uuid.uuid4().hex[:8]}")
    name: str
    questions: int = 0
    total_marks: float = 0
    created_at: str
    course_id: str | None = None

class ExamMetadata(BaseModel):
    id: str
    name: str
    course: str
    courseId: str | None = Field(default=None) # CamelCase to match frontend expectations
    rubric: str | None = None
    uploaded: str
    status: str = "processing"
    students: int = 0
    reviewed: int = 0

class SaveRubricRequest(BaseModel):
    rubric_meta: RubricMetadata
    rubric_json: dict

# ── Routes: Courses ───────────────────────────────────────────────────────────

@router.get("/courses")
async def get_courses():
    db = get_db()
    cursor = db.courses.find({}, {"_id": 0})
    return await cursor.to_list(length=100)

@router.post("/courses")
async def create_course(course: Course, current_user: UserOut = Depends(check_role("instructor"))):
    db = get_db()
    course_dict = course.model_dump()
    await db.courses.insert_one(course_dict)
    return course

@router.delete("/courses/id/{course_id}")
async def delete_course(course_id: str, current_user: UserOut = Depends(check_role("instructor"))):
    db = get_db()
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"status": "deleted"}

# ── Routes: Rubrics ───────────────────────────────────────────────────────────

@router.get("/rubrics")
async def get_rubrics():
    db = get_db()
    # Only return the metadata part
    cursor = db.rubrics.find({}, {"_id": 0, "rubric_json": 0})
    return await cursor.to_list(length=100)

@router.post("/rubrics")
async def save_rubric(req: SaveRubricRequest, current_user: UserOut = Depends(check_role("instructor"))):
    db = get_db()
    rubric_meta = req.rubric_meta.model_dump()
    rubric_json = req.rubric_json
    
    # Store both in the same document
    rubric_doc = {
        **rubric_meta,
        "rubric_json": rubric_json
    }
    
    # Update if exists, else insert
    await db.rubrics.update_one(
        {"id": rubric_meta["id"]},
        {"$set": rubric_doc},
        upsert=True
    )
    
    return req.rubric_meta

@router.get("/rubrics/{rubric_id}")
async def get_rubric(rubric_id: str):
    db = get_db()
    rubric = await db.rubrics.find_one({"id": rubric_id}, {"_id": 0})
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    return rubric["rubric_json"]

@router.delete("/rubrics/{rubric_id}")
async def delete_rubric(rubric_id: str, current_user: UserOut = Depends(check_role("instructor"))):
    db = get_db()
    result = await db.rubrics.delete_one({"id": rubric_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rubric not found")
    return {"status": "deleted"}

# ── Routes: Exams ─────────────────────────────────────────────────────────────

@router.get("/exams")
async def get_exams():
    db = get_db()
    cursor = db.exams.find({}, {"_id": 0}).sort("uploaded", -1)
    exams = await cursor.to_list(length=100)
    
    async def populate_exam(exam):
        eid = exam.get("id")
        if not eid: return exam
        
        # If the exam is graded, ensure we have the latest counts from submissions
        if exam.get("status") in ["graded", "complete"]:
            total = await db.submissions.count_documents({"exam_id": eid})
            if total > 0:
                exam["students"] = total
                exam["reviewed"] = total
            elif "stats" in exam and exam["stats"].get("total_students"):
                exam["students"] = exam["stats"]["total_students"]
                exam["reviewed"] = exam["stats"]["total_students"]
        return exam

    # Parallelize counting tasks
    populated_exams = await asyncio.gather(*(populate_exam(e) for e in exams))
    return populated_exams

@router.post("/exams")
async def register_exam(exam: ExamMetadata, current_user: UserOut = Depends(check_role("instructor"))):
    db = get_db()
    exam_dict = exam.model_dump()
    
    await db.exams.update_one(
        {"id": exam.id},
        {"$set": exam_dict},
        upsert=True
    )
    return exam

@router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str, current_user: UserOut = Depends(check_role("instructor"))):
    db = get_db()
    result = await db.exams.delete_one({"id": exam_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"status": "deleted"}
