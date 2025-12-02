from flask import Blueprint, request, jsonify
from baby_backend.database import db
from baby_backend.models import Growth

growth_bp = Blueprint('growth_bp', __name__)

@growth_bp.route('/', methods=['GET'])
def get_growth_records():
    growth_records = Growth.query.all()
    return jsonify([
        {
            'id': g.id,
            'weight': g.weight,
            'height': g.height,
            'head_circumference': g.head_circumference,
            'notes': g.notes,
            'time': g.time
        } for g in growth_records
    ])

@growth_bp.route('/', methods=['POST'])
def add_growth_record():
    data = request.get_json()
    new_growth = Growth(
        weight=data.get('weight', ''),
        height=data.get('height', ''),
        head_circumference=data.get('head_circumference', ''),
        notes=data.get('notes', ''),
        time=data.get('time', '')
    )
    db.session.add(new_growth)
    db.session.commit()
    return jsonify({'message': 'Growth record added successfully'}), 201

@growth_bp.route('/<int:id>', methods=['DELETE'])
def delete_growth_record(id):
    growth = Growth.query.get_or_404(id)
    db.session.delete(growth)
    db.session.commit()
    return jsonify({'message': 'Growth record deleted successfully'})
