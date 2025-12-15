from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from database import db
from models import Diaper, BabyProfile

diaper_bp = Blueprint('diaper_bp', __name__)

@diaper_bp.route('/<int:baby_id>', methods=['GET'])
def get_diapers(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    diapers = Diaper.query.filter_by(baby_id=baby_id).all()
    return jsonify([
        {
            'id': d.id,
            'mess_type': d.mess_type,
            'notes': d.notes,
            'time': d.time
        } for d in diapers
    ]), 200

@diaper_bp.route('/<int:baby_id>', methods=['POST'])
def add_diaper(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    data = request.get_json()
    new_diaper = Diaper(
        baby_id=baby_id,
        mess_type=data.get('mess_type', ''),
        notes=data.get('notes', ''),
        time=data.get('time', '')
    )
    db.session.add(new_diaper)
    db.session.commit()
    return jsonify({'message': 'Diaper entry added successfully'}), 201

@diaper_bp.route('/<int:baby_id>/<int:id>', methods=['DELETE'])
def delete_diaper(baby_id, id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({'message': 'Baby not found'}), 404

    diaper = Diaper.query.filter_by(id=id, baby_id=baby_id).first()
    if not diaper:
        return jsonify({'message': 'Diaper entry not found'}), 404

    db.session.delete(diaper)
    db.session.commit()
    return jsonify({'message': 'Diaper entry deleted successfully'}), 200
