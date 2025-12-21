from baby_backend.database import db
from datetime import datetime
from enum import Enum
import json


class SeverityEnum(Enum):
    MILD = "Mild"
    MODERATE = "Moderate"
    SEVERE = "Severe"

class GenderEnum(Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class FeedTypeEnum(Enum):
    BREAST = "breast"
    FORMULA = "formula"
    SOLIDS = "solids"
    MIXED = "mixed"

class DiaperTypeEnum(Enum):
    WET = "wet"
    DIRTY = "dirty"
    MIXED = "mixed"

class DiaperConsistencyEnum(Enum):
    NORMAL = "normal"
    WATERY = "watery"
    HARD = "hard"

class DiaperColorEnum(Enum):
    YELLOW = "yellow"
    GREEN = "green"
    BROWN = "brown"
    BLACK = "black"
    RED = "red"
    WHITE = "white"

class NotificationTypeEnum(Enum):
    GENERAL = "general"
    REMINDER = "reminder"
    ALERT = "alert"
    MILESTONE = "milestone"
    SCHEDULE = "schedule"

class SleepTypeEnum(Enum):
    NAP = "nap"
    NIGHT = "night"
    BEDTIME = "bedtime"

class SleepQualityEnum(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    RESTLESS = "restless"

class SleepEnvironmentEnum(Enum):
    QUIET = "quiet"
    NOISY = "noisy"
    DARK = "dark"
    LIGHT = "light"

class SleepPositionEnum(Enum):
    BACK = "back"
    SIDE = "side"
    TUMMY = "tummy"

class BathMoodEnum(Enum):
    HAPPY = "happy"
    CRANKY = "cranky"
    SLEEPY = "sleepy"
    ALERT = "alert"
    CALM = "calm"

class CheckupTypeEnum(Enum):
    ROUTINE = "routine"
    EMERGENCY = "emergency"
    SPECIALIST = "specialist"
    VACCINATION = "vaccination"

class NotificationPriorityEnum(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationActionEnum(Enum):
    FEED = "feed"
    SLEEP = "sleep"
    DIAPER = "diaper"
    MEDICATION = "medication"
    APPOINTMENT = "appointment"
    BATH = "bath"

class MilestoneCategoryEnum(Enum):
    PHYSICAL = "physical"
    COGNITIVE = "cognitive"
    SOCIAL = "social"
    GENERAL = "general"


# User model for authentication
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    settings = db.relationship('UserSettings', backref='user', uselist=False, cascade="all, delete-orphan")
    babies = db.relationship('BabyProfile', backref='parent', lazy=True, cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade="all, delete-orphan")


# User settings for app preferences
class UserSettings(db.Model):
    __tablename__ = 'user_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    app_settings = db.Column(db.Text, default='{}')  # JSON string for app settings
    notification_settings = db.Column(db.Text, default='{}')  # JSON string for notification settings
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Baby profile - main entity
class BabyProfile(db.Model):
    __tablename__ = 'baby_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10))
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    head_circumference = db.Column(db.Float)
    photo = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    allergies = db.relationship('Allergy', backref='baby', cascade='all, delete-orphan')
    baths = db.relationship('Bath', backref='baby', cascade='all, delete-orphan')
    checkups = db.relationship('Checkup', backref='baby', cascade='all, delete-orphan')
    diapers = db.relationship('Diaper', backref='baby', cascade='all, delete-orphan')
    feedings = db.relationship('Feeding', backref='baby', cascade='all, delete-orphan')
    growth_records = db.relationship('Growth', backref='baby', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='baby', cascade='all, delete-orphan')
    sleep_records = db.relationship('Sleep', backref='baby', cascade='all, delete-orphan')
    vaccinations = db.relationship('Vaccination', backref='baby', cascade='all, delete-orphan')
    milestones = db.relationship('Milestone', backref='baby', cascade='all, delete-orphan')


# Allergy tracking
class Allergy(db.Model):
    __tablename__ = 'allergies'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.Enum(SeverityEnum), nullable=False)
    reaction = db.Column(db.String(150))
    notes = db.Column(db.Text)
    diagnosed_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Bath tracking
class Bath(db.Model):
    __tablename__ = 'baths'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    time = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Integer)
    products_used = db.Column(db.Text)  # JSON array of products used
    water_temperature = db.Column(db.String(20))
    mood_before = db.Column(db.Enum(BathMoodEnum))
    mood_after = db.Column(db.Enum(BathMoodEnum))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Doctor checkups
class Checkup(db.Model):
    __tablename__ = 'checkups'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    doctor_name = db.Column(db.String(200), nullable=False)
    clinic = db.Column(db.String(200))
    type = db.Column(db.Enum(CheckupTypeEnum), default='routine')
    reason = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False)
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    head_circumference = db.Column(db.Float)
    temperature = db.Column(db.Float)
    heart_rate = db.Column(db.Integer)
    blood_pressure = db.Column(db.String(20))
    diagnosis = db.Column(db.Text)
    prescription = db.Column(db.Text)  # JSON array of medications
    vaccines = db.Column(db.Text)  # JSON array of vaccines administered
    next_appointment = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Diaper changes
