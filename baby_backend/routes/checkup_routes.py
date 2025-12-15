from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from baby_backend.database import db
from baby_backend.models import Checkup, BabyProfile
from datetime import datetime

checkup_bp = Blueprint('checkup_bp', __name__)


@checkup_bp.route('/<int:baby_id>', methods=['GET'])
@jwt_required()
def get_checkups(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Baby not found"}), 404

    checkups = Checkup.query.filter_by(baby_id=baby_id).all()
    return jsonify([
        {
            'id': c.id,
            'doctor_name': c.doctor_name,
            'reason': c.reason,
            'date': c.date,
            'notes': c.notes
        } for c in checkups
    ]), 200



@checkup_bp.route('/<int:baby_id>', methods=['POST'])
@jwt_required()
def add_checkup(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Baby not found"}), 404

    data = request.get_json()
    new_checkup = Checkup(
        baby_id=baby_id,
        doctor_name=data.get('doctor_name', ''),
        reason=data.get('reason', ''),
        date=data.get('date', datetime.now().strftime("%Y-%m-%d")),
        notes=data.get('notes', '')
    )
    db.session.add(new_checkup)
    db.session.commit()
    return jsonify({
        'id': new_checkup.id,
        'doctor_name': new_checkup.doctor_name,
        'reason': new_checkup.reason,
        'date': new_checkup.date,
        'notes': new_checkup.notes
    }), 201



@checkup_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_checkup(id):
    user_id = get_jwt_identity()
    checkup = Checkup.query.get_or_404(id)


    baby = BabyProfile.query.filter_by(id=checkup.baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Unauthorized"}), 403

    db.session.delete(checkup)
    db.session.commit()
    return jsonify({"message": "Checkup deleted successfully"}), 200
