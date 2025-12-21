from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from baby_backend.database import db
from ..models import Notification, BabyProfile, Feeding, Sleep, Diaper

notification_bp = Blueprint('notification_bp', __name__)

# Get all notifications for the current user
@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_notifications():
    try:
        user_id = get_jwt_identity()
        
        # Get all notifications for the user
        notifications = Notification.query.filter_by(user_id=user_id).order_by(
            Notification.reminder_time.desc(),
            Notification.created_at.desc()
        ).all()
        
        return jsonify([
            {
                'id': n.id,
                'babyId': n.baby_id,
                'title': n.title,
                'message': n.message,
                'type': n.type,  # 'reminder', 'alert', 'milestone', 'schedule'
                'reminderTime': n.reminder_time.isoformat() if n.reminder_time else None,
                'scheduledFor': n.scheduled_for.isoformat() if n.scheduled_for else None,
                'alarm': n.alarm,
                'read': n.read,
                'priority': n.priority,  # 'low', 'medium', 'high', 'critical'
                'action': n.action,  # 'feed', 'sleep', 'diaper', 'medication', 'appointment'
                'createdAt': n.created_at.isoformat() if n.created_at else None
            } for n in notifications
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get notifications: {str(e)}"}), 500


# Get unread notifications count
@notification_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    try:
        user_id = get_jwt_identity()
        
        count = Notification.query.filter_by(
            user_id=user_id,
            read=False
        ).count()
        
        return jsonify({"count": count}), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get unread count: {str(e)}"}), 500


# Mark notification as read
@notification_bp.route('/<int:id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_as_read(id):
    try:
        user_id = get_jwt_identity()
        
        # Get notification
        notification = Notification.query.get(id)
        if not notification:
            return jsonify({"message": "Notification not found"}), 404
        
        # Verify notification belongs to user
        if notification.user_id != user_id:
            return jsonify({"message": "Access denied"}), 403
        
        notification.read = True
        db.session.commit()
        
        return jsonify({"message": "Notification marked as read"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to mark notification as read: {str(e)}"}), 500


# Mark all notifications as read
@notification_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_as_read():
    try:
        user_id = get_jwt_identity()
        
        # Get all unread notifications for the user
        notifications = Notification.query.filter_by(
            user_id=user_id,
            read=False
        ).all()
        
        for notification in notifications:
            notification.read = True
        
        db.session.commit()
        
        return jsonify({
            "message": f"Marked {len(notifications)} notifications as read"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to mark notifications as read: {str(e)}"}), 500


# Create a new notification
@notification_bp.route('/', methods=['POST'])
@jwt_required()
def create_notification():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({"message": "Title is required"}), 400
        
        if not data.get('message'):
            return jsonify({"message": "Message is required"}), 400
        
        # Verify baby belongs to user if babyId is provided
        baby_id = data.get('babyId')
        if baby_id:
            baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
            if not baby:
                return jsonify({"message": "Baby not found"}), 404
        
        # Parse reminder time
        reminder_time = None
        if data.get('reminderTime'):
            try:
                reminder_time = datetime.fromisoformat(data['reminderTime'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid reminder time format"}), 400
        
        # Parse scheduled for time
        scheduled_for = None
        if data.get('scheduledFor'):
            try:
                scheduled_for = datetime.fromisoformat(data['scheduledFor'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid scheduled time format"}), 400
        
        # Create new notification
        new_notification = Notification(
            user_id=user_id,
            baby_id=baby_id,
            title=data['title'],
            message=data['message'],
            type=data.get('type', 'reminder'),
            reminder_time=reminder_time,
            scheduled_for=scheduled_for,
            alarm=data.get('alarm', False),
            read=data.get('read', False),
            priority=data.get('priority', 'medium'),
            action=data.get('action'),
            category=data.get('category')
        )
        
        db.session.add(new_notification)
        db.session.commit()
        
        return jsonify({
            'id': new_notification.id,
            'babyId': new_notification.baby_id,
            'title': new_notification.title,
            'message': new_notification.message,
            'type': new_notification.type,
            'reminderTime': new_notification.reminder_time.isoformat() if new_notification.reminder_time else None,
            'scheduledFor': new_notification.scheduled_for.isoformat() if new_notification.scheduled_for else None,
            'alarm': new_notification.alarm,
            'read': new_notification.read,
            'priority': new_notification.priority,
            'action': new_notification.action,
            'createdAt': new_notification.created_at.isoformat() if new_notification.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to create notification: {str(e)}"}), 500


# Delete a notification
@notification_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_notification(id):
    try:
        user_id = get_jwt_identity()
        
        # Get notification
        notification = Notification.query.get(id)
        if not notification:
            return jsonify({"message": "Notification not found"}), 404
        
        # Verify notification belongs to user
        if notification.user_id != user_id:
            return jsonify({"message": "Access denied"}), 403
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({"message": "Notification deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete notification: {str(e)}"}), 500


# Dashboard endpoints
@notification_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        user_id = get_jwt_identity()
        
        # Get user's babies
        babies = BabyProfile.query.filter_by(user_id=user_id).all()
        baby_ids = [baby.id for baby in babies]
        
        if not baby_ids:
            return jsonify({
                "recentActivities": [],
                "stats": {
                    "todayFeeds": 0,
                    "todaySleeps": 0,
                    "todayDiapers": 0,
                    "activeAlerts": 0
                },
                "babyInfo": None
            }), 200
        
        # Get baby info (use the first baby for now)
        baby = babies[0]
        baby_info = {
            'id': baby.id,
            'name': baby.name,
            'age': calculate_age_in_months(baby.date_of_birth),
            'photo': f"/uploads/baby_photos/{baby.photo}" if baby.photo else None
        }
        
        # Calculate today's stats
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Today's feeds
        today_feeds = Feeding.query.filter(
            Feeding.baby_id.in_(baby_ids),
            Feeding.time >= today_start,
            Feeding.time < today_end
        ).count()
        
        # Today's sleeps
        today_sleeps = 0  # Assuming Sleep model exists
        # today_sleeps = Sleep.query.filter(
        #     Sleep.baby_id.in_(baby_ids),
        #     Sleep.start_time >= today_start,
        #     Sleep.start_time < today_end
        # ).count()
        
        # Today's diapers
        today_diapers = Diaper.query.filter(
            Diaper.baby_id.in_(baby_ids),
            Diaper.timestamp >= today_start,
            Diaper.timestamp < today_end
        ).count()
        
        # Active alerts (unread notifications)
        active_alerts = Notification.query.filter_by(
            user_id=user_id,
            read=False
        ).count()
        
        # Get recent activities (last 10 activities from all categories)
        recent_activities = []
        
        # Recent feeds
        recent_feeds = Feeding.query.filter(
            Feeding.baby_id.in_(baby_ids)
        ).order_by(Feeding.time.desc()).limit(5).all()
        
        for feed in recent_feeds:
            recent_activities.append({
                'id': f"feed_{feed.id}",
                'type': 'feeding',
                'babyId': feed.baby_id,
                'title': f"{feed.feed_type.capitalize()} feeding",
                'description': f"{feed.amount or 'N/A'} {feed.unit}",
                'timestamp': feed.time.isoformat() if feed.time else None,
                'icon': '🍼'
            })
        
        # Recent diapers
        recent_diapers = Diaper.query.filter(
            Diaper.baby_id.in_(baby_ids)
        ).order_by(Diaper.timestamp.desc()).limit(5).all()
        
        for diaper in recent_diapers:
            recent_activities.append({
                'id': f"diaper_{diaper.id}",
                'type': 'diaper',
                'babyId': diaper.baby_id,
                'title': 'Diaper change',
                'description': f"{diaper.type.capitalize()} diaper",
                'timestamp': diaper.timestamp.isoformat() if diaper.timestamp else None,
                'icon': '👶'
            })
        
        # Recent notifications
        recent_notifications = Notification.query.filter_by(
            user_id=user_id
        ).order_by(Notification.created_at.desc()).limit(5).all()
        
        for notification in recent_notifications:
            recent_activities.append({
                'id': f"notification_{notification.id}",
                'type': 'notification',
                'babyId': notification.baby_id,
                'title': notification.title,
                'description': notification.message,
                'timestamp': notification.created_at.isoformat() if notification.created_at else None,
                'icon': '🔔'
            })
        
        # Sort all activities by timestamp and take the 10 most recent
        recent_activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        recent_activities = recent_activities[:10]
        
        return jsonify({
            "recentActivities": recent_activities,
            "stats": {
                "todayFeeds": today_feeds,
                "todaySleeps": today_sleeps,
                "todayDiapers": today_diapers,
                "activeAlerts": active_alerts
            },
            "babyInfo": baby_info
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get dashboard data: {str(e)}"}), 500


# Helper function to calculate age in months
def calculate_age_in_months(birth_date):
    if not birth_date:
        return None
    
    today = datetime.utcnow().date()
    if isinstance(birth_date, datetime):
        birth_date = birth_date.date()
    
    months = (today.year - birth_date.year) * 12 + (today.month - birth_date.month)
    
    # Adjust for days
    if today.day < birth_date.day:
        months -= 1
    
    # Calculate remaining days
    last_month = today.replace(day=1) - timedelta(days=1)
    if last_month.day < birth_date.day:
        days = today.day
    else:
        days = today.day - birth_date.day
    
    return {
        'months': max(0, months),
        'days': days,
        'formatted': f"{months} months, {days} days" if months > 0 else f"{days} days"
    }