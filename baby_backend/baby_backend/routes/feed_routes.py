from flask import Blueprint, request, jsonify
from baby_backend.database import db
from baby_backend.models import Feeding

feed_bp = Blueprint('feed_bp', __name__)

@feed_bp.route('/', methods=['GET'])
def get_feedings():
    feedings = Feeding.query.all()
    return jsonify([
        {
            'id': f.id,
            'feedType': f.feed_type,
            'amount': f.amount,
            'notes': f.notes,
            'time': f.time
        } for f in feedings
    ])

@feed_bp.route('/', methods=['POST'])
def add_feeding():
    data = request.get_json()
    new_feeding = Feeding(
        feed_type=data.get('feedType', ''),
        amount=data.get('amount', ''),
        notes=data.get('notes', ''),
        time=data.get('time', '')
    )
    db.session.add(new_feeding)
    db.session.commit()
    return jsonify({'message': 'Feeding entry added successfully'}), 201

@feed_bp.route('/<int:id>', methods=['DELETE'])
def delete_feeding(id):
    feeding = Feeding.query.get_or_404(id)
    db.session.delete(feeding)
    db.session.commit()
    return jsonify({'message': 'Feeding entry deleted successfully'})
