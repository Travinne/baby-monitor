from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from baby_backend.database import db
from baby_backend.models import Bath, BabyProfile
from datetime import datetime

bath_bp = Blueprint('bath_bp', __name__)


@bath_bp.route('/<int:baby_id>', methods=['GET'])
@jwt_required()
def get_baths(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Baby not found"}), 404

    baths = Bath.query.filter_by(baby_id=baby_id).all()
    return jsonify([
        {
            'id': b.id,
            'notes': b.notes,
            'time': b.time,
            'added_on': b.added_on.strftime("%Y-%m-%d %H:%M:%S") if hasattr(b, 'added_on') else None
        } for b in baths
    ]), 200


@bath_bp.route('/<int:baby_id>', methods=['POST'])
@jwt_required()
def add_bath(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Baby not found"}), 404

    data = request.get_json()
    new_bath = Bath(
        baby_id=baby_id,
        notes=data.get('notes', ''),
        time=data.get('time', datetime.now().strftime("%H:%M"))
    )
    db.session.add(new_bath)
    db.session.commit()
    return jsonify({
        'id': new_bath.id,
        'notes': new_bath.notes,
        'time': new_bath.time
    }), 201



@bath_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_bath(id):
    user_id = get_jwt_identity()
    bath = Bath.query.get_or_404(id)

    baby = BabyProfile.query.filter_by(id=bath.baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Unauthorized"}), 403

    db.session.delete(bath)
    db.session.commit()
    return jsonify({"message": "Bath entry deleted successfully"}), 200
