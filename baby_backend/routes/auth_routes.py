from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from baby_backend.database import db
from baby_backend.models import User
import jwt
import datetime
from flask import current_app

auth_bp = Blueprint('auth', __name__,)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'message': 'User already exists'}), 409

    hashed_password = generate_password_hash(password)
    user = User(username=username, email=email, password=hashed_password)
    db.session.add(user)
    db.session.commit()

    token = jwt.encode(
        {
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=3)
        },
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    return jsonify({'message': 'User registered successfully', 'token': token, 'user': {
        'id': user.id,
        'username': user.username,
        'email': user.email
    }}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid username or password'}), 401

    token = jwt.encode(
        {
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=3)
        },
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    return jsonify({'message': 'Login successful', 'token': token, 'user': {
        'id': user.id,
        'username': user.username,
        'email': user.email
    }}), 200



@auth_bp.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({'message': 'User deleted successfully'}), 200
