from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from baby_backend.database import db
from ..models import Allergy, BabyProfile

allergies_bp = Blueprint('allergies_bp', __name__)

# Get all allergies for a specific baby
@allergies_bp.route('/baby/<int:baby_id>', methods=['GET'])
@jwt_required()
def get_allergies(baby_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({
                "success": False,
                "message": "Baby not found or access denied"
            }), 404

        allergies = Allergy.query.filter_by(baby_id=baby_id).all()
        
        return jsonify({
            "success": True,
            "data": [
                {
                    'id': a.id,
                    'name': a.name,
                    'severity': a.severity,
                    'reaction': a.reaction,
                    'notes': a.notes,
                    'diagnosed_date': a.diagnosed_date.isoformat() if a.diagnosed_date else None,
                    'added_on': a.added_on.isoformat() if a.added_on else None
                } for a in allergies
            ],
            "count": len(allergies)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500


# Add a new allergy for a baby
@allergies_bp.route('/baby/<int:baby_id>', methods=['POST'])
@jwt_required()
def add_allergy(baby_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({
                "success": False,
                "message": "Baby not found or access denied"
            }), 404

        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'severity']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "message": f"{field.replace('_', ' ').title()} is required"
                }), 400
        
        # Parse diagnosed_date if provided
        diagnosed_date = None
        if data.get('diagnosed_date'):
            try:
                diagnosed_date = datetime.fromisoformat(data['diagnosed_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    "success": False,
                    "message": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)"
                }), 400

        new_allergy = Allergy(
            baby_id=baby_id,
            name=data['name'],
            severity=data['severity'],
            reaction=data.get('reaction', ''),
            notes=data.get('notes', ''),
            diagnosed_date=diagnosed_date
        )

        db.session.add(new_allergy)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Allergy added successfully",
            "data": {
                'id': new_allergy.id,
                'name': new_allergy.name,
                'severity': new_allergy.severity,
                'reaction': new_allergy.reaction,
                'notes': new_allergy.notes,
                'diagnosed_date': new_allergy.diagnosed_date.isoformat() if new_allergy.diagnosed_date else None,
                'added_on': new_allergy.added_on.isoformat() if new_allergy.added_on else None
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500


# Update an allergy
@allergies_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_allergy(id):
    try:
        user_id = get_jwt_identity()
        
        # Get allergy
        allergy = Allergy.query.get(id)
        if not allergy:
            return jsonify({
                "success": False,
                "message": "Allergy not found"
            }), 404

        # Verify allergy belongs to user's baby
        baby = BabyProfile.query.filter_by(id=allergy.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        data = request.get_json()
        
        # Validate required fields if provided
        if 'name' in data and not data['name']:
            return jsonify({
                "success": False,
                "message": "Name cannot be empty"
            }), 400
            
        if 'severity' in data and not data['severity']:
            return jsonify({
                "success": False,
                "message": "Severity cannot be empty"
            }), 400
        
        # Update fields
        if 'name' in data:
            allergy.name = data['name']
        if 'severity' in data:
            allergy.severity = data['severity']
        if 'reaction' in data:
            allergy.reaction = data['reaction']
        if 'notes' in data:
            allergy.notes = data['notes']
        
        # Parse diagnosed_date if provided
        if 'diagnosed_date' in data:
            if data['diagnosed_date']:
                try:
                    allergy.diagnosed_date = datetime.fromisoformat(data['diagnosed_date'].replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({
                        "success": False,
                        "message": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)"
                    }), 400
            else:
                allergy.diagnosed_date = None

        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Allergy updated successfully",
            "data": {
                'id': allergy.id,
                'name': allergy.name,
                'severity': allergy.severity,
                'reaction': allergy.reaction,
                'notes': allergy.notes,
                'diagnosed_date': allergy.diagnosed_date.isoformat() if allergy.diagnosed_date else None,
                'added_on': allergy.added_on.isoformat() if allergy.added_on else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500


# Delete an allergy
@allergies_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_allergy(id):
    try:
        user_id = get_jwt_identity()
        
        # Get allergy
        allergy = Allergy.query.get(id)
        if not allergy:
            return jsonify({
                "success": False,
                "message": "Allergy not found"
            }), 404

        # Verify allergy belongs to user's baby
        baby = BabyProfile.query.filter_by(id=allergy.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        db.session.delete(allergy)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Allergy deleted successfully",
            "deleted_id": id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500


# Get a single allergy by ID
@allergies_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_allergy(id):
    try:
        user_id = get_jwt_identity()
        
        # Get allergy
        allergy = Allergy.query.get(id)
        if not allergy:
            return jsonify({
                "success": False,
                "message": "Allergy not found"
            }), 404

        # Verify allergy belongs to user's baby
        baby = BabyProfile.query.filter_by(id=allergy.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        return jsonify({
            "success": True,
            "data": {
                'id': allergy.id,
                'name': allergy.name,
                'severity': allergy.severity,
                'reaction': allergy.reaction,
                'notes': allergy.notes,
                'diagnosed_date': allergy.diagnosed_date.isoformat() if allergy.diagnosed_date else None,
                'added_on': allergy.added_on.isoformat() if allergy.added_on else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500