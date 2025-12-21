from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import uuid
from datetime import datetime
from baby_backend.database import db
from ..models import BabyProfile, Growth, Vaccination, Milestone

baby_bp = Blueprint("baby_bp", __name__)

# Allowed image extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(file):
    """Save uploaded image and return the filename"""
    if not file or file.filename == '':
        return None
    
    if not allowed_file(file.filename):
        return None
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    
    # Create upload directory if it doesn't exist
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads/baby_photos')
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    return unique_filename

# Baby Profile Endpoints
@baby_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_baby_profile():
    try:
        user_id = get_jwt_identity()
        
        # Get all babies for the current user
        babies = BabyProfile.query.filter_by(user_id=user_id).all()
        
        if not babies:
            return jsonify({
                "message": "No baby profiles found"
            }), 200
        
        # Return list of babies
        return jsonify([
            {
                "id": baby.id,
                "name": baby.name,
                "dateOfBirth": baby.date_of_birth.isoformat() if baby.date_of_birth else None,
                "gender": baby.gender,
                "weight": float(baby.weight) if baby.weight else None,
                "height": float(baby.height) if baby.height else None,
                "headCircumference": float(baby.head_circumference) if baby.head_circumference else None,
                "photo": f"/uploads/baby_photos/{baby.photo}" if baby.photo else None,
                "notes": baby.notes,
                "createdAt": baby.created_at.isoformat() if baby.created_at else None,
                "updatedAt": baby.updated_at.isoformat() if baby.updated_at else None
            } for baby in babies
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get baby profiles: {str(e)}"}), 500

@baby_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_baby_profile():
    try:
        user_id = get_jwt_identity()
        data = request.form
        
        # Validate required fields
        required_fields = ['name', 'dateOfBirth']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"message": f"{field} is required"}), 400
        
        # Check if user already has a baby with same name
        existing_baby = BabyProfile.query.filter_by(
            user_id=user_id, 
            name=data.get('name').strip()
        ).first()
        
        if existing_baby:
            return jsonify({"message": "A baby with this name already exists"}), 409
        
        # Parse date of birth
        try:
            dob = datetime.fromisoformat(data.get('dateOfBirth').replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"message": "Invalid date format"}), 400
        
        # Handle photo upload
        photo_filename = None
        if 'photo' in request.files:
            photo_file = request.files['photo']
            photo_filename = save_image(photo_file)
        
        # Create baby profile
        baby = BabyProfile(
            user_id=user_id,
            name=data.get('name').strip(),
            date_of_birth=dob,
            gender=data.get('gender'),
            weight=data.get('weight'),
            height=data.get('height'),
            head_circumference=data.get('headCircumference'),
            photo=photo_filename,
            notes=data.get('notes', '')
        )
        
        db.session.add(baby)
        db.session.commit()
        
        return jsonify({
            "id": baby.id,
            "name": baby.name,
            "dateOfBirth": baby.date_of_birth.isoformat() if baby.date_of_birth else None,
            "gender": baby.gender,
            "weight": float(baby.weight) if baby.weight else None,
            "height": float(baby.height) if baby.height else None,
            "headCircumference": float(baby.head_circumference) if baby.head_circumference else None,
            "photo": f"/uploads/baby_photos/{baby.photo}" if baby.photo else None,
            "notes": baby.notes,
            "createdAt": baby.created_at.isoformat() if baby.created_at else None,
            "updatedAt": baby.updated_at.isoformat() if baby.updated_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to create baby profile: {str(e)}"}), 500

@baby_bp.route("/profile/<int:baby_id>", methods=["PUT"])
@jwt_required()
def update_baby_profile(baby_id):
    try:
        user_id = get_jwt_identity()
        
        # Get baby profile
        baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby profile not found"}), 404
        
        data = request.form
        
        # Update fields
        if 'name' in data and data['name']:
            baby.name = data['name'].strip()
        
        if 'dateOfBirth' in data and data['dateOfBirth']:
            try:
                baby.date_of_birth = datetime.fromisoformat(data['dateOfBirth'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid date format"}), 400
        
        if 'gender' in data:
            baby.gender = data['gender']
        
        if 'weight' in data:
            baby.weight = data['weight'] if data['weight'] else None
        
        if 'height' in data:
            baby.height = data['height'] if data['height'] else None
        
        if 'headCircumference' in data:
            baby.head_circumference = data['headCircumference'] if data['headCircumference'] else None
        
        if 'notes' in data:
            baby.notes = data['notes']
        
        # Handle photo upload
        if 'photo' in request.files:
            photo_file = request.files['photo']
            if photo_file.filename:
                photo_filename = save_image(photo_file)
                if photo_filename:
                    # Delete old photo if exists
                    if baby.photo:
                        old_photo_path = os.path.join(
                            current_app.config.get('UPLOAD_FOLDER', 'uploads/baby_photos'),
                            baby.photo
                        )
                        if os.path.exists(old_photo_path):
                            os.remove(old_photo_path)
                    baby.photo = photo_filename
        
        db.session.commit()
        
        return jsonify({
            "id": baby.id,
            "name": baby.name,
            "dateOfBirth": baby.date_of_birth.isoformat() if baby.date_of_birth else None,
            "gender": baby.gender,
            "weight": float(baby.weight) if baby.weight else None,
            "height": float(baby.height) if baby.height else None,
            "headCircumference": float(baby.head_circumference) if baby.head_circumference else None,
            "photo": f"/uploads/baby_photos/{baby.photo}" if baby.photo else None,
            "notes": baby.notes,
            "createdAt": baby.created_at.isoformat() if baby.created_at else None,
            "updatedAt": baby.updated_at.isoformat() if baby.updated_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update baby profile: {str(e)}"}), 500

# Upload photo separately
@baby_bp.route("/upload-photo", methods=["POST"])
@jwt_required()
def upload_baby_photo():
    try:
        user_id = get_jwt_identity()
        baby_id = request.form.get('baby_id')
        
        if not baby_id:
            return jsonify({"message": "Baby ID is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby profile not found"}), 404
        
        if 'photo' not in request.files:
            return jsonify({"message": "No photo provided"}), 400
        
        photo_file = request.files['photo']
        if not photo_file.filename:
            return jsonify({"message": "No photo selected"}), 400
        
        photo_filename = save_image(photo_file)
        if not photo_filename:
            return jsonify({"message": "Invalid image file"}), 400
        
        # Delete old photo if exists
        if baby.photo:
            old_photo_path = os.path.join(
                current_app.config.get('UPLOAD_FOLDER', 'uploads/baby_photos'),
                baby.photo
            )
            if os.path.exists(old_photo_path):
                os.remove(old_photo_path)
        
        baby.photo = photo_filename
        db.session.commit()
        
        return jsonify({
            "photoUrl": f"/uploads/baby_photos/{photo_filename}",
            "message": "Photo uploaded successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to upload photo: {str(e)}"}), 500

# Growth Records Endpoints
@baby_bp.route("/growth", methods=["GET"])
@jwt_required()
def get_growth_history():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get growth records for user's babies
        growth_records = Growth.query.filter(Growth.baby_id.in_(baby_ids)).all()
        
        return jsonify([
            {
                "id": record.id,
                "babyId": record.baby_id,
                "date": record.date.isoformat() if record.date else None,
                "weight": float(record.weight) if record.weight else None,
                "height": float(record.height) if record.height else None,
                "headCircumference": float(record.head_circumference) if record.head_circumference else None,
                "notes": record.notes,
                "createdAt": record.created_at.isoformat() if record.created_at else None
            } for record in growth_records
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get growth history: {str(e)}"}), 500

@baby_bp.route("/growth/<int:id>", methods=["GET"])
@jwt_required()
def get_growth_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get growth record
        record = Growth.query.get(id)
        if not record:
            return jsonify({"message": "Growth record not found"}), 404
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=record.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        return jsonify({
            "id": record.id,
            "babyId": record.baby_id,
            "date": record.date.isoformat() if record.date else None,
            "weight": float(record.weight) if record.weight else None,
            "height": float(record.height) if record.height else None,
            "headCircumference": float(record.head_circumference) if record.head_circumference else None,
            "notes": record.notes,
            "createdAt": record.created_at.isoformat() if record.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get growth record: {str(e)}"}), 500

@baby_bp.route("/growth", methods=["POST"])
@jwt_required()
def add_growth_record():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse date
        try:
            record_date = datetime.fromisoformat(data.get('date').replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({"message": "Invalid date format"}), 400
        
        # Validate at least one measurement
        if not any(data.get(key) for key in ['weight', 'height', 'headCircumference']):
            return jsonify({"message": "At least one measurement is required"}), 400
        
        # Create growth record
        record = Growth(
            baby_id=data['babyId'],
            date=record_date,
            weight=data.get('weight'),
            height=data.get('height'),
            head_circumference=data.get('headCircumference'),
            notes=data.get('notes', '')
        )
        
        db.session.add(record)
        db.session.commit()
        
        return jsonify({
            "id": record.id,
            "babyId": record.baby_id,
            "date": record.date.isoformat() if record.date else None,
            "weight": float(record.weight) if record.weight else None,
            "height": float(record.height) if record.height else None,
            "headCircumference": float(record.head_circumference) if record.head_circumference else None,
            "notes": record.notes,
            "createdAt": record.created_at.isoformat() if record.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add growth record: {str(e)}"}), 500

@baby_bp.route("/growth/<int:id>", methods=["PUT"])
@jwt_required()
def update_growth_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get growth record
        record = Growth.query.get(id)
        if not record:
            return jsonify({"message": "Growth record not found"}), 404
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=record.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'date' in data and data['date']:
            try:
                record.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid date format"}), 400
        
        if 'weight' in data:
            record.weight = data['weight'] if data['weight'] else None
        
        if 'height' in data:
            record.height = data['height'] if data['height'] else None
        
        if 'headCircumference' in data:
            record.head_circumference = data['headCircumference'] if data['headCircumference'] else None
        
        if 'notes' in data:
            record.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            "id": record.id,
            "babyId": record.baby_id,
            "date": record.date.isoformat() if record.date else None,
            "weight": float(record.weight) if record.weight else None,
            "height": float(record.height) if record.height else None,
            "headCircumference": float(record.head_circumference) if record.head_circumference else None,
            "notes": record.notes,
            "createdAt": record.created_at.isoformat() if record.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update growth record: {str(e)}"}), 500

@baby_bp.route("/growth/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_growth_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get growth record
        record = Growth.query.get(id)
        if not record:
            return jsonify({"message": "Growth record not found"}), 404
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=record.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        db.session.delete(record)
        db.session.commit()
        
        return jsonify({"message": "Growth record deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete growth record: {str(e)}"}), 500

# Vaccination Endpoints
@baby_bp.route("/vaccinations", methods=["GET"])
@jwt_required()
def get_vaccination_history():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get vaccinations for user's babies
        vaccinations = Vaccination.query.filter(Vaccination.baby_id.in_(baby_ids)).all()
        
        return jsonify([
            {
                "id": v.id,
                "babyId": v.baby_id,
                "name": v.name,
                "date": v.date.isoformat() if v.date else None,
                "nextDueDate": v.next_due_date.isoformat() if v.next_due_date else None,
                "notes": v.notes,
                "status": v.status,
                "createdAt": v.created_at.isoformat() if v.created_at else None
            } for v in vaccinations
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get vaccination history: {str(e)}"}), 500

@baby_bp.route("/vaccinations", methods=["POST"])
@jwt_required()
def add_vaccination_record():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        if not data.get('name'):
            return jsonify({"message": "Vaccination name is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse dates
        vaccination_date = None
        next_due_date = None
        
        if data.get('date'):
            try:
                vaccination_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid date format"}), 400
        
        if data.get('nextDueDate'):
            try:
                next_due_date = datetime.fromisoformat(data['nextDueDate'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid next due date format"}), 400
        
        # Create vaccination record
        vaccination = Vaccination(
            baby_id=data['babyId'],
            name=data['name'],
            date=vaccination_date,
            next_due_date=next_due_date,
            notes=data.get('notes', ''),
            status=data.get('status', 'pending')
        )
        
        db.session.add(vaccination)
        db.session.commit()
        
        return jsonify({
            "id": vaccination.id,
            "babyId": vaccination.baby_id,
            "name": vaccination.name,
            "date": vaccination.date.isoformat() if vaccination.date else None,
            "nextDueDate": vaccination.next_due_date.isoformat() if vaccination.next_due_date else None,
            "notes": vaccination.notes,
            "status": vaccination.status,
            "createdAt": vaccination.created_at.isoformat() if vaccination.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add vaccination record: {str(e)}"}), 500

# Milestone Endpoints
@baby_bp.route("/milestones", methods=["GET"])
@jwt_required()
def get_milestones():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get milestones for user's babies
        milestones = Milestone.query.filter(Milestone.baby_id.in_(baby_ids)).all()
        
        return jsonify([
            {
                "id": m.id,
                "babyId": m.baby_id,
                "title": m.title,
                "description": m.description,
                "date": m.date.isoformat() if m.date else None,
                "category": m.category,
                "achieved": m.achieved,
                "createdAt": m.created_at.isoformat() if m.created_at else None
            } for m in milestones
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get milestones: {str(e)}"}), 500

@baby_bp.route("/milestones", methods=["POST"])
@jwt_required()
def add_milestone():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        if not data.get('title'):
            return jsonify({"message": "Title is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse date
        milestone_date = None
        if data.get('date'):
            try:
                milestone_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid date format"}), 400
        
        # Create milestone
        milestone = Milestone(
            baby_id=data['babyId'],
            title=data['title'],
            description=data.get('description', ''),
            date=milestone_date,
            category=data.get('category', 'general'),
            achieved=data.get('achieved', False)
        )
        
        db.session.add(milestone)
        db.session.commit()
        
        return jsonify({
            "id": milestone.id,
            "babyId": milestone.baby_id,
            "title": milestone.title,
            "description": milestone.description,
            "date": milestone.date.isoformat() if milestone.date else None,
            "category": milestone.category,
            "achieved": milestone.achieved,
            "createdAt": milestone.created_at.isoformat() if milestone.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add milestone: {str(e)}"}), 500

# Percentile Calculation Endpoint
@baby_bp.route("/percentile", methods=["POST"])
@jwt_required()
def calculate_percentile():
    try:
        data = request.get_json()
        
        # Validate input
        if not data.get('weight') and not data.get('height'):
            return jsonify({"message": "Weight or height is required"}), 400
        
        if not data.get('ageInMonths'):
            return jsonify({"message": "Age in months is required"}), 400
        
        # For demo purposes, return mock percentiles
        # In a real app, you would use WHO growth charts
        weight = data.get('weight')
        height = data.get('height')
        age_months = data.get('ageInMonths')
        
        # Mock percentile calculation
        percentiles = {
            "ageMonths": age_months,
            "weight": weight,
            "height": height,
            "weightPercentile": None,
            "heightPercentile": None,
            "weightForHeightPercentile": None
        }
        
        if weight:
            # Mock weight percentile calculation
            if age_months <= 12:
                percentiles["weightPercentile"] = 75.0
            elif age_months <= 24:
                percentiles["weightPercentile"] = 65.0
            else:
                percentiles["weightPercentile"] = 50.0
        
        if height:
            # Mock height percentile calculation
            if age_months <= 12:
                percentiles["heightPercentile"] = 80.0
            elif age_months <= 24:
                percentiles["heightPercentile"] = 70.0
            else:
                percentiles["heightPercentile"] = 60.0
        
        if weight and height:
            # Mock weight-for-height percentile
            percentiles["weightForHeightPercentile"] = 72.5
        
        return jsonify(percentiles), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to calculate percentiles: {str(e)}"}), 500