from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request
from flask_migrate import Migrate
from werkzeug.utils import secure_filename
import os

from .database import db

from .routes.allergies_routes import allergies_bp
from .routes.bath_routes import bath_bp
from .routes.checkup_routes import checkup_bp
from .routes.diaper_routes import diaper_bp
from .routes.feed_routes import feed_bp
from .routes.sleep_routes import sleep_bp
from .routes.growth_routes import growth_bp
from .routes.babyprofile_routes import babyprofile_bp
from .routes.settings_routes import settings_bp
from .routes.notification_routes import notification_bp
from .routes.dashboard_routes import dashboard_bp
from .routes.auth_routes import auth_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///baby_monitor.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-super-secret-key')
app.config["JWT_SECRET_KEY"] = os.environ.get('JWT_SECRET_KEY', "a-super-secret-jwt-key")
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
app.config['UPLOAD_FOLDER'] = 'static/uploads/baby_photos'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

jwt = JWTManager(app)
db.init_app(app)
migrate = Migrate(app, db)

with app.app_context():
        from baby_backend import models
        db.create_all()


PUBLIC_ROUTES = [
    "/api/login",
    "/api/register"
]

@app.before_request
def protect_api_routes():
    if request.path in PUBLIC_ROUTES:
        return
    if request.path.startswith("/api"):
        try:
            verify_jwt_in_request()
        except:
            return jsonify({"message": "Login Required"}), 401

@app.route('/static/uploads/baby_photos/<path:filename>')
def get_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

protected_blueprints = [
    (allergies_bp, "/api/allergies"),
    (bath_bp, "/api/baths"),
    (checkup_bp, "/api/checkups"),
    (diaper_bp, "/api/diapers"),
    (feed_bp, "/api/feeding"),
    (sleep_bp, "/api/sleeps"),
    (growth_bp, "/api/growth"),
    (babyprofile_bp, "/api/babyprofile"),
    (settings_bp, "/api/settings"),
    (notification_bp, "/api/notifications"),
    (dashboard_bp, "/api/dashboard")
]

for bp, prefix in protected_blueprints:
    app.register_blueprint(bp, url_prefix=prefix)

@app.route('/')
def home():
    return jsonify({"message": "API Running"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
