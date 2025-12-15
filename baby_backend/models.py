from .database import db
from datetime import datetime
from enum import Enum


class SeverityEnum(Enum):
    MILD = "Mild"
    MODERATE = "Moderate"
    SEVERE = "Severe"

class GenderEnum(Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class FeedTypeEnum(Enum):
    BREAST = "Breast"
    FORMULA = "Formula"
    SOLID = "Solid"

class DiaperTypeEnum(Enum):
    WET = "Wet"
    DIRTY = "Dirty"
    MIXED = "Mixed"

class NotificationTypeEnum(Enum):
    GENERAL = "General"
    REMINDER = "Reminder"
    ALERT = "Alert"


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    
    settings = db.relationship(
        'UserSettings', backref='user', uselist=False, cascade="all, delete-orphan"
    )
    profiles = db.relationship(
        'BabyProfile', backref='parent', lazy=True, cascade="all, delete-orphan"
    )
    notifications = db.relationship(
        'Notification', backref='user', lazy=True, cascade="all, delete-orphan"
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    full_name = db.Column(db.String(100))
    theme = db.Column(db.String(20), default='light')
    notifications_enabled = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BabyProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.Date)
    age_in_months = db.Column(db.Integer)
    gender = db.Column(db.Enum(GenderEnum))
    notes = db.Column(db.Text)
    photo_url = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Allergy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.Enum(SeverityEnum), nullable=False)
    reaction = db.Column(db.String(150))
    notes = db.Column(db.Text)
    diagnosed_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Bath(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    notes = db.Column(db.Text)
    time = db.Column(db.DateTime, default=datetime.utcnow)


class Checkup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    doctor_name = db.Column(db.String(100))
    reason = db.Column(db.String(150))
    date = db.Column(db.Date)
    notes = db.Column(db.Text)


class Diaper(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    mess_type = db.Column(db.Enum(DiaperTypeEnum))
    notes = db.Column(db.Text)
    time = db.Column(db.DateTime, default=datetime.utcnow)


class Feeding(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    feed_type = db.Column(db.Enum(FeedTypeEnum))
    amount = db.Column(db.String(50))
    notes = db.Column(db.Text)
    time = db.Column(db.DateTime, default=datetime.utcnow)


class Sleep(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer)
    notes = db.Column(db.Text)


class Growth(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    weight_kg = db.Column(db.Float)
    height_cm = db.Column(db.Float)
    head_circumference_cm = db.Column(db.Float)
    notes = db.Column(db.Text)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100))
    message = db.Column(db.Text)
    notification_type = db.Column(db.Enum(NotificationTypeEnum), default=NotificationTypeEnum.GENERAL)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Dashboard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    total_feedings = db.Column(db.Integer, default=0)
    total_diapers = db.Column(db.Integer, default=0)
    total_sleep_hours = db.Column(db.Float, default=0)
    last_checkup = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TrackMenu(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(100))
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Navbar(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(100))
    path = db.Column(db.String(100))
    icon = db.Column(db.String(50))


class HomeSection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150))
    subtitle = db.Column(db.String(250))
    image_url = db.Column(db.String(300))
    content = db.Column(db.Text)

class Timetable(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    activity = db.Column(db.String(100))  
    time_of_day = db.Column(db.String(20)) 
    scheduled_time = db.Column(db.Time, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Reminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profile.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text)
    time_of_day = db.Column(db.String(20))  # "Morning", "Noon", "Evening"
    scheduled_time = db.Column(db.Time, nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
