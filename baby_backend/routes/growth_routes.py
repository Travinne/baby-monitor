from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from baby_backend.database import db
from baby_backend.models import Growth, BabyProfile

growth_bp = Blueprint('growth_bp', __name__)

@growth_bp.route('/<int:baby_id>', methods=['GET'])
def get_growth_records(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    growth_records = Growth.query.filter_by(baby_id=baby_id).all()
    return jsonify([
        {
            'id': g.id,
            'weight': g.weight,
            'height': g.height,
            'head_circumference': g.head_circumference,
            'notes': g.notes,
            'time': g.time
        } for g in growth_records
    ]), 200

@growth_bp.route('/<int:baby_id>', methods=['POST'])
def add_growth_record(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    data = request.get_json()
    new_growth = Growth(
        baby_id=baby_id,
        weight=data.get('weight', ''),
        height=data.get('height', ''),
        head_circumference=data.get('head_circumference', ''),
        notes=data.get('notes', ''),
        time=data.get('time', '')
    )
    db.session.add(new_growth)
    db.session.commit()
    return jsonify({'message': 'Growth record added successfully'}), 201

@growth_bp.route('/<int:baby_id>/<int:id>', methods=['DELETE'])
def delete_growth_record(baby_id, id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    growth = Growth.query.filter_by(id=id, baby_id=baby_id).first()
    if not growth:
        return jsonify({'message': 'Growth record not found'}), 404

    db.session.delete(growth)
    db.session.commit()
    return jsonify({'message': 'Growth record deleted successfully'}), 200
