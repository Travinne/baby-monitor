from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request
from flask_migrate import Migrate
import os

from database import db
from routes.auth_routes import auth_bp
from routes.allergies_routes import allergies_bp
from routes.bath_routes import bath_bp
from routes.checkup_routes import checkup_bp
from routes.diaper_routes import diaper_bp
from routes.feed_routes import feed_bp
from routes.sleep_routes import sleep_bp
from routes.growth_routes import growth_bp
from routes.babyprofile_routes import babyprofile_bp
from routes.settings_routes import settings_bp
from routes.notification_routes import notification_bp
from routes.dashboard_routes import dashboard_bp

app = Flask(__name__)

# CORS setup: allow multiple origins
CORS(
    app,
    origins=[
        "https://baby-monitor-mf1e.vercel.app",
        "https://baby-monitor-app.vercel.app",
        "http://localhost:5173"  # local dev
    ],
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type", "Authorization"]
)

# Flask config
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", "sqlite:///baby_monitor.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "a-super-secret-jwt-key"
)
app.config["UPLOAD_FOLDER"] = "static/uploads/baby_photos"
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Initialize extensions
jwt = JWTManager(app)
db.init_app(app)
Migrate(app, db)

with app.app_context():
    import models
    db.create_all()

# Public routes that don't require JWT
PUBLIC_ROUTES = ["/api/login", "/api/register"]

@app.before_request
def protect_routes():
    # Always allow preflight OPTIONS requests
    if request.method == "OPTIONS":
        return {}, 200
    # Allow public routes
    for route in PUBLIC_ROUTES:
        if request.path.startswith(route):
            return
    # Require JWT for all other /api routes
    if request.path.startswith("/api"):
        try:
            verify_jwt_in_request()
        except:
            return jsonify({"message": "Login Required"}), 401

# Static files (uploaded baby photos)
@app.route("/static/uploads/baby_photos/<path:filename>")
def get_uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(allergies_bp, url_prefix="/api/allergies")
app.register_blueprint(bath_bp, url_prefix="/api/baths")
app.register_blueprint(checkup_bp, url_prefix="/api/checkups")
app.register_blueprint(diaper_bp, url_prefix="/api/diapers")
app.register_blueprint(feed_bp, url_prefix="/api/feeding")
app.register_blueprint(sleep_bp, url_prefix="/api/sleeps")
app.register_blueprint(growth_bp, url_prefix="/api/growth")
app.register_blueprint(babyprofile_bp, url_prefix="/api/babyprofile")
app.register_blueprint(settings_bp, url_prefix="/api/settings")
app.register_blueprint(notification_bp, url_prefix="/api/notifications")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
