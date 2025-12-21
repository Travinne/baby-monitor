from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
from baby_backend.database import db
from ..models import Sleep, BabyProfile

sleep_bp = Blueprint('sleep_bp', __name__)

# Get all sleep records with optional filtering
@sleep_bp.route('/', methods=['GET'])
@jwt_required()
def get_sleep_history():
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
        sleep_type = request.args.get('type')
        limit = request.args.get('limit', type=int)
        
        # Build query
        query = Sleep.query.filter(Sleep.baby_id.in_(baby_ids))
        
        # Apply filters
        if baby_id and baby_id in [str(id) for id in baby_ids]:
            query = query.filter_by(baby_id=int(baby_id))
        
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(Sleep.start_time >= start_date_obj)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() + timedelta(days=1)
                query = query.filter(Sleep.start_time < end_date_obj)
            except ValueError:
                pass
        
        if sleep_type:
            query = query.filter_by(type=sleep_type)
        
        # Order by start time descending
        query = query.order_by(Sleep.start_time.desc())
        
        if limit and limit > 0:
            query = query.limit(limit)
        
        sleep_records = query.all()
        
        return jsonify([
            {
                'id': s.id,
                'babyId': s.baby_id,
                'startTime': s.start_time.isoformat() if s.start_time else None,
                'endTime': s.end_time.isoformat() if s.end_time else None,
                'duration': s.duration,  # in minutes
                'type': s.type,  # 'nap', 'night', 'bedtime'
                'quality': s.quality,  # 'excellent', 'good', 'fair', 'poor', 'restless'
                'wakeUps': s.wake_ups,
                'notes': s.notes,
                'environment': s.environment,  # 'quiet', 'noisy', 'dark', 'light'
                'position': s.position,  # 'back', 'side', 'tummy'
                'createdAt': s.created_at.isoformat() if s.created_at else None
            } for s in sleep_records
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get sleep history: {str(e)}"}), 500


# Get sleep statistics
@sleep_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_sleep_stats():
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', 'today')
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify({
                "totalDuration": 0,
                "averageDuration": 0,
                "naps": 0,
                "nightSleep": 0,
                "sleepQuality": {
                    "excellent": 0,
                    "good": 0,
                    "fair": 0,
                    "poor": 0,
                    "restless": 0
                }
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
        
        # Get sleep records in date range
        sleep_records = Sleep.query.filter(
            Sleep.baby_id.in_(baby_ids),
            Sleep.start_time >= start_date,
            Sleep.start_time <= now
        ).all()
        
        # Calculate stats
        total_duration = sum(s.duration or 0 for s in sleep_records)
        average_duration = total_duration / len(sleep_records) if sleep_records else 0
        
        # Count by type
        naps = len([s for s in sleep_records if s.type == 'nap'])
        night_sleep = len([s for s in sleep_records if s.type == 'night'])
        
        # Sleep quality distribution
        quality_counts = {
            "excellent": 0,
            "good": 0,
            "fair": 0,
            "poor": 0,
            "restless": 0
        }
        
        for record in sleep_records:
            if record.quality and record.quality in quality_counts:
                quality_counts[record.quality] += 1
        
        return jsonify({
            "totalDuration": round(total_duration, 1),
            "averageDuration": round(average_duration, 1),
            "naps": naps,
            "nightSleep": night_sleep,
            "sleepQuality": quality_counts,
            "period": period
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get sleep stats: {str(e)}"}), 500


# Get sleep trends
@sleep_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_sleep_trends():
    try:
        user_id = get_jwt_identity()
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Parse dates or use defaults
        today = datetime.utcnow().date()
        if not start_date:
            start_date = today - timedelta(days=7)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        if not end_date:
            end_date = today
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Adjust end_date to include the full day
        end_date_plus_one = end_date + timedelta(days=1)
        
        # Get sleep records in date range
        sleep_records = Sleep.query.filter(
            Sleep.baby_id.in_(baby_ids),
            Sleep.start_time >= start_date,
            Sleep.start_time < end_date_plus_one
        ).order_by(Sleep.start_time.asc()).all()
        
        # Group by date and calculate trends
        trends = []
        current_date = start_date
        
        while current_date <= end_date:
            next_date = current_date + timedelta(days=1)
            day_records = [s for s in sleep_records if s.start_time and s.start_time.date() == current_date]
            
            total_duration = sum(s.duration or 0 for s in day_records)
            naps = len([s for s in day_records if s.type == 'nap'])
            night_sleep = len([s for s in day_records if s.type == 'night'])
            bedtime = None
            
            # Find bedtime (first night sleep record)
            night_records = [s for s in day_records if s.type == 'night']
            if night_records:
                bedtime_record = min(night_records, key=lambda x: x.start_time)
                bedtime = bedtime_record.start_time.strftime('%H:%M') if bedtime_record.start_time else None
            
            trends.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'totalDuration': round(total_duration, 1),
                'naps': naps,
                'nightSleeps': night_sleep,
                'bedtime': bedtime,
                'averageQuality': calculate_average_quality(day_records)
            })
            
            current_date += timedelta(days=1)
        
        return jsonify(trends), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get sleep trends: {str(e)}"}), 500


# Helper function to calculate average quality
def calculate_average_quality(records):
    if not records:
        return None
    
    quality_map = {
        'excellent': 5,
        'good': 4,
        'fair': 3,
        'poor': 2,
        'restless': 1
    }
    
    total_score = 0
    count = 0
    
    for record in records:
        if record.quality and record.quality in quality_map:
            total_score += quality_map[record.quality]
            count += 1
    
    if count == 0:
        return None
    
    average_score = total_score / count
    
    # Map back to quality level
    if average_score >= 4.5:
        return 'excellent'
    elif average_score >= 3.5:
        return 'good'
    elif average_score >= 2.5:
        return 'fair'
    elif average_score >= 1.5:
        return 'poor'
    else:
        return 'restless'


# Get current sleep session
@sleep_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_sleep():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify(None), 200
        
        # Find current sleep sessions (ongoing, without end time)
        current_sleep = Sleep.query.filter(
            Sleep.baby_id.in_(baby_ids),
            Sleep.end_time.is_(None)
        ).order_by(Sleep.start_time.desc()).first()
        
        if not current_sleep:
            return jsonify(None), 200
        
        # Calculate duration so far
        duration_so_far = None
        if current_sleep.start_time:
            duration_so_far = (datetime.utcnow() - current_sleep.start_time).total_seconds() / 60  # in minutes
        
        return jsonify({
            'id': current_sleep.id,
            'babyId': current_sleep.baby_id,
            'startTime': current_sleep.start_time.isoformat() if current_sleep.start_time else None,
            'endTime': None,
            'duration': duration_so_far,
            'type': current_sleep.type,
            'quality': current_sleep.quality,
            'wakeUps': current_sleep.wake_ups,
            'notes': current_sleep.notes,
            'environment': current_sleep.environment,
            'position': current_sleep.position,
            'createdAt': current_sleep.created_at.isoformat() if current_sleep.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get current sleep: {str(e)}"}), 500


# End a sleep session
@sleep_bp.route('/<int:id>/end', methods=['PUT'])
@jwt_required()
def end_sleep(id):
    try:
        user_id = get_jwt_identity()
        
        # Get sleep record
        sleep = Sleep.query.get(id)
        if not sleep:
            return jsonify({"message": "Sleep session not found"}), 404
        
        # Verify sleep belongs to user's baby
        baby = BabyProfile.query.filter_by(id=sleep.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json()
        end_time_str = data.get('endTime')
        
        if not end_time_str:
            return jsonify({"message": "End time is required"}), 400
        
        # Parse end time
        try:
            end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"message": "Invalid end time format"}), 400
        
        # Validate end time is after start time
        if sleep.start_time and end_time <= sleep.start_time:
            return jsonify({"message": "End time must be after start time"}), 400
        
        # Update sleep record
        sleep.end_time = end_time
        
        # Calculate duration in minutes
        if sleep.start_time:
            duration = (end_time - sleep.start_time).total_seconds() / 60
            sleep.duration = round(duration, 1)
        
        db.session.commit()
        
        return jsonify({
            'id': sleep.id,
            'babyId': sleep.baby_id,
            'startTime': sleep.start_time.isoformat() if sleep.start_time else None,
            'endTime': sleep.end_time.isoformat() if sleep.end_time else None,
            'duration': sleep.duration,
            'type': sleep.type,
            'quality': sleep.quality,
            'wakeUps': sleep.wake_ups,
            'notes': sleep.notes,
            'environment': sleep.environment,
            'position': sleep.position,
            'createdAt': sleep.created_at.isoformat() if sleep.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to end sleep session: {str(e)}"}), 500


# Get sleep recommendations
@sleep_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_sleep_recommendations():
    try:
        age_months = request.args.get('age', type=float)
        
        if not age_months:
            return jsonify({
                "totalSleep": "14-17 hours",
                "nightSleep": "8-9 hours",
                "naps": "7-9 hours",
                "napCount": "3-5 naps"
            }), 200
        
        # Age-based recommendations (simplified)
        if age_months <= 3:
            recommendations = {
                "totalSleep": "14-17 hours",
                "nightSleep": "8-9 hours",
                "naps": "7-9 hours",
                "napCount": "3-5 naps",
                "wakeWindows": "45-90 minutes",
                "bedtime": "7:00-8:00 PM"
            }
        elif age_months <= 6:
            recommendations = {
                "totalSleep": "12-16 hours",
                "nightSleep": "9-10 hours",
                "naps": "4-5 hours",
                "napCount": "3-4 naps",
                "wakeWindows": "1.5-2.5 hours",
                "bedtime": "7:00-8:00 PM"
            }
        elif age_months <= 12:
            recommendations = {
                "totalSleep": "12-15 hours",
                "nightSleep": "10-12 hours",
                "naps": "2-3 hours",
                "napCount": "2 naps",
                "wakeWindows": "2.5-3.5 hours",
                "bedtime": "7:00-8:00 PM"
            }
        elif age_months <= 24:
            recommendations = {
                "totalSleep": "11-14 hours",
                "nightSleep": "10-12 hours",
                "naps": "1-2 hours",
                "napCount": "1-2 naps",
                "wakeWindows": "3-4 hours",
                "bedtime": "7:00-8:30 PM"
            }
        else:
            recommendations = {
                "totalSleep": "10-13 hours",
                "nightSleep": "10-12 hours",
                "naps": "0-1 hour",
                "napCount": "0-1 naps",
                "wakeWindows": "4-6 hours",
                "bedtime": "7:00-9:00 PM"
            }
        
        recommendations["ageMonths"] = age_months
        
        return jsonify(recommendations), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get recommendations: {str(e)}"}), 500


# Get a single sleep record
@sleep_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_sleep_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get sleep record
        sleep = Sleep.query.get(id)
        if not sleep:
            return jsonify({"message": "Sleep record not found"}), 404
        
        # Verify sleep belongs to user's baby
        baby = BabyProfile.query.filter_by(id=sleep.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        return jsonify({
            'id': sleep.id,
            'babyId': sleep.baby_id,
            'startTime': sleep.start_time.isoformat() if sleep.start_time else None,
            'endTime': sleep.end_time.isoformat() if sleep.end_time else None,
            'duration': sleep.duration,
            'type': sleep.type,
            'quality': sleep.quality,
            'wakeUps': sleep.wake_ups,
            'notes': sleep.notes,
            'environment': sleep.environment,
            'position': sleep.position,
            'createdAt': sleep.created_at.isoformat() if sleep.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get sleep record: {str(e)}"}), 500


# Add a new sleep record
@sleep_bp.route('/', methods=['POST'])
@jwt_required()
def add_sleep():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        if not data.get('startTime'):
            return jsonify({"message": "Start time is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse start time
        try:
            start_time = datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"message": "Invalid start time format"}), 400
        
        # Check if a sleep session is already in progress for this baby
        ongoing_sleep = Sleep.query.filter(
            Sleep.baby_id == data['babyId'],
            Sleep.end_time.is_(None)
        ).first()
        
        if ongoing_sleep:
            return jsonify({"message": "Sleep session already in progress"}), 409
        
        # Parse end time if provided
        end_time = None
        if data.get('endTime'):
            try:
                end_time = datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
                if end_time <= start_time:
                    return jsonify({"message": "End time must be after start time"}), 400
            except ValueError:
                return jsonify({"message": "Invalid end time format"}), 400
        
        # Calculate duration if both times are provided
        duration = None
        if start_time and end_time:
            duration = (end_time - start_time).total_seconds() / 60  # in minutes
            duration = round(duration, 1)
        elif data.get('duration'):
            duration = data['duration']
        
        # Create new sleep record
        new_sleep = Sleep(
            baby_id=data['babyId'],
            start_time=start_time,
            end_time=end_time,
            duration=duration,
            type=data.get('type', 'nap'),
            quality=data.get('quality'),
            wake_ups=data.get('wakeUps', 0),
            notes=data.get('notes', ''),
            environment=data.get('environment'),
            position=data.get('position')
        )
        
        db.session.add(new_sleep)
        db.session.commit()
        
        return jsonify({
            'id': new_sleep.id,
            'babyId': new_sleep.baby_id,
            'startTime': new_sleep.start_time.isoformat() if new_sleep.start_time else None,
            'endTime': new_sleep.end_time.isoformat() if new_sleep.end_time else None,
            'duration': new_sleep.duration,
            'type': new_sleep.type,
            'quality': new_sleep.quality,
            'wakeUps': new_sleep.wake_ups,
            'notes': new_sleep.notes,
            'environment': new_sleep.environment,
            'position': new_sleep.position,
            'createdAt': new_sleep.created_at.isoformat() if new_sleep.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add sleep: {str(e)}"}), 500


# Update a sleep record
@sleep_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_sleep(id):
    try:
        user_id = get_jwt_identity()
        
        # Get sleep record
        sleep = Sleep.query.get(id)
        if not sleep:
            return jsonify({"message": "Sleep record not found"}), 404
        
        # Verify sleep belongs to user's baby
        baby = BabyProfile.query.filter_by(id=sleep.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'startTime' in data and data['startTime']:
            try:
                sleep.start_time = datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"message": "Invalid start time format"}), 400
        
        if 'endTime' in data:
            if data['endTime']:
                try:
                    end_time = datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
                    if sleep.start_time and end_time <= sleep.start_time:
                        return jsonify({"message": "End time must be after start time"}), 400
                    sleep.end_time = end_time
                    
                    # Recalculate duration
                    if sleep.start_time:
                        duration = (end_time - sleep.start_time).total_seconds() / 60
                        sleep.duration = round(duration, 1)
                except ValueError:
                    return jsonify({"message": "Invalid end time format"}), 400
            else:
                sleep.end_time = None
                sleep.duration = None
        
        if 'duration' in data and data['duration']:
            sleep.duration = data['duration']
        
        if 'type' in data:
            sleep.type = data['type']
        
        if 'quality' in data:
            sleep.quality = data['quality']
        
        if 'wakeUps' in data:
            sleep.wake_ups = data['wakeUps']
        
        if 'notes' in data:
            sleep.notes = data['notes']
        
        if 'environment' in data:
            sleep.environment = data['environment']
        
        if 'position' in data:
            sleep.position = data['position']
        
        db.session.commit()
        
        return jsonify({
            'id': sleep.id,
            'babyId': sleep.baby_id,
            'startTime': sleep.start_time.isoformat() if sleep.start_time else None,
            'endTime': sleep.end_time.isoformat() if sleep.end_time else None,
            'duration': sleep.duration,
            'type': sleep.type,
            'quality': sleep.quality,
            'wakeUps': sleep.wake_ups,
            'notes': sleep.notes,
            'environment': sleep.environment,
            'position': sleep.position,
            'createdAt': sleep.created_at.isoformat() if sleep.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update sleep: {str(e)}"}), 500


# Delete a sleep record
@sleep_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_sleep(id):
    try:
        user_id = get_jwt_identity()
        
        # Get sleep record
        sleep = Sleep.query.get(id)
        if not sleep:
            return jsonify({"message": "Sleep record not found"}), 404
        
        # Verify sleep belongs to user's baby
        baby = BabyProfile.query.filter_by(id=sleep.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        db.session.delete(sleep)
        db.session.commit()
        
        return jsonify({"message": "Sleep record deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete sleep: {str(e)}"}), 500