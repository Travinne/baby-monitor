from flask import Blueprint, request, jsonify
from baby_backend.database import db
from baby_backend.models import Allergy
from datetime import datetime

allergies_bp = Blueprint('allergies_bp', __name__)

@allergies_bp.route('/', methods=['GET'])
def get_allergies():
    allergies = Allergy.query.all()
    return jsonify([
        {
            'id': a.id,
            'name': a.name,
            'severity': a.severity,
            'reaction': a.reaction,
            'notes': a.notes,
            'diagnosed_date': a.diagnosed_date,
            'added_on': a.added_on.strftime("%Y-%m-%d %H:%M:%S")
        } for a in allergies
    ]), 200


@allergies_bp.route('/', methods=['POST'])
def add_allergy():
    data = request.get_json()

    new_allergy = Allergy(
        name=data.get('name'),
        severity=data.get('severity'),
        reaction=data.get('reaction', 'Not specified'),
        notes=data.get('notes', ''),
        diagnosed_date=data.get('diagnosed_date', 'Not specified')
    )

    db.session.add(new_allergy)
    db.session.commit()

    return jsonify({
        'id': new_allergy.id,
        'name': new_allergy.name,
        'severity': new_allergy.severity,
        'reaction': new_allergy.reaction,
        'notes': new_allergy.notes,
        'diagnosed_date': new_allergy.diagnosed_date,
        'added_on': new_allergy.added_on.strftime("%Y-%m-%d %H:%M:%S")
    }), 201


@allergies_bp.route('/<int:id>', methods=['PUT'])
def update_allergy(id):
    allergy = Allergy.query.get_or_404(id)
    data = request.get_json()

    allergy.name = data.get('name', allergy.name)
    allergy.severity = data.get('severity', allergy.severity)
    allergy.reaction = data.get('reaction', allergy.reaction)
    allergy.notes = data.get('notes', allergy.notes)
    allergy.diagnosed_date = data.get('diagnosed_date', allergy.diagnosed_date)

    db.session.commit()
    return jsonify({"message": "Allergy updated successfully"}), 200


@allergies_bp.route('/<int:id>', methods=['DELETE'])
def delete_allergy(id):
    allergy = Allergy.query.get_or_404(id)
    db.session.delete(allergy)
    db.session.commit()
    return jsonify({"message": "Allergy deleted successfully"}), 200
