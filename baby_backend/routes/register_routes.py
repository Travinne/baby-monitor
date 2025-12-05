from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from baby_backend.models import User
from baby_backend.database import db
import jwt
import datetime
import os

register_bp = Blueprint("register_bp", __name__)

@register_bp.route("", methods=["POST"])
def register_user():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    confirmPassword = data.get("confirmPassword")

    if not username or not email or not password or not confirmPassword:
        return jsonify({"message": "All fields are required"}), 400

    if password != confirmPassword:
        return jsonify({"message": "Passwords do not match"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 409

    hashedPassword = generate_password_hash(password)

    user = User(username=username, email=email, password=hashedPassword)
    db.session.add(user)
    db.session.commit()

    jwtSecret = os.environ.get("JWT_SECRET", "dev-secret")
    token = jwt.encode(
        {
            "userId": user.id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        },
        jwtSecret,
        algorithm="HS256",
    )

    return jsonify(
        {
            "message": "Registration successful",
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
        }
    ), 201
