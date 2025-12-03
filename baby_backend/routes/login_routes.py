from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from baby_backend.models import User
from baby_backend.database import db
import jwt
import datetime

login_bp = Blueprint('login_bp', __name__)

@login_bp.route('', methods=['POST'])
def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid username or password'}), 401


    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, 'secret_key', algorithm='HS256')

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {'id': user.id, 'username': user.username, 'email': user.email}
    }), 200
