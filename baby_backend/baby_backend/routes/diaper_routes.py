from flask import Blueprint, request, jsonify
from baby_backend.database import db
from baby_backend.models import Diaper

diaper_bp = Blueprint('diaper_bp', __name__)

@diaper_bp.route('/', methods=['GET'])
def get_diapers():
    diapers = Diaper.query.all()
    return jsonify([
        {
            'id': d.id,
            'mess_type': d.mess_type,
            'notes': d.notes,
            'time': d.time
        } for d in diapers
    ])

@diaper_bp.route('/', methods=['POST'])
def add_diaper():
    data = request.get_json()
    new_diaper = Diaper(
        mess_type=data.get('mess_type', ''),
        notes=data.get('notes', ''),
        time=data.get('time', '')
    )
    db.session.add(new_diaper)
    db.session.commit()
    return jsonify({'message': 'Diaper entry added successfully'}), 201

@diaper_bp.route('/<int:id>', methods=['DELETE'])
def delete_diaper(id):
    diaper = Diaper.query.get_or_404(id)
    db.session.delete(diaper)
    db.session.commit()
    return jsonify({'message': 'Diaper entry deleted successfully'})
