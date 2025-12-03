from flask import Blueprint, request, jsonify
from baby_backend.database import db
from baby_backend.models import Notification

notification_bp = Blueprint('notification_bp', __name__)

@notification_bp.route('/', methods=['GET'])
def get_notifications():
    notifications = Notification.query.all()
    return jsonify([
        {
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'time': n.time
        } for n in notifications
    ])

@notification_bp.route('/', methods=['POST'])
def add_notification():
    data = request.get_json()
    new_notification = Notification(
        title=data.get('title', ''),
        message=data.get('message', ''),
        time=data.get('time', '')
    )
    db.session.add(new_notification)
    db.session.commit()
    return jsonify({'message': 'Notification added successfully'}), 201

@notification_bp.route('/<int:id>', methods=['DELETE'])
def delete_notification(id):
    notif = Notification.query.get_or_404(id)
    db.session.delete(notif)
    db.session.commit()
    return jsonify({'message': 'Notification deleted successfully'})
