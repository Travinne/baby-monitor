from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from baby_backend.database import db
from ..models import Bath, BabyProfile
from datetime import datetime, timedelta
import json

bath_bp = Blueprint('bath_bp', __name__)

# Get all baths with optional filtering
@bath_bp.route('/', methods=['GET'])
@jwt_required()
def get_bath_history():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get query parameters
        baby_id = request.args.get('babyId')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        limit = request.args.get('limit', type=int)
        
        # Build query
        query = Bath.query.filter(Bath.baby_id.in_(baby_ids))
        
        # Apply filters
        if baby_id and baby_id in [str(id) for id in baby_ids]:
            query = query.filter_by(baby_id=int(baby_id))
        
        if start_date:
            try:
                start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Bath.time >= start_date_obj)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Bath.time <= end_date_obj)
            except ValueError:
                pass
        
        # Order and limit
        query = query.order_by(Bath.time.desc())
        
        if limit and limit > 0:
            query = query.limit(limit)
        
        baths = query.all()
        
        return jsonify([
            {
                'id': b.id,
                'babyId': b.baby_id,
                'time': b.time.isoformat() if b.time else None,
                'duration': b.duration,
                'productsUsed': json.loads(b.products_used) if b.products_used else [],
                'waterTemperature': b.water_temperature,
                'moodBefore': b.mood_before,
                'moodAfter': b.mood_after,
                'notes': b.notes,
                'createdAt': b.created_at.isoformat() if b.created_at else None
            } for b in baths
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get bath history: {str(e)}"}), 500


# Get bath stats
@bath_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_bath_stats():
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', 'week')
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify({
                "totalBaths": 0,
                "averageDuration": 0,
                "frequency": {},
                "mostUsedProducts": []
            }), 200
        
        # Calculate date range based on period
        end_date = datetime.utcnow()
        if period == 'day':
            start_date = end_date - timedelta(days=1)
        elif period == 'week':
            start_date = end_date - timedelta(weeks=1)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(weeks=1)  # Default to week
        
        # Get baths in date range
        baths = Bath.query.filter(
            Bath.baby_id.in_(baby_ids),
            Bath.time >= start_date,
            Bath.time <= end_date
        ).all()
        
        # Calculate stats
        total_baths = len(baths)
        
        # Average duration
        if total_baths > 0:
            avg_duration = sum(b.duration or 0 for b in baths) / total_baths
        else:
            avg_duration = 0
        
        # Frequency by day of week
        frequency = {
            "Sunday": 0, "Monday": 0, "Tuesday": 0, 
            "Wednesday": 0, "Thursday": 0, "Friday": 0, "Saturday": 0
        }
        
        for bath in baths:
            if bath.time:
                day_name = bath.time.strftime("%A")
                frequency[day_name] += 1
        
        # Most used products
        product_counts = {}
        for bath in baths:
            if bath.products_used:
                try:
                    products = json.loads(bath.products_used)
                    for product in products:
                        product_counts[product] = product_counts.get(product, 0) + 1
                except (json.JSONDecodeError, TypeError):
                    pass
        
        most_used_products = [
            {"product": product, "count": count}
            for product, count in sorted(
                product_counts.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:5]  # Top 5
        ]
        
        return jsonify({
            "totalBaths": total_baths,
            "averageDuration": round(avg_duration, 1),
            "frequency": frequency,
            "mostUsedProducts": most_used_products,
            "period": period
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get bath stats: {str(e)}"}), 500


# Get a single bath record
@bath_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_bath_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get bath record
        bath = Bath.query.get(id)
        if not bath:
            return jsonify({"message": "Bath record not found"}), 404
        
        # Verify bath belongs to user's baby
        baby = BabyProfile.query.filter_by(id=bath.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        return jsonify({
            'id': bath.id,
            'babyId': bath.baby_id,
            'time': bath.time.isoformat() if bath.time else None,
            'duration': bath.duration,
            'productsUsed': json.loads(bath.products_used) if bath.products_used else [],
            'waterTemperature': bath.water_temperature,
            'moodBefore': bath.mood_before,
            'moodAfter': bath.mood_after,
            'notes': bath.notes,
            'createdAt': bath.created_at.isoformat() if bath.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get bath record: {str(e)}"}), 500


# Add a new bath record
@bath_bp.route('/', methods=['POST'])
@jwt_required()
def add_bath():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        if not data.get('time'):
            return jsonify({"message": "Time is required"}), 400
        
        if not data.get('duration'):
            return jsonify({"message": "Duration is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse time
        try:
            bath_time = datetime.fromisoformat(data['time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"message": "Invalid time format"}), 400
        
        # Validate duration
        duration = data.get('duration')
        if not isinstance(duration, (int, float)) or duration < 1 or duration > 60:
            return jsonify({"message": "Duration must be between 1 and 60 minutes"}), 400
        
        # Create new bath
        new_bath = Bath(
            baby_id=data['babyId'],
            time=bath_time,
            duration=duration,
            products_used=json.dumps(data.get('productsUsed', [])) if data.get('productsUsed') else None,
            water_temperature=data.get('waterTemperature'),
            mood_before=data.get('moodBefore'),
            mood_after=data.get('moodAfter'),
            notes=data.get('notes', '')
        )
        
        db.session.add(new_bath)
        db.session.commit()
        
        return jsonify({
            'id': new_bath.id,
            'babyId': new_bath.baby_id,
            'time': new_bath.time.isoformat() if new_bath.time else None,
            'duration': new_bath.duration,
            'productsUsed': json.loads(new_bath.products_used) if new_bath.products_used else [],
            'waterTemperature': new_bath.water_temperature,
            'moodBefore': new_bath.mood_before,
            'moodAfter': new_bath.mood_after,
            'notes': new_bath.notes,
            'createdAt': new_bath.created_at.isoformat() if new_bath.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add bath: {str(e)}"}), 500


# Update a bath record
@bath_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_bath(id):
    try:
        user_id = get_jwt_identity()
        
        # Get bath record
        bath = Bath.query.get(id)
        if not bath:
            return jsonify({"message": "Bath record not found"}), 404
        
        # Verify bath belongs to user's baby
        baby = BabyProfile.query.filter_by(id=bath.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'time' in data and data['time']:
            try:
                bath.time = datetime.fromisoformat(data['time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid time format"}), 400
        
        if 'duration' in data:
            if data['duration'] is not None:
                if not isinstance(data['duration'], (int, float)) or data['duration'] < 1 or data['duration'] > 60:
                    return jsonify({"message": "Duration must be between 1 and 60 minutes"}), 400
                bath.duration = data['duration']
            else:
                bath.duration = None
        
        if 'productsUsed' in data:
            if data['productsUsed']:
                bath.products_used = json.dumps(data['productsUsed'])
            else:
                bath.products_used = None
        
        if 'waterTemperature' in data:
            bath.water_temperature = data['waterTemperature']
        
        if 'moodBefore' in data:
            bath.mood_before = data['moodBefore']
        
        if 'moodAfter' in data:
            bath.mood_after = data['moodAfter']
        
        if 'notes' in data:
            bath.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'id': bath.id,
            'babyId': bath.baby_id,
            'time': bath.time.isoformat() if bath.time else None,
            'duration': bath.duration,
            'productsUsed': json.loads(bath.products_used) if bath.products_used else [],
            'waterTemperature': bath.water_temperature,
            'moodBefore': bath.mood_before,
            'moodAfter': bath.mood_after,
            'notes': bath.notes,
            'createdAt': bath.created_at.isoformat() if bath.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update bath: {str(e)}"}), 500


# Delete a bath record
@bath_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_bath(id):
    try:
        user_id = get_jwt_identity()
        
        # Get bath record
        bath = Bath.query.get(id)
        if not bath:
            return jsonify({"message": "Bath record not found"}), 404
        
        # Verify bath belongs to user's baby
        baby = BabyProfile.query.filter_by(id=bath.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        db.session.delete(bath)
        db.session.commit()
        
        return jsonify({"message": "Bath record deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete bath: {str(e)}"}), 500


# Get baths for a specific baby (for backward compatibility)
@bath_bp.route('/baby/<int:baby_id>', methods=['GET'])
@jwt_required()
def get_baby_baths(baby_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Get baths for the baby
        baths = Bath.query.filter_by(baby_id=baby_id).order_by(Bath.time.desc()).all()
        
        return jsonify([
            {
                'id': b.id,
                'babyId': b.baby_id,
                'time': b.time.isoformat() if b.time else None,
                'duration': b.duration,
                'productsUsed': json.loads(b.products_used) if b.products_used else [],
                'waterTemperature': b.water_temperature,
                'moodBefore': b.mood_before,
                'moodAfter': b.mood_after,
                'notes': b.notes,
                'createdAt': b.created_at.isoformat() if b.created_at else None
            } for b in baths
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get baby baths: {str(e)}"}), 500