from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, UserSettings

settings_bp = Blueprint("settings_bp", __name__, url_prefix="/settings")

@settings_bp.route("/", methods=["GET"])
@jwt_required()
def get_current_user_settings():
    user_id = get_jwt_identity()
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


@settings_bp.route("/", methods=["PUT"])
@jwt_required()
def update_current_user_settings():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)

    username = data.get("username")
    if username and username != user.username:
        if User.query.filter(User.username == username, User.id != user_id).first():
            return jsonify({"message": "Username already taken"}), 409
        user.username = username

    full_name = data.get("fullName")
    if full_name is not None:
        settings.full_name = full_name

    notifications = data.get("notifications")
    if notifications is not None:
        settings.notifications = notifications

    theme = data.get("theme")
    if theme:
        settings.theme = theme

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
