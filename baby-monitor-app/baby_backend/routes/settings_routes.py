from flask import Blueprint, request, jsonify
from baby_backend.database import db
from baby_backend.models import UserSettings

settings_bp = Blueprint("settings_bp", __name__, url_prefix="/settings")

@settings_bp.route("/<int:user_id>", methods=["GET"])
def get_settings(user_id):
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        return jsonify({"message": "No settings found for this user"}), 404

    return jsonify({
        "user_id": settings.user_id,
        "full_name": settings.full_name,
        "email": settings.email,
        "theme": settings.theme,
        "notifications": settings.notifications
    }), 200


@settings_bp.route("/<int:user_id>", methods=["PUT"])
def update_settings(user_id):
    data = request.get_json() or {}
    settings = UserSettings.query.filter_by(user_id=user_id).first()

    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)

    if "full_name" in data:
        settings.full_name = data["full_name"]
    if "email" in data:
        settings.email = data["email"]
    if "theme" in data:
        settings.theme = data["theme"]
    if "notifications" in data:
        settings.notifications = data["notifications"]

    db.session.commit()

    return jsonify({
        "message": "Settings updated successfully",
        "settings": {
            "user_id": settings.user_id,
            "full_name": settings.full_name,
            "email": settings.email,
            "theme": settings.theme,
            "notifications": settings.notifications
        }
    }), 200