from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Allergy, BabyProfile

allergies_bp = Blueprint('allergies_bp', __name__)

# Get all allergies for a specific baby
@allergies_bp.route('/<int:baby_id>', methods=['GET'])
@jwt_required()
def get_allergies(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Baby not found"}), 404

    allergies = Allergy.query.filter_by(baby_id=baby_id).all()
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


# Add a new allergy for a baby
@allergies_bp.route('/<int:baby_id>', methods=['POST'])
@jwt_required()
def add_allergy(baby_id):
    user_id = get_jwt_identity()
    baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Baby not found"}), 404

    data = request.get_json()

    new_allergy = Allergy(
        baby_id=baby_id,
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


# Update an allergy
@allergies_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_allergy(id):
    user_id = get_jwt_identity()
    allergy = Allergy.query.get_or_404(id)

    # Ensure allergy belongs to user's baby
    baby = BabyProfile.query.filter_by(id=allergy.baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    allergy.name = data.get('name', allergy.name)
    allergy.severity = data.get('severity', allergy.severity)
    allergy.reaction = data.get('reaction', allergy.reaction)
    allergy.notes = data.get('notes', allergy.notes)
    allergy.diagnosed_date = data.get('diagnosed_date', allergy.diagnosed_date)

    db.session.commit()
    return jsonify({"message": "Allergy updated successfully"}), 200


# Delete an allergy
@allergies_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_allergy(id):
    user_id = get_jwt_identity()
    allergy = Allergy.query.get_or_404(id)

    # Ensure allergy belongs to user's baby
    baby = BabyProfile.query.filter_by(id=allergy.baby_id, user_id=user_id).first()
    if not baby:
        return jsonify({"message": "Unauthorized"}), 403

    db.session.delete(allergy)
    db.session.commit()
    return jsonify({"message": "Allergy deleted successfully"}), 200
