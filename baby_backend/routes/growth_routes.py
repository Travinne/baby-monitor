from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
from baby_backend.database import db
from ..models import Growth, BabyProfile

growth_bp = Blueprint('growth_bp', __name__)

# Get all growth records with optional filtering
@growth_bp.route('/', methods=['GET'])
@jwt_required()
def get_growth_data():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Get query parameters
        baby_id = request.args.get('babyId')
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        limit = request.args.get('limit', type=int)
        
        # Build query
        query = Growth.query.filter(Growth.baby_id.in_(baby_ids))
        
        # Apply filters
        if baby_id and baby_id in [str(id) for id in baby_ids]:
            query = query.filter_by(baby_id=int(baby_id))
        
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(Growth.date >= start_date_obj)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() + timedelta(days=1)
                query = query.filter(Growth.date < end_date_obj)
            except ValueError:
                pass
        
        # Order by date descending
        query = query.order_by(Growth.date.desc())
        
        if limit and limit > 0:
            query = query.limit(limit)
        
        growth_records = query.all()
        
        return jsonify([
            {
                'id': g.id,
                'babyId': g.baby_id,
                'date': g.date.isoformat() if g.date else None,
                'weight': float(g.weight) if g.weight else None,
                'height': float(g.height) if g.height else None,
                'headCircumference': float(g.head_circumference) if g.head_circumference else None,
                'weightPercentile': float(g.weight_percentile) if g.weight_percentile else None,
                'heightPercentile': float(g.height_percentile) if g.height_percentile else None,
                'headCircumferencePercentile': float(g.head_circumference_percentile) if g.head_circumference_percentile else None,
                'notes': g.notes,
                'createdAt': g.created_at.isoformat() if g.created_at else None
            } for g in growth_records
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get growth data: {str(e)}"}), 500


# Get growth statistics
@growth_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_growth_stats():
    try:
        user_id = get_jwt_identity()
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify({
                "totalRecords": 0,
                "lastUpdate": None,
                "averages": {
                    "weight": 0,
                    "height": 0,
                    "headCircumference": 0
                },
                "growthTrends": {}
            }), 200
        
        # Get all growth records for user's babies
        growth_records = Growth.query.filter(Growth.baby_id.in_(baby_ids)).all()
        
        total_records = len(growth_records)
        
        # Get last update
        last_update = None
        if growth_records:
            latest_record = max(growth_records, key=lambda x: x.date if x.date else datetime.min)
            last_update = latest_record.date.isoformat() if latest_record.date else None
        
        # Calculate averages
        weight_sum = sum(g.weight for g in growth_records if g.weight)
        height_sum = sum(g.height for g in growth_records if g.height)
        head_circumference_sum = sum(g.head_circumference for g in growth_records if g.head_circumference)
        
        weight_count = len([g for g in growth_records if g.weight])
        height_count = len([g for g in growth_records if g.height])
        head_circumference_count = len([g for g in growth_records if g.head_circumference])
        
        averages = {
            "weight": round(weight_sum / weight_count, 2) if weight_count > 0 else 0,
            "height": round(height_sum / height_count, 2) if height_count > 0 else 0,
            "headCircumference": round(head_circumference_sum / head_circumference_count, 2) if head_circumference_count > 0 else 0
        }
        
        # Calculate growth trends (last 3 records)
        growth_trends = {}
        for baby_id in baby_ids:
            baby_records = [g for g in growth_records if g.baby_id == baby_id]
            baby_records_sorted = sorted(baby_records, key=lambda x: x.date if x.date else datetime.min)
            
            if len(baby_records_sorted) >= 2:
                # Calculate weight gain
                oldest = baby_records_sorted[0]
                newest = baby_records_sorted[-1]
                
                if oldest.weight and newest.weight and oldest.date and newest.date:
                    days_diff = (newest.date - oldest.date).days
                    if days_diff > 0:
                        weight_gain = newest.weight - oldest.weight
                        weight_gain_per_day = weight_gain / days_diff
                    else:
                        weight_gain_per_day = 0
                else:
                    weight_gain_per_day = 0
                
                # Calculate height gain
                if oldest.height and newest.height and oldest.date and newest.date:
                    days_diff = (newest.date - oldest.date).days
                    if days_diff > 0:
                        height_gain = newest.height - oldest.height
                        height_gain_per_day = height_gain / days_diff
                    else:
                        height_gain_per_day = 0
                else:
                    height_gain_per_day = 0
                
                growth_trends[baby_id] = {
                    "weightGainPerDay": round(weight_gain_per_day, 3),
                    "heightGainPerDay": round(height_gain_per_day, 2),
                    "recordsCount": len(baby_records_sorted)
                }
            else:
                growth_trends[baby_id] = {
                    "weightGainPerDay": 0,
                    "heightGainPerDay": 0,
                    "recordsCount": len(baby_records_sorted)
                }
        
        return jsonify({
            "totalRecords": total_records,
            "lastUpdate": last_update,
            "averages": averages,
            "growthTrends": growth_trends
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get growth stats: {str(e)}"}), 500


# Get growth by date range
@growth_bp.route('/range', methods=['GET'])
@jwt_required()
def get_growth_by_range():
    try:
        user_id = get_jwt_identity()
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        
        if not start_date or not end_date:
            return jsonify({"message": "Start and end dates are required"}), 400
        
        # Get baby IDs for current user
        baby_ids = [baby.id for baby in BabyProfile.query.filter_by(user_id=user_id).all()]
        if not baby_ids:
            return jsonify([]), 200
        
        # Parse dates
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() + timedelta(days=1)
        except ValueError:
            return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        # Get growth records in date range
        growth_records = Growth.query.filter(
            Growth.baby_id.in_(baby_ids),
            Growth.date >= start_date_obj,
            Growth.date < end_date_obj
        ).order_by(Growth.date.asc()).all()
        
        return jsonify([
            {
                'id': g.id,
                'babyId': g.baby_id,
                'date': g.date.isoformat() if g.date else None,
                'weight': float(g.weight) if g.weight else None,
                'height': float(g.height) if g.height else None,
                'headCircumference': float(g.head_circumference) if g.head_circumference else None,
                'weightPercentile': float(g.weight_percentile) if g.weight_percentile else None,
                'heightPercentile': float(g.height_percentile) if g.height_percentile else None,
                'headCircumferencePercentile': float(g.head_circumference_percentile) if g.head_circumference_percentile else None,
                'notes': g.notes,
                'createdAt': g.created_at.isoformat() if g.created_at else None
            } for g in growth_records
        ]), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get growth by range: {str(e)}"}), 500


# Get a single growth record
@growth_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_growth_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get growth record
        growth = Growth.query.get(id)
        if not growth:
            return jsonify({"message": "Growth record not found"}), 404
        
        # Verify growth belongs to user's baby
        baby = BabyProfile.query.filter_by(id=growth.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        return jsonify({
            'id': growth.id,
            'babyId': growth.baby_id,
            'date': growth.date.isoformat() if growth.date else None,
            'weight': float(growth.weight) if growth.weight else None,
            'height': float(growth.height) if growth.height else None,
            'headCircumference': float(growth.head_circumference) if growth.head_circumference else None,
            'weightPercentile': float(growth.weight_percentile) if growth.weight_percentile else None,
            'heightPercentile': float(growth.height_percentile) if growth.height_percentile else None,
            'headCircumferencePercentile': float(growth.head_circumference_percentile) if growth.head_circumference_percentile else None,
            'notes': growth.notes,
            'createdAt': growth.created_at.isoformat() if growth.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Failed to get growth record: {str(e)}"}), 500


# Add a new growth record
@growth_bp.route('/', methods=['POST'])
@jwt_required()
def add_growth_record():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('babyId'):
            return jsonify({"message": "Baby ID is required"}), 400
        
        if not data.get('date'):
            return jsonify({"message": "Date is required"}), 400
        
        # Verify baby belongs to user
        baby = BabyProfile.query.filter_by(id=data['babyId'], user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Baby not found"}), 404
        
        # Parse date
        try:
            record_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            try:
                record_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00')).date()
            except ValueError:
                return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        # Check if a record already exists for this date and baby
        existing_record = Growth.query.filter_by(
            baby_id=data['babyId'], 
            date=record_date
        ).first()
        
        if existing_record:
            return jsonify({"message": "A record already exists for this date"}), 409
        
        # Validate measurements
        weight = data.get('weight')
        if weight is not None:
            if not isinstance(weight, (int, float)) or weight < 0.5 or weight > 50:
                return jsonify({"message": "Weight must be between 0.5kg and 50kg"}), 400
        
        height = data.get('height')
        if height is not None:
            if not isinstance(height, (int, float)) or height < 20 or height > 200:
                return jsonify({"message": "Height must be between 20cm and 200cm"}), 400
        
        head_circumference = data.get('headCircumference')
        if head_circumference is not None:
            if not isinstance(head_circumference, (int, float)) or head_circumference < 20 or head_circumference > 60:
                return jsonify({"message": "Head circumference must be between 20cm and 60cm"}), 400
        
        # Validate percentiles (0-100)
        weight_percentile = data.get('weightPercentile')
        if weight_percentile is not None and (weight_percentile < 0 or weight_percentile > 100):
            return jsonify({"message": "Weight percentile must be between 0 and 100"}), 400
        
        height_percentile = data.get('heightPercentile')
        if height_percentile is not None and (height_percentile < 0 or height_percentile > 100):
            return jsonify({"message": "Height percentile must be between 0 and 100"}), 400
        
        head_circumference_percentile = data.get('headCircumferencePercentile')
        if head_circumference_percentile is not None and (head_circumference_percentile < 0 or head_circumference_percentile > 100):
            return jsonify({"message": "Head circumference percentile must be between 0 and 100"}), 400
        
        # Create new growth record
        new_growth = Growth(
            baby_id=data['babyId'],
            date=record_date,
            weight=weight,
            height=height,
            head_circumference=head_circumference,
            weight_percentile=weight_percentile,
            height_percentile=height_percentile,
            head_circumference_percentile=head_circumference_percentile,
            notes=data.get('notes', '')
        )
        
        db.session.add(new_growth)
        db.session.commit()
        
        return jsonify({
            'id': new_growth.id,
            'babyId': new_growth.baby_id,
            'date': new_growth.date.isoformat() if new_growth.date else None,
            'weight': float(new_growth.weight) if new_growth.weight else None,
            'height': float(new_growth.height) if new_growth.height else None,
            'headCircumference': float(new_growth.head_circumference) if new_growth.head_circumference else None,
            'weightPercentile': float(new_growth.weight_percentile) if new_growth.weight_percentile else None,
            'heightPercentile': float(new_growth.height_percentile) if new_growth.height_percentile else None,
            'headCircumferencePercentile': float(new_growth.head_circumference_percentile) if new_growth.head_circumference_percentile else None,
            'notes': new_growth.notes,
            'createdAt': new_growth.created_at.isoformat() if new_growth.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to add growth record: {str(e)}"}), 500


# Update a growth record
@growth_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_growth_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get growth record
        growth = Growth.query.get(id)
        if not growth:
            return jsonify({"message": "Growth record not found"}), 404
        
        # Verify growth belongs to user's baby
        baby = BabyProfile.query.filter_by(id=growth.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'date' in data and data['date']:
            try:
                record_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
                # Check if another record already exists for this date and baby
                existing_record = Growth.query.filter(
                    Growth.baby_id == growth.baby_id,
                    Growth.date == record_date,
                    Growth.id != id
                ).first()
                
                if existing_record:
                    return jsonify({"message": "Another record already exists for this date"}), 409
                
                growth.date = record_date
            except ValueError:
                try:
                    record_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00')).date()
                    growth.date = record_date
                except ValueError:
                    return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        if 'weight' in data:
            if data['weight'] is not None:
                if not isinstance(data['weight'], (int, float)) or data['weight'] < 0.5 or data['weight'] > 50:
                    return jsonify({"message": "Weight must be between 0.5kg and 50kg"}), 400
                growth.weight = data['weight']
            else:
                growth.weight = None
        
        if 'height' in data:
            if data['height'] is not None:
                if not isinstance(data['height'], (int, float)) or data['height'] < 20 or data['height'] > 200:
                    return jsonify({"message": "Height must be between 20cm and 200cm"}), 400
                growth.height = data['height']
            else:
                growth.height = None
        
        if 'headCircumference' in data:
            if data['headCircumference'] is not None:
                if not isinstance(data['headCircumference'], (int, float)) or data['headCircumference'] < 20 or data['headCircumference'] > 60:
                    return jsonify({"message": "Head circumference must be between 20cm and 60cm"}), 400
                growth.head_circumference = data['headCircumference']
            else:
                growth.head_circumference = None
        
        if 'weightPercentile' in data:
            if data['weightPercentile'] is not None:
                if data['weightPercentile'] < 0 or data['weightPercentile'] > 100:
                    return jsonify({"message": "Weight percentile must be between 0 and 100"}), 400
                growth.weight_percentile = data['weightPercentile']
            else:
                growth.weight_percentile = None
        
        if 'heightPercentile' in data:
            if data['heightPercentile'] is not None:
                if data['heightPercentile'] < 0 or data['heightPercentile'] > 100:
                    return jsonify({"message": "Height percentile must be between 0 and 100"}), 400
                growth.height_percentile = data['heightPercentile']
            else:
                growth.height_percentile = None
        
        if 'headCircumferencePercentile' in data:
            if data['headCircumferencePercentile'] is not None:
                if data['headCircumferencePercentile'] < 0 or data['headCircumferencePercentile'] > 100:
                    return jsonify({"message": "Head circumference percentile must be between 0 and 100"}), 400
                growth.head_circumference_percentile = data['headCircumferencePercentile']
            else:
                growth.head_circumference_percentile = None
        
        if 'notes' in data:
            growth.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'id': growth.id,
            'babyId': growth.baby_id,
            'date': growth.date.isoformat() if growth.date else None,
            'weight': float(growth.weight) if growth.weight else None,
            'height': float(growth.height) if growth.height else None,
            'headCircumference': float(growth.head_circumference) if growth.head_circumference else None,
            'weightPercentile': float(growth.weight_percentile) if growth.weight_percentile else None,
            'heightPercentile': float(growth.height_percentile) if growth.height_percentile else None,
            'headCircumferencePercentile': float(growth.head_circumference_percentile) if growth.head_circumference_percentile else None,
            'notes': growth.notes,
            'createdAt': growth.created_at.isoformat() if growth.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update growth record: {str(e)}"}), 500


# Delete a growth record
@growth_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_growth_record(id):
    try:
        user_id = get_jwt_identity()
        
        # Get growth record
        growth = Growth.query.get(id)
        if not growth:
            return jsonify({"message": "Growth record not found"}), 404
        
        # Verify growth belongs to user's baby
        baby = BabyProfile.query.filter_by(id=growth.baby_id, user_id=user_id).first()
        if not baby:
            return jsonify({"message": "Access denied"}), 403
        
        db.session.delete(growth)
        db.session.commit()
        
        return jsonify({"message": "Growth record deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete growth record: {str(e)}"}), 500