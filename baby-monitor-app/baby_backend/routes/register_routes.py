from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from baby_backend.models import User
from baby_backend.database import db
import jwt
import datetime
import os

register_bp = Blueprint('register_bp', __name__)

@register_bp.route('', methods=['POST'])
def register_user():
    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    if not username or not email or not password or not confirm_password:
        return jsonify({'message': 'All fields are required'}), 400

    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 409

    hashed_password = generate_password_hash(password)

    user = User(
        username=username,
        email=email,
        password=hashed_password
    )

    db.session.add(user)
    db.session.commit()

    jwt_secret = os.environ.get('JWT_SECRET', 'dev-secret')

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, jwt_secret, algorithm='HS256')

    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 201
