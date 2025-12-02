from flask import Blueprint, request, jsonify
from baby_backend.database import db
from baby_backend.models import Bath

bath_bp = Blueprint('bath_bp', __name__)

@bath_bp.route('/', methods=['GET'])
def get_baths():
    baths = Bath.query.all()
    return jsonify([
        {'id': b.id, 'notes': b.notes, 'time': b.time}
        for b in baths
    ])

@bath_bp.route('/', methods=['POST'])
def add_bath():
    data = request.get_json()
    new_bath = Bath(
        notes=data.get('notes', ''),
        time=data.get('time', '')
    )
    db.session.add(new_bath)
    db.session.commit()
    return jsonify({'message': 'Bath entry added successfully'}), 201

@bath_bp.route('/<int:id>', methods=['DELETE'])
def delete_bath(id):
    bath = Bath.query.get_or_404(id)
    db.session.delete(bath)
    db.session.commit()
    return jsonify({'message': 'Bath entry deleted successfully'})
