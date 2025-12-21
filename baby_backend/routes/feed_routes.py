from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
from baby_backend.database import db
from ..models import Feeding, BabyProfile

feed_bp = Blueprint('feed_bp', __name__)

# Get all feedings with optional filtering
@feed_bp.route('/', methods=['GET'])
@jwt_required()
def get_feed_history():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get query parameters
        baby_id = request.args.get('babyId')
        feed_date = request.args.get('date')
        feed_type = request.args.get('type')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        limit = request.args.get('limit', type=int)
        
        # Build query
        query = Feeding.query.filter(Feeding.baby_id.in_(baby_ids))
        
        # Apply filters
        if baby_id and baby_id in [str(id) for id in baby_ids]:
            query = query.filter_by(baby_id=int(baby_id))
        
        if feed_date:
            try:
                date_obj = datetime.strptime(feed_date, '%Y-%m-%d').date()
                next_day = date_obj + timedelta(days=1)
                query = query.filter(Feeding.time >= date_obj, Feeding.time < next_day)
            except ValueError:
                pass
        
        if feed_type:
            query = query.filter_by(feed_type=feed_type)
        
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(Feeding.time >= start_date_obj)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() + timedelta(days=1)
                query = query.filter(Feeding.time < end_date_obj)
            except ValueError:
                pass
        
        # Order by time descending
        query = query.order_by(Feeding.time.desc())
        
        if limit and limit > 0:
            query = query.limit(limit)
        
        feedings = query.all()
        
        return jsonify([
            {
                'id': f.id,
                'babyId': f.baby_id,
                'feedType': f.feed_type,  # 'breast', 'formula', 'solids', 'mixed'
                'amount': float(f.amount) if f.amount else None,
                'unit': f.unit,  # 'ml', 'oz', 'minutes', 'servings'
                'duration': f.duration,  # in minutes for breastfeeding
                'side': f.side,  # 'left', 'right', 'both'
                'time': f.time.isoformat() if f.time else None,
                'notes': f.notes,
                'moodBefore': f.mood_before,
                'moodAfter': f.mood_after,
                'position': f.position,  # 'cradle', 'football', 'side-lying'
                'temperature': f.temperature,  # for formula
                'createdAt': f.created_at.isoformat() if f.created_at else None
            } for f in feedings
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get feed history: {str(e)}"}), 500


# Get feeding statistics
@feed_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_feeding_stats():
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', 'today')
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify({
                "total": 0,
                "last24Hours": 0,
                "averageDuration": 0,
                "totalAmount": 0,
                "byType": {}
            }), 200
        
        # Calculate date range based on period
        now = datetime.utcnow()
        if period == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        else:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get feedings in date range
        feedings = Feeding.query.filter(
            Feeding.baby_id.in_(baby_ids),
            Feeding.time >= start_date,
            Feeding.time <= now
        ).all()
        
        # Get feedings in last 24 hours
        last_24_hours = now - timedelta(hours=24)
        recent_feedings = [f for f in feedings if f.time >= last_24_hours]
        
        # Calculate stats
        total_feedings = len(feedings)
        last_24_hours_count = len(recent_feedings)
        
        # Calculate average duration
        durations = [f.duration for f in feedings if f.duration]
        average_duration = sum(durations) / len(durations) if durations else 0
        
        # Calculate total amount
        total_amount = 0
        for feeding in feedings:
            if feeding.amount:
                if feeding.unit == 'oz':
                    total_amount += feeding.amount * 30  # Convert oz to ml for consistency
                elif feeding.unit == 'ml':
                    total_amount += feeding.amount
                # For breastfeeding, duration might be used instead
        
        # Group by type
        by_type = {}
        for feeding in feedings:
            feed_type = feeding.feed_type or 'unknown'
            by_type[feed_type] = by_type.get(feed_type, 0) + 1
        
        return jsonify({
            "total": total_feedings,
            "last24Hours": last_24_hours_count,
            "averageDuration": round(average_duration, 1),
            "totalAmount": round(total_amount, 1),
            "byType": by_type,
            "period": period
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get feeding stats: {str(e)}"}), 500


# Get today's feedings
@feed_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_feedings():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get date parameter or use today
        date_param = request.args.get('date')
        if date_param:
            try:
                target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                target_date = datetime.utcnow().date()
        else:
            target_date = datetime.utcnow().date()
        
        next_day = target_date + timedelta(days=1)
        
        # Get feedings for the specified date
        feedings = Feeding.query.filter(
            Feeding.baby_id.in_(baby_ids),
            Feeding.time >= target_date,
            Feeding.time < next_day
        ).order_by(Feeding.time.desc()).all()
        
        # Calculate daily totals
        daily_totals = {
            'breastfeeding': {'count': 0, 'totalDuration': 0},
            'formula': {'count': 0, 'totalAmount': 0},
            'solids': {'count': 0, 'totalServings': 0}
        }
        
        for feeding in feedings:
            if feeding.feed_type == 'breast':
                daily_totals['breastfeeding']['count'] += 1
                if feeding.duration:
                    daily_totals['breastfeeding']['totalDuration'] += feeding.duration
            elif feeding.feed_type == 'formula':
                daily_totals['formula']['count'] += 1
                if feeding.amount:
                    daily_totals['formula']['totalAmount'] += feeding.amount
            elif feeding.feed_type == 'solids':
                daily_totals['solids']['count'] += 1
                if feeding.amount:
                    daily_totals['solids']['totalServings'] += feeding.amount
        
        return jsonify({
            "feedings": [
                {
                    'id': f.id,
                    'babyId': f.baby_id,
                    'feedType': f.feed_type,
                    'amount': float(f.amount) if f.amount else None,
                    'unit': f.unit,
                    'duration': f.duration,
                    'side': f.side,
                    'time': f.time.isoformat() if f.time else None,
                    'notes': f.notes
                } for f in feedings
            ],
            "dailyTotals": daily_totals,
            "date": target_date.strftime('%Y-%m-%d')
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get today's feedings: {str(e)}"}), 500


# Get a single feeding
@feed_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_feeding(id):
    try:
        user_id = get_jwt_identity()
        
        # Get feeding
        feeding = Feeding.query.get(id)
        if not feeding:
            return jsonify({"message": "Feeding not found"}), 404
        
        # Verify feeding belongs to user's baby
        baby = BabyProfile.query.filter_by(id=feeding.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        return jsonify({
            'id': feeding.id,
            'babyId': feeding.baby_id,
            'feedType': feeding.feed_type,
            'amount': float(feeding.amount) if feeding.amount else None,
            'unit': feeding.unit,
            'duration': feeding.duration,
            'side': feeding.side,
            'time': feeding.time.isoformat() if feeding.time else None,
            'notes': feeding.notes,
            'moodBefore': feeding.mood_before,
            'moodAfter': feeding.mood_after,
            'position': feeding.position,
            'temperature': feeding.temperature,
            'createdAt': feeding.created_at.isoformat() if feeding.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get feeding: {str(e)}"}), 500


# Add a new feeding
@feed_bp.route('/', methods=['POST'])
@jwt_required()
def add_feeding():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        if not data.get('feedType'):
            return jsonify({"message": "Feeding type is required"}), 400
        
        if not data.get('time'):
            return jsonify({"message": "Time is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse time
        try:
            feeding_time = datetime.fromisoformat(data['time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"message": "Invalid time format"}), 400
        
        # Validate time is not in the future
        if feeding_time > datetime.utcnow():
            return jsonify({"message": "Feeding time cannot be in the future"}), 400
        
        # Create new feeding
        new_feeding = Feeding(
            baby_id=data['babyId'],
            feed_type=data['feedType'],
            amount=data.get('amount'),
            unit=data.get('unit', 'ml'),
            duration=data.get('duration'),
            side=data.get('side'),
            time=feeding_time,
            notes=data.get('notes', ''),
            mood_before=data.get('moodBefore'),
            mood_after=data.get('moodAfter'),
            position=data.get('position'),
            temperature=data.get('temperature')
        )
        
        db.session.add(new_feeding)
        db.session.commit()
        
        return jsonify({
            'id': new_feeding.id,
            'babyId': new_feeding.baby_id,
            'feedType': new_feeding.feed_type,
            'amount': float(new_feeding.amount) if new_feeding.amount else None,
            'unit': new_feeding.unit,
            'duration': new_feeding.duration,
            'side': new_feeding.side,
            'time': new_feeding.time.isoformat() if new_feeding.time else None,
            'notes': new_feeding.notes,
            'moodBefore': new_feeding.mood_before,
            'moodAfter': new_feeding.mood_after,
            'position': new_feeding.position,
            'temperature': new_feeding.temperature,
            'createdAt': new_feeding.created_at.isoformat() if new_feeding.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add feeding: {str(e)}"}), 500


# Update a feeding
@feed_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_feeding(id):
    try:
        user_id = get_jwt_identity()
        
        # Get feeding
        feeding = Feeding.query.get(id)
        if not feeding:
            return jsonify({"message": "Feeding not found"}), 404
        
        # Verify feeding belongs to user's baby
        baby = BabyProfile.query.filter_by(id=feeding.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'feedType' in data:
            feeding.feed_type = data['feedType']
        
        if 'amount' in data:
            feeding.amount = data['amount'] if data['amount'] is not None else None
        
        if 'unit' in data:
            feeding.unit = data['unit']
        
        if 'duration' in data:
            feeding.duration = data['duration'] if data['duration'] is not None else None
        
        if 'side' in data:
            feeding.side = data['side']
        
        if 'time' in data and data['time']:
            try:
                feeding_time = datetime.fromisoformat(data['time'].replace('Z', '+00:00'))
                if feeding_time > datetime.utcnow():
                    return jsonify({"message": "Feeding time cannot be in the future"}), 400
                feeding.time = feeding_time
            except ValueError:
                return jsonify({"message": "Invalid time format"}), 400
        
        if 'notes' in data:
            feeding.notes = data['notes']
        
        if 'moodBefore' in data:
            feeding.mood_before = data['moodBefore']
        
        if 'moodAfter' in data:
            feeding.mood_after = data['moodAfter']
        
        if 'position' in data:
            feeding.position = data['position']
        
        if 'temperature' in data:
            feeding.temperature = data['temperature']
        
        db.session.commit()
        
        return jsonify({
            'id': feeding.id,
            'babyId': feeding.baby_id,
            'feedType': feeding.feed_type,
            'amount': float(feeding.amount) if feeding.amount else None,
            'unit': feeding.unit,
            'duration': feeding.duration,
            'side': feeding.side,
            'time': feeding.time.isoformat() if feeding.time else None,
            'notes': feeding.notes,
            'moodBefore': feeding.mood_before,
            'moodAfter': feeding.mood_after,
            'position': feeding.position,
            'temperature': feeding.temperature,
            'createdAt': feeding.created_at.isoformat() if feeding.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update feeding: {str(e)}"}), 500


# Delete a feeding
@feed_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_feeding(id):
    try:
        user_id = get_jwt_identity()
        
        # Get feeding
        feeding = Feeding.query.get(id)
        if not feeding:
            return jsonify({"message": "Feeding not found"}), 404
        
        # Verify feeding belongs to user's baby
        baby = BabyProfile.query.filter_by(id=feeding.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        db.session.delete(feeding)
        db.session.commit()
        
        return jsonify({"message": "Feeding record deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete feeding: {str(e)}"}), 500


# Get feedings for a specific baby (for backward compatibility)
@feed_bp.route('/baby/<int:baby_id>', methods=['GET'])
@jwt_required()
def get_baby_feedings(baby_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Get feedings for the baby
        feedings = Feeding.query.filter_by(baby_id=baby_id).order_by(Feeding.time.desc()).all()
        
        return jsonify([
            {
                'id': f.id,
                'babyId': f.baby_id,
                'feedType': f.feed_type,
                'amount': float(f.amount) if f.amount else None,
                'unit': f.unit,
                'duration': f.duration,
                'side': f.side,
                'time': f.time.isoformat() if f.time else None,
                'notes': f.notes,
                'moodBefore': f.mood_before,
                'moodAfter': f.mood_after,
                'position': f.position,
                'temperature': f.temperature,
                'createdAt': f.created_at.isoformat() if f.created_at else None
            } for f in feedings
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get baby feedings: {str(e)}"}), 500