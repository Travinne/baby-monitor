from .database import db
from datetime import datetime


class Allergy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    reaction = db.Column(db.String(150))
    notes = db.Column(db.Text)
    diagnosed_date = db.Column(db.String(50))
    added_on = db.Column(db.DateTime, default=datetime.utcnow)

class Bath(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    notes = db.Column(db.Text)
    time = db.Column(db.String(50))

class Checkup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doctor_name = db.Column(db.String(100))
    reason = db.Column(db.String(150))
    date = db.Column(db.String(50))
    notes = db.Column(db.Text)

class Diaper(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mess_type = db.Column(db.String(50))
    notes = db.Column(db.Text)
    time = db.Column(db.String(50))

class Feeding(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    feed_type = db.Column(db.String(50))
    amount = db.Column(db.String(50))
    notes = db.Column(db.String(200))
    time = db.Column(db.String(100))

class Sleep(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.String(100))
    end_time = db.Column(db.String(100))
    duration = db.Column(db.String(50))
    notes = db.Column(db.String, nullable=True)

class Growth(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    weight = db.Column(db.String(10))
    height = db.Column(db.String(10))
    head_circumference = db.Column(db.String(10))
    notes = db.Column(db.String(200))
    time = db.Column(db.String(100))


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    settings = db.relationship('UserSettings', backref='user', uselist=False)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    profiles = db.relationship('BabyProfile', backref='parent', lazy=True)

class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    theme = db.Column(db.String(20), default='light')
    notifications = db.Column(db.Boolean, default=True)



class BabyProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.String(50))
    age = db.Column(db.String(20))
    gender = db.Column(db.String(20))
    notes = db.Column(db.Text)
    added_on = db.Column(db.DateTime, default=datetime.utcnow)



class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(100))
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Dashboard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    total_feedings = db.Column(db.Integer, default=0)
    total_diapers = db.Column(db.Integer, default=0)
    total_sleep_hours = db.Column(db.Float, default=0)
    last_checkup = db.Column(db.String(50))
    last_update = db.Column(db.DateTime, default=datetime.utcnow)


class TrackMenu(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
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
