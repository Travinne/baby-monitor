from flask import Blueprint, request, jsonify
from baby_backend.database import db
from baby_backend.models import Checkup

checkup_bp = Blueprint('checkup_bp', __name__)

@checkup_bp.route('/', methods=['GET'])
def get_checkups():
    checkups = Checkup.query.all()
    return jsonify([
        {
            'id': c.id,
            'doctor_name': c.doctor_name,
            'reason': c.reason,
            'date': c.date
        } for c in checkups
    ])

@checkup_bp.route('/', methods=['POST'])
def add_checkup():
    data = request.get_json()
    new_checkup = Checkup(
        doctor_name=data.get('doctor_name', ''),
        reason=data.get('reason', ''),
        date=data.get('date', '')
    )
    db.session.add(new_checkup)
    db.session.commit()
    return jsonify({'message': 'Checkup record added successfully'}), 201

@checkup_bp.route('/<int:id>', methods=['DELETE'])
def delete_checkup(id):
    checkup = Checkup.query.get_or_404(id)
    db.session.delete(checkup)
    db.session.commit()
    return jsonify({'message': 'Checkup deleted successfully'})
