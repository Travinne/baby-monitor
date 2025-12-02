from flask import Blueprint, request, jsonify
from baby_backend.database import db
from ..models import Sleep

sleep_bp = Blueprint('sleep_bp', __name__)

@sleep_bp.route('/', methods=['GET'])
def get_sleeps():
    sleeps = Sleep.query.all()
    return jsonify([
        {
            'id': s.id,
            'duration': s.duration,
            'start_time': s.start_time,
            'end_time': s.end_time,
            'notes': s.notes
        } for s in sleeps
    ])

@sleep_bp.route('/', methods=['POST'])
def add_sleep():
    data = request.get_json()
    new_sleep = Sleep(
        duration=data.get('duration', ''),
        start_time=data.get('start_time', ''),
        end_time=data.get('end_time', ''),
        notes=data.get('notes', '')
    )
    db.session.add(new_sleep)
    db.session.commit()
    return jsonify({'message': 'Sleep entry added successfully'}), 201

@sleep_bp.route('/<int:id>', methods=['DELETE'])
def delete_sleep(id):
    sleep = Sleep.query.get_or_404(id)
    db.session.delete(sleep)
    db.session.commit()
    return jsonify({'message': 'Sleep entry deleted successfully'})
