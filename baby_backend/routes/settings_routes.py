from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from datetime import datetime
from baby_backend.database import db
from ..models import User, UserSettings

settings_bp = Blueprint("settings_bp", __name__, url_prefix="/settings")

# Default settings structure
DEFAULT_APP_SETTINGS = {
    "theme": "light",
    "language": "en",
    "measurementSystem": "metric",
    "autoSync": True,
    "dataBackup": True,
    "shareWithPartner": True,
    "privacyMode": False,
    "deleteDataAfter": "never"
}

DEFAULT_NOTIFICATION_SETTINGS = {
    "feedingReminders": True,
    "diaperReminders": True,
    "sleepReminders": True,
    "medicationReminders": True,
    "appointmentReminders": True,
    "emailNotifications": True,
    "pushNotifications": True,
    "smsNotifications": False,
    "reminderInterval": "3",
    "quietHoursStart": "22:00",
    "quietHoursEnd": "07:00"
}

# Helper function to get or create user settings
def get_or_create_user_settings(user_id):
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(
            user_id=user_id,
            app_settings=json.dumps(DEFAULT_APP_SETTINGS),
            notification_settings=json.dumps(DEFAULT_NOTIFICATION_SETTINGS)
        )
        db.session.add(settings)
        db.session.commit()
    return settings

