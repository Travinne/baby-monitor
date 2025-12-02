from flask import Blueprint, jsonify

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/', methods=['GET'])
def get_dashboard():
    data = {
        'total_feeds': 10,
        'total_diapers': 5,
        'total_sleep_hours': 12,
        'growth_records': 3
    }
    return jsonify(data)