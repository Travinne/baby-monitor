from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
from baby_backend.database import db
from ..models import Diaper, BabyProfile
import json

diaper_bp = Blueprint('diaper_bp', __name__)

# Get all diapers with optional filtering
@diaper_bp.route('/', methods=['GET'])
@jwt_required()
def get_diaper_history():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get query parameters
        baby_id = request.args.get('babyId')
        diaper_date = request.args.get('date')
        diaper_type = request.args.get('type')
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        limit = request.args.get('limit', type=int, default=50)
        
        # Build query
        query = Diaper.query.filter(Diaper.baby_id.in_(baby_ids))
        
        # Apply filters
        if baby_id and baby_id in [str(id) for id in baby_ids]:
            query = query.filter_by(baby_id=int(baby_id))
        
        if diaper_date:
            try:
                date_obj = datetime.strptime(diaper_date, '%Y-%m-%d').date()
                next_day = date_obj + timedelta(days=1)
                query = query.filter(Diaper.timestamp >= date_obj, Diaper.timestamp < next_day)
            except ValueError:
                pass
        
        if diaper_type:
            query = query.filter_by(type=diaper_type)
        
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(Diaper.timestamp >= start_date_obj)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() + timedelta(days=1)
                query = query.filter(Diaper.timestamp < end_date_obj)
            except ValueError:
                pass
        
        # Order and limit
        query = query.order_by(Diaper.timestamp.desc())
        
        if limit and limit > 0:
            query = query.limit(limit)
        
        diapers = query.all()
        
        return jsonify([
            {
                'id': d.id,
                'babyId': d.baby_id,
                'type': d.type,  # 'wet', 'dirty', 'mixed'
                'timestamp': d.timestamp.isoformat() if d.timestamp else None,
                'consistency': d.consistency,  # 'normal', 'watery', 'hard'
                'color': d.color,  # 'yellow', 'green', 'brown', 'black', 'red', 'white'
                'amount': d.amount,  # 'light', 'medium', 'heavy'
                'notes': d.notes,
                'createdAt': d.created_at.isoformat() if d.created_at else None
            } for d in diapers
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get diaper history: {str(e)}"}), 500


# Get diaper statistics
@diaper_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_diaper_stats():
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', 'today')
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify({
                "total": 0,
                "wet": 0,
                "dirty": 0,
                "mixed": 0,
                "byHour": {},
                "trends": {}
            }), 200
        
        # Calculate date range based on period
        today = datetime.utcnow().date()
        if period == 'today':
            start_date = today
            end_date = today + timedelta(days=1)
        elif period == 'week':
            start_date = today - timedelta(days=7)
            end_date = today + timedelta(days=1)
        elif period == 'month':
            start_date = today - timedelta(days=30)
            end_date = today + timedelta(days=1)
        else:
            start_date = today
            end_date = today + timedelta(days=1)
        
        # Get diapers in date range
        diapers = Diaper.query.filter(
            Diaper.baby_id.in_(baby_ids),
            Diaper.timestamp >= start_date,
            Diaper.timestamp < end_date
        ).all()
        
        # Calculate basic stats
        total = len(diapers)
        wet = len([d for d in diapers if d.type == 'wet'])
        dirty = len([d for d in diapers if d.type == 'dirty'])
        mixed = len([d for d in diapers if d.type == 'mixed'])
        
        # Count by hour
        by_hour = {}
        for diaper in diapers:
            if diaper.timestamp:
                hour = diaper.timestamp.hour
                by_hour[hour] = by_hour.get(hour, 0) + 1
        
        # Sort by hour
        by_hour = dict(sorted(by_hour.items()))
        
        # Trends (last 7 days)
        trends = {}
        for i in range(7):
            day = today - timedelta(days=6-i)
            day_diapers = [d for d in diapers if d.timestamp and d.timestamp.date() == day]
            trends[day.strftime('%Y-%m-%d')] = {
                'total': len(day_diapers),
                'wet': len([d for d in day_diapers if d.type == 'wet']),
                'dirty': len([d for d in day_diapers if d.type == 'dirty']),
                'mixed': len([d for d in day_diapers if d.type == 'mixed'])
            }
        
        return jsonify({
            "total": total,
            "wet": wet,
            "dirty": dirty,
            "mixed": mixed,
            "byHour": by_hour,
            "trends": trends,
            "period": period
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get diaper stats: {str(e)}"}), 500


# Get diaper trends
@diaper_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_diaper_trends():
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
        
        # Get diapers in date range
        diapers = Diaper.query.filter(
            Diaper.baby_id.in_(baby_ids),
            Diaper.timestamp >= start_date,
            Diaper.timestamp < end_date_plus_one
        ).all()
        
        # Group by date
        trends = []
        current_date = start_date
        while current_date <= end_date:
            day_diapers = [d for d in diapers if d.timestamp and d.timestamp.date() == current_date]
            
            day_stats = {
                'date': current_date.strftime('%Y-%m-%d'),
                'total': len(day_diapers),
                'wet': len([d for d in day_diapers if d.type == 'wet']),
                'dirty': len([d for d in day_diapers if d.type == 'dirty']),
                'mixed': len([d for d in day_diapers if d.type == 'mixed']),
                'consistencyDistribution': {},
                'colorDistribution': {}
            }
            
            # Calculate consistency distribution
            for diaper in day_diapers:
                if diaper.consistency:
                    day_stats['consistencyDistribution'][diaper.consistency] = \
                        day_stats['consistencyDistribution'].get(diaper.consistency, 0) + 1
            
            # Calculate color distribution
            for diaper in day_diapers:
                if diaper.color:
                    day_stats['colorDistribution'][diaper.color] = \
                        day_stats['colorDistribution'].get(diaper.color, 0) + 1
            
            trends.append(day_stats)
            current_date += timedelta(days=1)
        
        return jsonify(trends), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get diaper trends: {str(e)}"}), 500


# Get weekly summary
@diaper_bp.route('/weekly-summary', methods=['GET'])
@jwt_required()
def get_weekly_summary():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify({
                "thisWeek": {"total": 0, "wet": 0, "dirty": 0, "mixed": 0},
                "lastWeek": {"total": 0, "wet": 0, "dirty": 0, "mixed": 0},
                "changePercentage": 0,
                "dailyAverages": {}
            }), 200
        
        today = datetime.utcnow().date()
        start_this_week = today - timedelta(days=today.weekday())
        start_last_week = start_this_week - timedelta(days=7)
        
        # This week's diapers
        diapers_this_week = Diaper.query.filter(
            Diaper.baby_id.in_(baby_ids),
            Diaper.timestamp >= start_this_week,
            Diaper.timestamp < today + timedelta(days=1)
        ).all()
        
        # Last week's diapers
        diapers_last_week = Diaper.query.filter(
            Diaper.baby_id.in_(baby_ids),
            Diaper.timestamp >= start_last_week,
            Diaper.timestamp < start_this_week
        ).all()
        
        # Calculate this week stats
        this_week = {
            "total": len(diapers_this_week),
            "wet": len([d for d in diapers_this_week if d.type == 'wet']),
            "dirty": len([d for d in diapers_this_week if d.type == 'dirty']),
            "mixed": len([d for d in diapers_this_week if d.type == 'mixed'])
        }
        
        # Calculate last week stats
        last_week = {
            "total": len(diapers_last_week),
            "wet": len([d for d in diapers_last_week if d.type == 'wet']),
            "dirty": len([d for d in diapers_last_week if d.type == 'dirty']),
            "mixed": len([d for d in diapers_last_week if d.type == 'mixed'])
        }
        
        # Calculate change percentage
        change_percentage = 0
        if last_week['total'] > 0:
            change_percentage = round(((this_week['total'] - last_week['total']) / last_week['total']) * 100, 1)
        
        # Calculate daily averages for this week
        daily_averages = {}
        for i in range(7):
            day = start_this_week + timedelta(days=i)
            if day <= today:
                day_diapers = [d for d in diapers_this_week if d.timestamp and d.timestamp.date() == day]
                daily_averages[day.strftime('%A')] = {
                    'total': len(day_diapers),
                    'wet': len([d for d in day_diapers if d.type == 'wet']),
                    'dirty': len([d for d in day_diapers if d.type == 'dirty']),
                    'mixed': len([d for d in day_diapers if d.type == 'mixed'])
                }
        
        return jsonify({
            "thisWeek": this_week,
            "lastWeek": last_week,
            "changePercentage": change_percentage,
            "dailyAverages": daily_averages
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get weekly summary: {str(e)}"}), 500


# Get diaper analytics
@diaper_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_diaper_analytics():
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', 'week')
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify({
                "overview": {},
                "patterns": {},
                "predictions": {},
                "recommendations": []
            }), 200
        
        # Calculate date range based on period
        today = datetime.utcnow().date()
        if period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        elif period == 'quarter':
            start_date = today - timedelta(days=90)
        else:
            start_date = today - timedelta(days=7)
        
        # Get diapers in date range
        diapers = Diaper.query.filter(
            Diaper.baby_id.in_(baby_ids),
            Diaper.timestamp >= start_date,
            Diaper.timestamp <= today
        ).all()
        
        # Overview statistics
        total_diapers = len(diapers)
        if total_diapers == 0:
            return jsonify({
                "overview": {},
                "patterns": {},
                "predictions": {},
                "recommendations": []
            }), 200
        
        # Type distribution
        type_distribution = {
            'wet': len([d for d in diapers if d.type == 'wet']),
            'dirty': len([d for d in diapers if d.type == 'dirty']),
            'mixed': len([d for d in diapers if d.type == 'mixed'])
        }
        
        # Consistency distribution
        consistency_distribution = {}
        for diaper in diapers:
            if diaper.consistency:
                consistency_distribution[diaper.consistency] = \
                    consistency_distribution.get(diaper.consistency, 0) + 1
        
        # Color distribution
        color_distribution = {}
        for diaper in diapers:
            if diaper.color:
                color_distribution[diaper.color] = color_distribution.get(diaper.color, 0) + 1
        
        # Hourly patterns
        hourly_patterns = {}
        for hour in range(24):
            hour_diapers = [d for d in diapers if d.timestamp and d.timestamp.hour == hour]
            if hour_diapers:
                hourly_patterns[hour] = {
                    'total': len(hour_diapers),
                    'wet': len([d for d in hour_diapers if d.type == 'wet']),
                    'dirty': len([d for d in hour_diapers if d.type == 'dirty']),
                    'mixed': len([d for d in hour_diapers if d.type == 'mixed'])
                }
        
        # Calculate daily averages
        days = (today - start_date).days + 1
        daily_average = total_diapers / days
        
        # Generate recommendations
        recommendations = []
        
        if daily_average < 4:
            recommendations.append("Consider increasing diaper checks - baby may need more frequent changes")
        
        if color_distribution.get('black') or color_distribution.get('red') or color_distribution.get('white'):
            recommendations.append("Unusual stool colors detected - consult with pediatrician if concerned")
        
        if consistency_distribution.get('watery', 0) > 3:
            recommendations.append("Multiple watery stools detected - monitor for signs of diarrhea")
        
        if consistency_distribution.get('hard', 0) > 2:
            recommendations.append("Hard stools detected - ensure adequate hydration")
        
        # Predictions (simplified)
        predictions = {
            "nextChange": "Within 2-3 hours",
            "peakHours": list(hourly_patterns.keys())[:3] if hourly_patterns else [],
            "supplyEstimate": f"Enough for {int(24 / daily_average) if daily_average > 0 else 0} days"
        }
        
        return jsonify({
            "overview": {
                "totalDiapers": total_diapers,
                "dailyAverage": round(daily_average, 1),
                "typeDistribution": type_distribution,
                "consistencyDistribution": consistency_distribution,
                "colorDistribution": color_distribution
            },
            "patterns": hourly_patterns,
            "predictions": predictions,
            "recommendations": recommendations,
            "period": period
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get diaper analytics: {str(e)}"}), 500


# Get a single diaper record
@diaper_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_diaper_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get diaper
        diaper = Diaper.query.get(id)
        if not diaper:
            return jsonify({"message": "Diaper record not found"}), 404
        
        # Verify diaper belongs to user's baby
        baby = BabyProfile.query.filter_by(id=diaper.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        return jsonify({
            'id': diaper.id,
            'babyId': diaper.baby_id,
            'type': diaper.type,
            'timestamp': diaper.timestamp.isoformat() if diaper.timestamp else None,
            'consistency': diaper.consistency,
            'color': diaper.color,
            'amount': diaper.amount,
            'notes': diaper.notes,
            'createdAt': diaper.created_at.isoformat() if diaper.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get diaper record: {str(e)}"}), 500


# Add a new diaper record
@diaper_bp.route('/', methods=['POST'])
@jwt_required()
def add_diaper():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        if not data.get('type'):
            return jsonify({"message": "Diaper type is required"}), 400
        
        if not data.get('timestamp'):
            return jsonify({"message": "Timestamp is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse timestamp
        try:
            timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"message": "Invalid timestamp format"}), 400
        
        # Validate timestamp is not in the future
        if timestamp > datetime.utcnow():
            return jsonify({"message": "Diaper time cannot be in the future"}), 400
        
        # Validate notes length
        if data.get('notes') and len(data['notes']) > 500:
            return jsonify({"message": "Notes cannot exceed 500 characters"}), 400
        
        # Create new diaper
        new_diaper = Diaper(
            baby_id=data['babyId'],
            type=data['type'],
            timestamp=timestamp,
            consistency=data.get('consistency'),
            color=data.get('color'),
            amount=data.get('amount'),
            notes=data.get('notes', '')
        )
        
        db.session.add(new_diaper)
        db.session.commit()
        
        return jsonify({
            'id': new_diaper.id,
            'babyId': new_diaper.baby_id,
            'type': new_diaper.type,
            'timestamp': new_diaper.timestamp.isoformat() if new_diaper.timestamp else None,
            'consistency': new_diaper.consistency,
            'color': new_diaper.color,
            'amount': new_diaper.amount,
            'notes': new_diaper.notes,
            'createdAt': new_diaper.created_at.isoformat() if new_diaper.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add diaper: {str(e)}"}), 500


# Update a diaper record
@diaper_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_diaper(id):
    try:
        user_id = get_jwt_identity()
        
        # Get diaper
        diaper = Diaper.query.get(id)
        if not diaper:
            return jsonify({"message": "Diaper record not found"}), 404
        
        # Verify diaper belongs to user's baby
        baby = BabyProfile.query.filter_by(id=diaper.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'type' in data:
            diaper.type = data['type']
        
        if 'timestamp' in data and data['timestamp']:
            try:
                timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
                if timestamp > datetime.utcnow():
                    return jsonify({"message": "Diaper time cannot be in the future"}), 400
                diaper.timestamp = timestamp
            except ValueError:
                return jsonify({"message": "Invalid timestamp format"}), 400
        
        if 'consistency' in data:
            diaper.consistency = data['consistency']
        
        if 'color' in data:
            diaper.color = data['color']
        
        if 'amount' in data:
            diaper.amount = data['amount']
        
        if 'notes' in data:
            if len(data['notes']) > 500:
                return jsonify({"message": "Notes cannot exceed 500 characters"}), 400
            diaper.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'id': diaper.id,
            'babyId': diaper.baby_id,
            'type': diaper.type,
            'timestamp': diaper.timestamp.isoformat() if diaper.timestamp else None,
            'consistency': diaper.consistency,
            'color': diaper.color,
            'amount': diaper.amount,
            'notes': diaper.notes,
            'createdAt': diaper.created_at.isoformat() if diaper.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update diaper: {str(e)}"}), 500


# Delete a diaper record
@diaper_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_diaper(id):
    try:
        user_id = get_jwt_identity()
        
        # Get diaper
        diaper = Diaper.query.get(id)
        if not diaper:
            return jsonify({"message": "Diaper record not found"}), 404
        
        # Verify diaper belongs to user's baby
        baby = BabyProfile.query.filter_by(id=diaper.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        db.session.delete(diaper)
        db.session.commit()
        
        return jsonify({"message": "Diaper record deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete diaper: {str(e)}"}), 500