# Get all settings
@settings_bp.route("/", methods=["GET"])
@jwt_required()
def get_settings():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        settings = get_or_create_user_settings(user_id)
        
        # Parse JSON settings
        app_settings = json.loads(settings.app_settings) if settings.app_settings else DEFAULT_APP_SETTINGS
        notification_settings = json.loads(settings.notification_settings) if settings.notification_settings else DEFAULT_NOTIFICATION_SETTINGS
        
        # Merge with defaults to ensure all fields exist
        merged_app_settings = {**DEFAULT_APP_SETTINGS, **app_settings}
        merged_notification_settings = {**DEFAULT_NOTIFICATION_SETTINGS, **notification_settings}
        
        return jsonify({
            "app": merged_app_settings,
            "notifications": merged_notification_settings
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get settings: {str(e)}"}), 500

# Update all settings
@settings_bp.route("/", methods=["PUT"])
@jwt_required()
def update_settings():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        settings = get_or_create_user_settings(user_id)
        
        # Update app settings if provided
        if 'app' in data and data['app']:
            current_app_settings = json.loads(settings.app_settings) if settings.app_settings else DEFAULT_APP_SETTINGS
            updated_app_settings = {**current_app_settings, **data['app']}
            
            # Validate app settings
            if 'theme' in data['app'] and data['app']['theme'] not in ['light', 'dark', 'auto']:
                return jsonify({"message": "Invalid theme value"}), 400
            
            if 'measurementSystem' in data['app'] and data['app']['measurementSystem'] not in ['metric', 'imperial']:
                return jsonify({"message": "Invalid measurement system"}), 400
            
            if 'language' in data['app'] and data['app']['language'] not in ['en', 'es', 'fr', 'de', 'it']:
                return jsonify({"message": "Unsupported language"}), 400
            
            if 'deleteDataAfter' in data['app'] and data['app']['deleteDataAfter'] not in ['never', '30days', '90days', '1year']:
                return jsonify({"message": "Invalid data retention period"}), 400
            
            settings.app_settings = json.dumps(updated_app_settings)
        
        # Update notification settings if provided
        if 'notifications' in data and data['notifications']:
            current_notification_settings = json.loads(settings.notification_settings) if settings.notification_settings else DEFAULT_NOTIFICATION_SETTINGS
            updated_notification_settings = {**current_notification_settings, **data['notifications']}
            
            # Validate notification settings
            if 'reminderInterval' in data['notifications']:
                try:
                    interval = int(data['notifications']['reminderInterval'])
                    if interval < 1 or interval > 12:
                        return jsonify({"message": "Reminder interval must be between 1 and 12 hours"}), 400
                except ValueError:
                    return jsonify({"message": "Invalid reminder interval"}), 400
            
            if 'quietHoursStart' in data['notifications']:
                try:
                    datetime.strptime(data['notifications']['quietHoursStart'], '%H:%M')
                except ValueError:
                    return jsonify({"message": "Invalid quiet hours start time. Use HH:MM format"}), 400
            
            if 'quietHoursEnd' in data['notifications']:
                try:
                    datetime.strptime(data['notifications']['quietHoursEnd'], '%H:%M')
                except ValueError:
                    return jsonify({"message": "Invalid quiet hours end time. Use HH:MM format"}), 400
            
            settings.notification_settings = json.dumps(updated_notification_settings)
        
        settings.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Return updated settings
        app_settings = json.loads(settings.app_settings) if settings.app_settings else DEFAULT_APP_SETTINGS
        notification_settings = json.loads(settings.notification_settings) if settings.notification_settings else DEFAULT_NOTIFICATION_SETTINGS
        
        return jsonify({
            "app": app_settings,
            "notifications": notification_settings
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update settings: {str(e)}"}), 500

# Update notification settings only
@settings_bp.route("/notifications", methods=["PUT"])
@jwt_required()
def update_notification_settings():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        settings = get_or_create_user_settings(user_id)
        
        # Get current notification settings
        current_notification_settings = json.loads(settings.notification_settings) if settings.notification_settings else DEFAULT_NOTIFICATION_SETTINGS
        
        # Update with new data
        updated_notification_settings = {**current_notification_settings, **data}
        
        # Validate notification settings
        if 'reminderInterval' in data:
            try:
                interval = int(data['reminderInterval'])
                if interval < 1 or interval > 12:
                    return jsonify({"message": "Reminder interval must be between 1 and 12 hours"}), 400
            except ValueError:
                return jsonify({"message": "Invalid reminder interval"}), 400
        
        if 'quietHoursStart' in data:
            try:
                datetime.strptime(data['quietHoursStart'], '%H:%M')
            except ValueError:
                return jsonify({"message": "Invalid quiet hours start time. Use HH:MM format"}), 400
        
        if 'quietHoursEnd' in data:
            try:
                datetime.strptime(data['quietHoursEnd'], '%H:%M')
            except ValueError:
                return jsonify({"message": "Invalid quiet hours end time. Use HH:MM format"}), 400
        
        # Save updated settings
        settings.notification_settings = json.dumps(updated_notification_settings)
        settings.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "notifications": updated_notification_settings
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update notification settings: {str(e)}"}), 500

# Export user data
@settings_bp.route("/export", methods=["GET"])
@jwt_required()
def export_user_data():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        # In a real implementation, you would generate a comprehensive export
        # For now, we'll return a simplified version
        export_data = {
            "user": {
                "username": user.username,
                "email": user.email,
                "createdAt": user.created_at.isoformat() if user.created_at else None
            },
            "settings": {},
            "babies": [],
            "lastExport": datetime.utcnow().isoformat(),
            "format": "json"
        }
        
        # Add settings if they exist
        settings = UserSettings.query.filter_by(user_id=user_id).first()
        if settings:
            export_data["settings"] = {
                "app": json.loads(settings.app_settings) if settings.app_settings else DEFAULT_APP_SETTINGS,
                "notifications": json.loads(settings.notification_settings) if settings.notification_settings else DEFAULT_NOTIFICATION_SETTINGS
            }
        
        return jsonify(export_data), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to export data: {str(e)}"}), 500

# Delete user account
@settings_bp.route("/delete-account", methods=["POST"])
@jwt_required()
def delete_account():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        # Optional: Require password confirmation
        password = data.get('password')
        if password:
            if not check_password_hash(user.password, password):
                return jsonify({"message": "Incorrect password"}), 401
        
        # In a real application, you might want to:
        # 1. Soft delete (mark as deleted)
        # 2. Delete all associated data
        # 3. Send confirmation email
        # 4. Schedule permanent deletion after X days
        
        # For now, we'll just delete the user and their settings
        # (Note: In a real app, you should handle foreign key constraints)
        
        # Delete user settings
        settings = UserSettings.query.filter_by(user_id=user_id).first()
        if settings:
            db.session.delete(settings)
        
        # Delete user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "Account deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete account: {str(e)}"}), 500

# Reset settings to defaults
@settings_bp.route("/reset", methods=["POST"])
@jwt_required()
def reset_settings():
    try:
        user_id = get_jwt_identity()
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        settings = UserSettings.query.filter_by(user_id=user_id).first()
        if not settings:
            settings = UserSettings(user_id=user_id)
            db.session.add(settings)
        
        # Reset to defaults
        settings.app_settings = json.dumps(DEFAULT_APP_SETTINGS)
        settings.notification_settings = json.dumps(DEFAULT_NOTIFICATION_SETTINGS)
        settings.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Settings reset to defaults",
            "app": DEFAULT_APP_SETTINGS,
            "notifications": DEFAULT_NOTIFICATION_SETTINGS
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to reset settings: {str(e)}"}), 500