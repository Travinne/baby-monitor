from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Sleep, BabyProfile

sleep_bp = Blueprint('sleep_bp', __name__)

@sleep_bp.route('/', methods=['GET'])
@jwt_required()
def get_sleeps():
    user_id = get_jwt_identity()
    baby_id = request.args.get('baby_id')
    if not baby_id:
        return jsonify({"message": "Baby ID is required"}), 400

    sleeps = Sleep.query.filter_by(baby_id=baby_id).all()
    return jsonify([
        {
            'id': s.id,
            'duration': s.duration,
            'start_time': s.start_time,
            'end_time': s.end_time,
            'notes': s.notes
        } for s in sleeps
    ]), 200

@sleep_bp.route('/', methods=['POST'])
@jwt_required()
def add_sleep():
    user_id = get_jwt_identity()
    data = request.get_json()
    baby_id = data.get('baby_id')
    if not baby_id:
        return jsonify({"message": "Baby ID is required"}), 400

    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Baby not found or unauthorized"}), 404

    new_sleep = Sleep(
        baby_id=baby_id,
        duration=data.get('duration', ''),
        start_time=data.get('start_time', ''),
        end_time=data.get('end_time', ''),
        notes=data.get('notes', '')
    )
    db.session.add(new_sleep)
    db.session.commit()
    return jsonify({'message': 'Sleep entry added successfully'}), 201

@sleep_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_sleep(id):
    user_id = get_jwt_identity()
    sleep = Sleep.query.get_or_404(id)
    baby = BabyProfile.query.filter_by(id=sleep.baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Unauthorized"}), 403

    db.session.delete(sleep)
    db.session.commit()
    return jsonify({'message': 'Sleep entry deleted successfully'}), 200
