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
        return jsonify({"message": "Unauthorized access"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)
        db.session.commit()

    return jsonify({
        "userId": user.id,
        "username": user.username,
        "fullName": settings.fullName or "",
        "email": user.email,
        "theme": settings.theme or "light",
        "notifications": settings.notifications if settings.notifications is not None else True
    }), 200


@settings_bp.route("/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_settings(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized access"}), 403

    data = request.get_json() or {}

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)

    # Update username
    new_username = data.get("username")
    if new_username and new_username != user.username:
        if User.query.filter_by(username=new_username).first():
            return jsonify({"message": "Username already exists"}), 409
        user.username = new_username

    # Update email
    new_email = data.get("email")
    if new_email and new_email != user.email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({"message": "Email already exists"}), 409
        user.email = new_email

    # Update full name
    if "fullName" in data:
        settings.fullName = data["fullName"]

    # Update theme
    if "theme" in data:
        settings.theme = data["theme"]

    # Update notifications
    if "notifications" in data:
        settings.notifications = data["notifications"]

    # Update password
    old_password = data.get("oldPassword")
    new_password = data.get("newPassword")
    if new_password:
        if not old_password:
            return jsonify({"message": "Current password is required to set a new password"}), 400
        if not check_password_hash(user.password, old_password):
            return jsonify({"message": "Current password is incorrect"}), 400
        user.password = generate_password_hash(new_password)

    db.session.commit()

    return jsonify({
        "message": "Settings updated successfully",
        "settings": {
            "userId": user.id,
            "username": user.username,
            "fullName": settings.fullName,
            "email": user.email,
            "theme": settings.theme,
            "notifications": settings.notifications
        }
    }), 200
