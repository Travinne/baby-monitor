from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from baby_backend.database import db
from baby_backend.models import Notification, BabyProfile
from datetime import datetime

notification_bp = Blueprint('notification_bp', __name__)

@notification_bp.route('/<int:baby_id>', methods=['GET'])
def get_notifications(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    notifications = Notification.query.filter_by(user_id=user_id, baby_id=baby_id).all()
    return jsonify([
        {
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'reminder_time': n.reminder_time.strftime("%Y-%m-%d %H:%M:%S") if n.reminder_time else None,
            'alarm': n.alarm
        } for n in notifications
    ]), 200

@notification_bp.route('/<int:baby_id>', methods=['POST'])
def add_notification(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    data = request.get_json()
    reminder_time = data.get('reminder_time')
    if reminder_time:
        reminder_time = datetime.strptime(reminder_time, "%Y-%m-%d %H:%M:%S")

    new_notification = Notification(
        user_id=user_id,
        baby_id=baby_id,
        title=data.get('title', 'Reminder'),
        message=data.get('message', 'Time is up!'),
        reminder_time=reminder_time,
        alarm=data.get('alarm', False)
    )
    db.session.add(new_notification)
    db.session.commit()
    return jsonify({'message': 'Notification/reminder added successfully'}), 201

@notification_bp.route('/<int:baby_id>/<int:id>', methods=['DELETE'])
def delete_notification(baby_id, id):
    user_id = get_jwt_identity()
    notification = Notification.query.filter_by(id=id, user_id=user_id, baby_id=baby_id).first()
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404

    db.session.delete(notification)
    db.session.commit()
    return jsonify({'message': 'Notification deleted successfully'}), 200
