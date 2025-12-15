from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from database import db
from models import Feeding, BabyProfile

feed_bp = Blueprint('feed_bp', __name__)

@feed_bp.route('/<int:baby_id>', methods=['GET'])
def get_feedings(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    feedings = Feeding.query.filter_by(baby_id=baby_id).all()
    return jsonify([
        {
            'id': f.id,
            'feedType': f.feed_type,
            'amount': f.amount,
            'notes': f.notes,
            'time': f.time
        } for f in feedings
    ]), 200

@feed_bp.route('/<int:baby_id>', methods=['POST'])
def add_feeding(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    data = request.get_json()
    new_feeding = Feeding(
        baby_id=baby_id,
        feed_type=data.get('feedType', ''),
        amount=data.get('amount', ''),
        notes=data.get('notes', ''),
        time=data.get('time', '')
    )
    db.session.add(new_feeding)
    db.session.commit()
    return jsonify({'message': 'Feeding entry added successfully'}), 201

@feed_bp.route('/<int:baby_id>/<int:id>', methods=['DELETE'])
def delete_feeding(baby_id, id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    feeding = Feeding.query.filter_by(id=id, baby_id=baby_id).first()
    if not feeding:
        return jsonify({'message': 'Feeding entry not found'}), 404

    db.session.delete(feeding)
    db.session.commit()
    return jsonify({'message': 'Feeding entry deleted successfully'}), 200
