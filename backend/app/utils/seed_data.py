"""
Optional helper to pre-populate the database with a couple of realistic
complaints, useful for demonstrating the Duplicate Complaint Detection
bonus feature (submit sample-data/sample_complaint_3.txt after seeding —
it's a near-duplicate of the seeded batch AMOX-B2201 complaint).

Run with:  python -m app.utils.seed_data
"""
from datetime import date

from app.database import SessionLocal, init_db
from app import models


def seed():
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(models.Complaint).count()
        if existing > 0:
            print(f"Database already has {existing} complaints. Skipping seed.")
            return

        c1 = models.Complaint(
            complaint_source="Email",
            customer_name="MedPharm Distributors Pvt. Ltd.",
            product_name="Amoxicillin Trihydrate API",
            product_strength_grade="Pharma Grade, 98.5% purity",
            batch_lot_number="AMOX-B2201",
            manufacturing_date=date(2026, 2, 10),
            expiry_date=date(2028, 2, 9),
            quantity_affected="120 kg",
            complaint_type="Product Quality Defect",
            complaint_date=date(2026, 6, 15),
            detailed_description=(
                "Customer reported off-white discoloration and clumping in three drums "
                "from batch AMOX-B2201, inconsistent with the certificate of analysis."
            ),
            initial_severity=models.SeverityEnum.high,
            priority=models.PriorityEnum.high,
            status=models.StatusEnum.under_investigation,
            completeness_score=100,
            missing_fields=[],
            ai_summary="Discoloration and clumping observed in 3 of 40 drums from batch AMOX-B2201; "
                        "under investigation for raw material or storage-related root cause.",
            risk_classification="Major",
            risk_justification="Physical appearance deviation could indicate degradation; no confirmed "
                                "potency loss yet, but batch-wide impact is possible.",
            root_cause_recommendation="Most likely raw material lot variance or a humidity excursion "
                                       "during warehousing; check environmental monitoring logs for the "
                                       "storage period and compare against the raw material COA.",
            capa_recommendation="- Quarantine remaining drums from batch AMOX-B2201\n"
                                 "- Re-test retained samples for purity and moisture content\n"
                                 "- Review warehouse humidity logs for the storage period\n"
                                 "- Preventive: add humidity excursion alerts to the WMS",
        )
        db.add(c1)
        db.commit()
        print("Seeded 1 sample complaint (batch AMOX-B2201).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