class Diaper(db.Model):
    __tablename__ = 'diapers'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    type = db.Column(db.Enum(DiaperTypeEnum), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    consistency = db.Column(db.Enum(DiaperConsistencyEnum))
    color = db.Column(db.Enum(DiaperColorEnum))
    amount = db.Column(db.String(20))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Feeding tracking
class Feeding(db.Model):
    __tablename__ = 'feedings'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    feed_type = db.Column(db.Enum(FeedTypeEnum), nullable=False)
    amount = db.Column(db.Float)
    unit = db.Column(db.String(20), default='ml')
    duration = db.Column(db.Integer)
    side = db.Column(db.String(20))
    time = db.Column(db.DateTime, nullable=False)
    notes = db.Column(db.Text)
    mood_before = db.Column(db.Enum(BathMoodEnum))
    mood_after = db.Column(db.Enum(BathMoodEnum))
    position = db.Column(db.String(50))
    temperature = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Sleep tracking
class Sleep(db.Model):
    __tablename__ = 'sleep_records'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    duration = db.Column(db.Float)
    type = db.Column(db.Enum(SleepTypeEnum), default='nap')
    quality = db.Column(db.Enum(SleepQualityEnum))
    wake_ups = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text)
    environment = db.Column(db.Enum(SleepEnvironmentEnum))
    position = db.Column(db.Enum(SleepPositionEnum))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Growth tracking
class Growth(db.Model):
    __tablename__ = 'growth_records'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    head_circumference = db.Column(db.Float)
    weight_percentile = db.Column(db.Float)
    height_percentile = db.Column(db.Float)
    head_circumference_percentile = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('baby_id', 'date', name='uix_baby_date'),)


# Notifications and reminders
class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'))
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum(NotificationTypeEnum), default='reminder')
    reminder_time = db.Column(db.DateTime)
    scheduled_for = db.Column(db.DateTime)
    alarm = db.Column(db.Boolean, default=False)
    read = db.Column(db.Boolean, default=False)
    priority = db.Column(db.Enum(NotificationPriorityEnum), default='medium')
    action = db.Column(db.Enum(NotificationActionEnum))
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Vaccination tracking (from baby profile routes)
class Vaccination(db.Model):
    __tablename__ = 'vaccinations'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    date = db.Column(db.DateTime)
    next_due_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Milestone tracking (from baby profile routes)
class Milestone(db.Model):
    __tablename__ = 'milestones'
    
    id = db.Column(db.Integer, primary_key=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby_profiles.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime)
    category = db.Column(db.Enum(MilestoneCategoryEnum), default='general')
    achieved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)