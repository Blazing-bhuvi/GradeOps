#!/usr/bin/env python3
"""
examples/split_sample_exam.py — Split the combined sample PDF into per-student PDFs.

Reads pages_per_student from examples/rubric.json and writes PDFs to
examples/students/ using the default sample IDs (S001, S002).
"""

from __future__ import annotations

from pathlib import Path
import json

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"
RUBRIC_PATH = EXAMPLES / "rubric.json"
PDF_PATH = EXAMPLES / "sample_exam.pdf"
OUT_DIR = EXAMPLES / "students"

DEFAULT_STUDENT_IDS = ["S001", "S002"]


def load_pages_per_student(rubric_path: Path) -> int:
    data = json.loads(rubric_path.read_text())
    pps = data.get("pages_per_student")
    if not isinstance(pps, int) or pps <= 0:
        raise ValueError("pages_per_student must be a positive integer")
    return pps


def split_pdf(pdf_path: Path, pages_per_student: int, student_ids: list[str]) -> None:
    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    if total_pages % pages_per_student != 0:
        doc.close()
        raise ValueError(
            f"PDF has {total_pages} pages, not divisible by pages_per_student={pages_per_student}"
        )

    expected = total_pages // pages_per_student
    if len(student_ids) != expected:
        doc.close()
        raise ValueError(
            f"Expected {expected} student IDs, got {len(student_ids)}."
        )

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for i, sid in enumerate(student_ids):
        start = i * pages_per_student
        end = start + pages_per_student
        out_path = OUT_DIR / f"{sid}.pdf"

        new_doc = fitz.open()
        new_doc.insert_pdf(doc, from_page=start, to_page=end - 1)
        new_doc.save(out_path)
        new_doc.close()

    doc.close()


def main() -> None:
    pages_per_student = load_pages_per_student(RUBRIC_PATH)
    split_pdf(PDF_PATH, pages_per_student, DEFAULT_STUDENT_IDS)
    print(f"Wrote {len(DEFAULT_STUDENT_IDS)} PDFs to {OUT_DIR}")


if __name__ == "__main__":
    main()
