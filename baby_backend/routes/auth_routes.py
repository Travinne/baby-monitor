from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from ..models import User
from ..database import db
import datetime

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        confirm_password = data.get("confirmPassword")

        if not all([username, email, password, confirm_password]):
            return jsonify({"message": "All fields are required"}), 400

        if password != confirm_password:
            return jsonify({"message": "Passwords do not match"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username already exists"}), 409

        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 409

        user = User(
            username=username,
            email=email,
            password=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(
            identity=user.id,
            expires_delta=datetime.timedelta(hours=24)
        )

        return jsonify({
            "message": "Registration successful",
            "token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500


# ======================
# LOGIN
# ======================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=user.id,
        expires_delta=datetime.timedelta(hours=24)
    )

    return jsonify({
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200
