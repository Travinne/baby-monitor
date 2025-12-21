from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json
from baby_backend.database import db
from ..models import Checkup, BabyProfile

checkup_bp = Blueprint('checkup_bp', __name__)

# Get all checkups with optional filtering
@checkup_bp.route('/', methods=['GET'])
@jwt_required()
def get_checkups():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get query parameters
        baby_id = request.args.get('babyId')
        type_filter = request.args.get('type')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Build query
        query = Checkup.query.filter(Checkup.baby_id.in_(baby_ids))
        
        # Apply filters
        if baby_id and baby_id in [str(id) for id in baby_ids]:
            query = query.filter_by(baby_id=int(baby_id))
        
        if type_filter:
            query = query.filter_by(type=type_filter)
        
        if start_date:
            try:
                start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Checkup.date >= start_date_obj)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Checkup.date <= end_date_obj)
            except ValueError:
                pass
        
        # Order by date descending
        checkups = query.order_by(Checkup.date.desc()).all()
        
        return jsonify([
            {
                'id': c.id,
                'babyId': c.baby_id,
                'doctorName': c.doctor_name,
                'clinic': c.clinic,
                'type': c.type,
                'reason': c.reason,
                'date': c.date.isoformat() if c.date else None,
                'weight': float(c.weight) if c.weight else None,
                'height': float(c.height) if c.height else None,
                'headCircumference': float(c.head_circumference) if c.head_circumference else None,
                'temperature': float(c.temperature) if c.temperature else None,
                'heartRate': c.heart_rate,
                'bloodPressure': c.blood_pressure,
                'diagnosis': c.diagnosis,
                'prescription': json.loads(c.prescription) if c.prescription else [],
                'vaccines': json.loads(c.vaccines) if c.vaccines else [],
                'nextAppointment': c.next_appointment.isoformat() if c.next_appointment else None,
                'notes': c.notes,
                'createdAt': c.created_at.isoformat() if c.created_at else None
            } for c in checkups
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get checkups: {str(e)}"}), 500


# Get checkup statistics
@checkup_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_checkup_stats():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify({
                "totalCheckups": 0,
                "checkupsByType": {},
                "averageVisits": 0,
                "recentActivity": {}
            }), 200
        
        # Get all checkups for user's babies
        checkups = Checkup.query.filter(Checkup.baby_id.in_(baby_ids)).all()
        
        # Calculate stats
        total_checkups = len(checkups)
        
        # Group by type
        checkups_by_type = {}
        for checkup in checkups:
            if checkup.type:
                checkups_by_type[checkup.type] = checkups_by_type.get(checkup.type, 0) + 1
        
        # Average visits per month (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        recent_checkups = [c for c in checkups if c.date and c.date >= six_months_ago]
        avg_visits_per_month = len(recent_checkups) / 6 if recent_checkups else 0
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        last_30_days = [c for c in checkups if c.date and c.date >= thirty_days_ago]
        
        recent_activity = {
            "last30Days": len(last_30_days),
            "lastWeek": len([c for c in last_30_days if c.date >= (datetime.utcnow() - timedelta(days=7))])
        }
        
        return jsonify({
            "totalCheckups": total_checkups,
            "checkupsByType": checkups_by_type,
            "averageVisitsPerMonth": round(avg_visits_per_month, 1),
            "recentActivity": recent_activity
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get checkup stats: {str(e)}"}), 500


# Get upcoming checkups
@checkup_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_checkups():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        today = datetime.utcnow().date()
        
        # Get checkups with next appointment in the future
        upcoming = Checkup.query.filter(
            Checkup.baby_id.in_(baby_ids),
            Checkup.next_appointment >= today
        ).order_by(Checkup.next_appointment.asc()).all()
        
        return jsonify([
            {
                'id': c.id,
                'babyId': c.baby_id,
                'doctorName': c.doctor_name,
                'clinic': c.clinic,
                'type': c.type,
                'reason': c.reason,
                'date': c.date.isoformat() if c.date else None,
                'nextAppointment': c.next_appointment.isoformat() if c.next_appointment else None,
                'notes': c.notes
            } for c in upcoming
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get upcoming checkups: {str(e)}"}), 500


# Get a single checkup
@checkup_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_checkup(id):
    try:
        user_id = get_jwt_identity()
        
        # Get checkup
        checkup = Checkup.query.get(id)
        if not checkup:
            return jsonify({"message": "Checkup not found"}), 404
        
        # Verify checkup belongs to user's baby
        baby = BabyProfile.query.filter_by(id=checkup.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        return jsonify({
            'id': checkup.id,
            'babyId': checkup.baby_id,
            'doctorName': checkup.doctor_name,
            'clinic': checkup.clinic,
            'type': checkup.type,
            'reason': checkup.reason,
            'date': checkup.date.isoformat() if checkup.date else None,
            'weight': float(checkup.weight) if checkup.weight else None,
            'height': float(checkup.height) if checkup.height else None,
            'headCircumference': float(checkup.head_circumference) if checkup.head_circumference else None,
            'temperature': float(checkup.temperature) if checkup.temperature else None,
            'heartRate': checkup.heart_rate,
            'bloodPressure': checkup.blood_pressure,
            'diagnosis': checkup.diagnosis,
            'prescription': json.loads(checkup.prescription) if checkup.prescription else [],
            'vaccines': json.loads(checkup.vaccines) if checkup.vaccines else [],
            'nextAppointment': checkup.next_appointment.isoformat() if checkup.next_appointment else None,
            'notes': checkup.notes,
            'createdAt': checkup.created_at.isoformat() if checkup.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get checkup: {str(e)}"}), 500


# Add a new checkup
@checkup_bp.route('/', methods=['POST'])
@jwt_required()
def add_checkup():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        if not data.get('doctorName'):
            return jsonify({"message": "Doctor name is required"}), 400
        
        if not data.get('date'):
            return jsonify({"message": "Appointment date is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse dates
        try:
            checkup_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"message": "Invalid date format"}), 400
        
        next_appointment = None
        if data.get('nextAppointment'):
            try:
                next_appointment = datetime.fromisoformat(data['nextAppointment'].replace('Z', '+00:00'))
                # Validate next appointment is after current appointment
                if next_appointment <= checkup_date:
                    return jsonify({"message": "Next appointment must be after current appointment"}), 400
            except ValueError:
                return jsonify({"message": "Invalid next appointment date format"}), 400
        
        # Validate measurements
        weight = data.get('weight')
        if weight is not None and (weight < 0.5 or weight > 50):
            return jsonify({"message": "Weight must be between 0.5kg and 50kg"}), 400
        
        height = data.get('height')
        if height is not None and (height < 20 or height > 200):
            return jsonify({"message": "Height must be between 20cm and 200cm"}), 400
        
        head_circumference = data.get('headCircumference')
        if head_circumference is not None and (head_circumference < 20 or head_circumference > 60):
            return jsonify({"message": "Head circumference must be between 20cm and 60cm"}), 400
        
        # Create new checkup
        new_checkup = Checkup(
            baby_id=data['babyId'],
            doctor_name=data['doctorName'],
            clinic=data.get('clinic', ''),
            type=data.get('type', 'routine'),
            reason=data.get('reason', ''),
            date=checkup_date,
            weight=weight,
            height=height,
            head_circumference=head_circumference,
            temperature=data.get('temperature'),
            heart_rate=data.get('heartRate'),
            blood_pressure=data.get('bloodPressure'),
            diagnosis=data.get('diagnosis', ''),
            prescription=json.dumps(data.get('prescription', [])) if data.get('prescription') else None,
            vaccines=json.dumps(data.get('vaccines', [])) if data.get('vaccines') else None,
            next_appointment=next_appointment,
            notes=data.get('notes', '')
        )
        
        db.session.add(new_checkup)
        db.session.commit()
        
        return jsonify({
            'id': new_checkup.id,
            'babyId': new_checkup.baby_id,
            'doctorName': new_checkup.doctor_name,
            'clinic': new_checkup.clinic,
            'type': new_checkup.type,
            'reason': new_checkup.reason,
            'date': new_checkup.date.isoformat() if new_checkup.date else None,
            'weight': float(new_checkup.weight) if new_checkup.weight else None,
            'height': float(new_checkup.height) if new_checkup.height else None,
            'headCircumference': float(new_checkup.head_circumference) if new_checkup.head_circumference else None,
            'temperature': float(new_checkup.temperature) if new_checkup.temperature else None,
            'heartRate': new_checkup.heart_rate,
            'bloodPressure': new_checkup.blood_pressure,
            'diagnosis': new_checkup.diagnosis,
            'prescription': json.loads(new_checkup.prescription) if new_checkup.prescription else [],
            'vaccines': json.loads(new_checkup.vaccines) if new_checkup.vaccines else [],
            'nextAppointment': new_checkup.next_appointment.isoformat() if new_checkup.next_appointment else None,
            'notes': new_checkup.notes,
            'createdAt': new_checkup.created_at.isoformat() if new_checkup.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add checkup: {str(e)}"}), 500


# Update a checkup
@checkup_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_checkup(id):
    try:
        user_id = get_jwt_identity()
        
        # Get checkup
        checkup = Checkup.query.get(id)
        if not checkup:
            return jsonify({"message": "Checkup not found"}), 404
        
        # Verify checkup belongs to user's baby
        baby = BabyProfile.query.filter_by(id=checkup.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'doctorName' in data:
            checkup.doctor_name = data['doctorName']
        
        if 'clinic' in data:
            checkup.clinic = data['clinic']
        
        if 'type' in data:
            checkup.type = data['type']
        
        if 'reason' in data:
            checkup.reason = data['reason']
        
        if 'date' in data and data['date']:
            try:
                checkup.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid date format"}), 400
        
        # Update measurements
        if 'weight' in data:
            checkup.weight = data['weight'] if data['weight'] is not None else None
        
        if 'height' in data:
            checkup.height = data['height'] if data['height'] is not None else None
        
        if 'headCircumference' in data:
            checkup.head_circumference = data['headCircumference'] if data['headCircumference'] is not None else None
        
        if 'temperature' in data:
            checkup.temperature = data['temperature'] if data['temperature'] is not None else None
        
        if 'heartRate' in data:
            checkup.heart_rate = data['heartRate']
        
        if 'bloodPressure' in data:
            checkup.blood_pressure = data['bloodPressure']
        
        if 'diagnosis' in data:
            checkup.diagnosis = data['diagnosis']
        
        if 'prescription' in data:
            checkup.prescription = json.dumps(data['prescription']) if data['prescription'] else None
        
        if 'vaccines' in data:
            checkup.vaccines = json.dumps(data['vaccines']) if data['vaccines'] else None
        
        if 'nextAppointment' in data:
            if data['nextAppointment']:
                try:
                    next_appointment = datetime.fromisoformat(data['nextAppointment'].replace('Z', '+00:00'))
                    # Validate next appointment is after current appointment
                    if next_appointment <= checkup.date:
                        return jsonify({"message": "Next appointment must be after current appointment"}), 400
                    checkup.next_appointment = next_appointment
                except ValueError:
                    return jsonify({"message": "Invalid next appointment date format"}), 400
            else:
                checkup.next_appointment = None
        
        if 'notes' in data:
            checkup.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'id': checkup.id,
            'babyId': checkup.baby_id,
            'doctorName': checkup.doctor_name,
            'clinic': checkup.clinic,
            'type': checkup.type,
            'reason': checkup.reason,
            'date': checkup.date.isoformat() if checkup.date else None,
            'weight': float(checkup.weight) if checkup.weight else None,
            'height': float(checkup.height) if checkup.height else None,
            'headCircumference': float(checkup.head_circumference) if checkup.head_circumference else None,
            'temperature': float(checkup.temperature) if checkup.temperature else None,
            'heartRate': checkup.heart_rate,
            'bloodPressure': checkup.blood_pressure,
            'diagnosis': checkup.diagnosis,
            'prescription': json.loads(checkup.prescription) if checkup.prescription else [],
            'vaccines': json.loads(checkup.vaccines) if checkup.vaccines else [],
            'nextAppointment': checkup.next_appointment.isoformat() if checkup.next_appointment else None,
            'notes': checkup.notes,
            'createdAt': checkup.created_at.isoformat() if checkup.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update checkup: {str(e)}"}), 500


# Delete a checkup
@checkup_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_checkup(id):
    try:
        user_id = get_jwt_identity()
        
        # Get checkup
        checkup = Checkup.query.get(id)
        if not checkup:
            return jsonify({"message": "Checkup not found"}), 404
        
        # Verify checkup belongs to user's baby
        baby = BabyProfile.query.filter_by(id=checkup.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        db.session.delete(checkup)
        db.session.commit()
        
        return jsonify({"message": "Checkup deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete checkup: {str(e)}"}), 500