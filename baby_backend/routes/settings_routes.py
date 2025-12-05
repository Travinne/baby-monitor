from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from baby_backend.database import db
from baby_backend.models import User, UserSettings
from flask_jwt_extended import jwt_required, get_jwt_identity

settings_bp = Blueprint("settings_bp", __name__, url_prefix="/settings")

@settings_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_settings(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)
        db.session.commit()

    return jsonify({
        "username": user.username,
        "fullName": settings.full_name or "",
        "email": user.email,
        "notifications": settings.notifications if settings.notifications is not None else True,
        "theme": settings.theme or "light"
    }), 200

@settings_bp.route("/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_settings(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json() or {}

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)

    # Update username/email
    if "username" in data:
        if User.query.filter(User.username == data["username"], User.id != user_id).first():
            return jsonify({"message": "Username already taken"}), 409
        user.username = data["username"]

    if "email" in data:
        if User.query.filter(User.email == data["email"], User.id != user_id).first():
            return jsonify({"message": "Email already taken"}), 409
        user.email = data["email"]

    if "fullName" in data:
        settings.full_name = data["fullName"]

    if "notifications" in data:
        settings.notifications = data["notifications"]

    if "theme" in data:
        settings.theme = data["theme"]

    # Handle password change
    old_password = data.get("oldPassword")
    new_password = data.get("newPassword")
    if old_password and new_password:
        if not check_password_hash(user.password, old_password):
            return jsonify({"message": "Current password is incorrect"}), 400
        user.password = generate_password_hash(new_password)

    db.session.commit()

    return jsonify({
        "message": "Settings updated successfully",
        "settings": {
            "username": user.username,
            "fullName": settings.full_name or "",
            "email": user.email,
            "notifications": settings.notifications if settings.notifications is not None else True,
            "theme": settings.theme or "light"
        }
    }), 200
