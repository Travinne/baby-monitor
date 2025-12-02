from app import app
from database import db
from models import Allergy, Bath, Checkup, Diaper

with app.app_context():
    db.drop_all()
    db.create_all()

    allergy1 = Allergy(name="Peanuts", severity="High", reaction="Swelling", notes="Avoid all peanut products")
    bath1 = Bath(notes="Morning bath with baby shampoo", time="08:00 AM")
    checkup1 = Checkup(doctor_name="Dr. Smith", reason="Routine checkup", date="2025-10-23")
    diaper1 = Diaper(mess_type="Wet", notes="Normal", time="10:00 AM")

    db.session.add_all([allergy1, bath1, checkup1, diaper1])
    db.session.commit()

    print("Database seeded successfully ")
