from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token
from ..models import User
from baby_backend.database import db
import datetime
import re
import secrets
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

auth_bp = Blueprint("auth_bp", __name__)

# Initialize serializer for password reset tokens
def get_reset_token_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])

def validate_email(email):
    """Validate email format"""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password):
    """Validate password strength"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not any(char.isupper() for char in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(char.islower() for char in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(char.isdigit() for char in password):
        errors.append("Password must contain at least one number")
    
    return errors

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}

        # Get and validate fields
        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        confirm_password = data.get("confirmPassword", "")

        # Validate required fields
        if not all([username, email, password, confirm_password]):
            return jsonify({"message": "All fields are required"}), 400

        # Validate email format
        if not validate_email(email):
            return jsonify({"message": "Invalid email format"}), 400

        # Validate password match
        if password != confirm_password:
            return jsonify({"message": "Passwords do not match"}), 400

        # Validate password strength
        password_errors = validate_password_strength(password)
        if password_errors:
            return jsonify({
                "message": "Password validation failed",
                "errors": password_errors
            }), 400

        # Check if user already exists
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            if existing_user.username == username:
                return jsonify({"message": "Username already exists"}), 409
            else:
                return jsonify({"message": "Email already exists"}), 409

        # Create new user
        user = User(
            username=username,
            email=email,
            password=generate_password_hash(password)
        )
        
        db.session.add(user)
        db.session.commit()

        # Create access token
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=datetime.timedelta(hours=24)
        )

        return jsonify({
            "token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Registration failed: {str(e)}"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Validate required fields
        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        # Find user
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password, password):
            return jsonify({"message": "Invalid email or password"}), 401

        # Create access token
        access_token = create_access_token(
            identity=str(user.id),
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
        
    except Exception as e:
        return jsonify({"message": f"Login failed: {str(e)}"}), 500


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    try:
        # Note: JWT is stateless, so we can't invalidate tokens on the server
        # without using a token blacklist. We'll just return success and let
        # the frontend remove the token from storage.
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        return jsonify({"message": f"Logout failed: {str(e)}"}), 500


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"message": "User not found"}), 404

        return jsonify({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get user: {str(e)}"}), 500


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"message": "User not found"}), 404

        data = request.get_json() or {}
        
        # Update username if provided and not taken
        if "username" in data and data["username"]:
            new_username = data["username"].strip()
            if new_username != user.username:
                existing_user = User.query.filter_by(username=new_username).first()
                if existing_user and existing_user.id != user.id:
                    return jsonify({"message": "Username already taken"}), 409
                user.username = new_username
        
        # Update email if provided and not taken
        if "email" in data and data["email"]:
            new_email = data["email"].strip().lower()
            if new_email != user.email:
                if not validate_email(new_email):
                    return jsonify({"message": "Invalid email format"}), 400
                
                existing_user = User.query.filter_by(email=new_email).first()
                if existing_user and existing_user.id != user.id:
                    return jsonify({"message": "Email already in use"}), 409
                user.email = new_email
        
        # Update password if provided
        if "currentPassword" in data and "newPassword" in data:
            current_password = data.get("currentPassword", "")
            new_password = data.get("newPassword", "")
            
            if not check_password_hash(user.password, current_password):
                return jsonify({"message": "Current password is incorrect"}), 401
            
            # Validate new password strength
            password_errors = validate_password_strength(new_password)
            if password_errors:
                return jsonify({
                    "message": "New password validation failed",
                    "errors": password_errors
                }), 400
            
            user.password = generate_password_hash(new_password)
        
        db.session.commit()
        
        return jsonify({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update profile: {str(e)}"}), 500


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        
        if not email:
            return jsonify({"message": "Email is required"}), 400
        
        if not validate_email(email):
            return jsonify({"message": "Invalid email format"}), 400
        
        user = User.query.filter_by(email=email).first()
        
        # Always return success even if email doesn't exist (for security)
        if user:
            # Generate reset token (valid for 1 hour)
            serializer = get_reset_token_serializer()
            reset_token = serializer.dumps(user.email, salt='password-reset-salt')
            
            # In a real application, you would send an email here
            # For now, we'll return the token in development
            reset_link = f"{request.host_url}reset-password?token={reset_token}"
            
            # Log the reset link for development
            current_app.logger.info(f"Password reset link for {email}: {reset_link}")
            
            # TODO: Send email with reset link
            # send_reset_email(user.email, reset_link)
        
        return jsonify({
            "message": "If your email exists in our system, you will receive a password reset link"
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to process request: {str(e)}"}), 500


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json() or {}
        token = data.get("token", "")
        new_password = data.get("newPassword", "")
        
        if not token or not new_password:
            return jsonify({"message": "Token and new password are required"}), 400
        
        # Validate password strength
        password_errors = validate_password_strength(new_password)
        if password_errors:
            return jsonify({
                "message": "Password validation failed",
                "errors": password_errors
            }), 400
        
        # Verify token
        serializer = get_reset_token_serializer()
        try:
            email = serializer.loads(token, salt='password-reset-salt', max_age=3600)  # 1 hour expiry
        except SignatureExpired:
            return jsonify({"message": "Reset token has expired"}), 400
        except BadSignature:
            return jsonify({"message": "Invalid reset token"}), 400
        
        # Find user and update password
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        user.password = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({"message": "Password has been reset successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to reset password: {str(e)}"}), 500


@auth_bp.route("/verify", methods=["GET"])
@jwt_required()
def verify_token():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"valid": False}), 401
        
        return jsonify({
            "valid": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 200
        
    except Exception as e:
        return jsonify({"valid": False, "message": str(e)}), 401


# Optional: Add endpoint to check if email/username is available
@auth_bp.route("/check-availability", methods=["POST"])
def check_availability():
    try:
        data = request.get_json() or {}
        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        
        result = {
            "username_available": True,
            "email_available": True
        }
        
        if username:
            existing = User.query.filter_by(username=username).first()
            result["username_available"] = not existing
        
        if email:
            if not validate_email(email):
                result["email_available"] = False
                result["email_message"] = "Invalid email format"
            else:
                existing = User.query.filter_by(email=email).first()
                result["email_available"] = not existing
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to check availability: {str(e)}"}), 500