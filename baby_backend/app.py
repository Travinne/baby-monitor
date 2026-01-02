from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity
from datetime import timedelta
import logging
from logging.handlers import RotatingFileHandler
import os

from baby_backend.database import db
from .routes.auth_routes import auth_bp
from .routes.allergies_routes import allergies_bp
from .routes.bath_routes import bath_bp
from .routes.checkup_routes import checkup_bp
from .routes.diaper_routes import diaper_bp
from .routes.feed_routes import feed_bp
from .routes.sleep_routes import sleep_bp
from .routes.growth_routes import growth_bp
from .routes.babyprofile_routes import baby_bp
from .routes.settings_routes import settings_bp
from .routes.notification_routes import notification_bp


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///baby_monitor.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = "static/uploads/baby_photos"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    LOG_FILE = "logs/app.log"

    API_VERSION = "1.0.0"

    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "https://baby-monitor-app-git-main-travinnes-projects.vercel.app",
        "https://baby-monitor-3vgm.onrender.com",
    ]


def setup_logging(app):
    os.makedirs(os.path.dirname(app.config["LOG_FILE"]), exist_ok=True)
    level = getattr(logging, app.config["LOG_LEVEL"].upper(), logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s: %(message)s [%(pathname)s:%(lineno)d]"
    )

    file_handler = RotatingFileHandler(
        app.config["LOG_FILE"], maxBytes=10_000_000, backupCount=5
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(level)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)

    app.logger.handlers.clear()
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(level)


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    setup_logging(app)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    jwt = JWTManager(app)

    # Enable CORS for all routes
    CORS(
        app,
        resources={
            r"/api/*": {"origins": app.config["CORS_ORIGINS"]},
            r"/uploads/*": {"origins": app.config["CORS_ORIGINS"]},
        },
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        expose_headers=["Content-Disposition"],
    )

    @app.before_request
    def auth_guard():
        # Skip auth for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return None

        # Skip auth for auth routes, static files, and root
        if request.path.startswith("/api/auth"):
            return None

        if request.path.startswith("/uploads/"):
            return None

        if request.path == "/" or request.path == "/api/docs":
            return None

        # Require JWT for all other API routes
        if request.path.startswith("/api"):
            try:
                verify_jwt_in_request()
            except Exception as e:
                app.logger.warning(f"JWT verification failed: {str(e)}")
                return jsonify({"message": "Authentication required"}), 401

    @app.route("/")
    def index():
        return jsonify(
            {
                "message": "Baby Monitor API",
                "version": app.config["API_VERSION"],
                "api_base": "/api",
                "documentation": "/api/docs",
                "status": "healthy",
            }
        )

    @app.route("/api/docs")
    def docs():
        return jsonify(
            {
                "name": "Baby Monitor API",
                "version": app.config["API_VERSION"],
                "endpoints": {
                    "auth": {
                        "login": "POST /api/auth/login",
                        "register": "POST /api/auth/register",
                        "logout": "POST /api/auth/logout",
                        "verify": "GET /api/auth/verify",
                    },
                    "baby": {
                        "get_all": "GET /api/baby",
                        "create": "POST /api/baby",
                        "get_one": "GET /api/baby/<id>",
                        "update": "PUT /api/baby/<id>",
                        "delete": "DELETE /api/baby/<id>",
                        "upload_photo": "POST /api/baby/<id>/photo",
                    },
                    "feedings": {
                        "get_all": "GET /api/feedings",
                        "create": "POST /api/feedings",
                        "get_by_baby": "GET /api/feedings/baby/<baby_id>",
                    },
                    "sleep": {
                        "get_all": "GET /api/sleep",
                        "create": "POST /api/sleep",
                        "get_by_baby": "GET /api/sleep/baby/<baby_id>",
                    },
                    "diapers": {
                        "get_all": "GET /api/diapers",
                        "create": "POST /api/diapers",
                        "get_by_baby": "GET /api/diapers/baby/<baby_id>",
                    },
                    "baths": {
                        "get_all": "GET /api/baths",
                        "create": "POST /api/baths",
                        "get_by_baby": "GET /api/baths/baby/<baby_id>",
                    },
                    "growth": {
                        "get_all": "GET /api/growth",
                        "create": "POST /api/growth",
                        "get_by_baby": "GET /api/growth/baby/<baby_id>",
                    },
                    "checkups": {
                        "get_all": "GET /api/checkups",
                        "create": "POST /api/checkups",
                        "get_by_baby": "GET /api/checkups/baby/<baby_id>",
                    },
                    "allergies": {
                        "get_all": "GET /api/allergies",
                        "create": "POST /api/allergies",
                        "get_by_baby": "GET /api/allergies/baby/<baby_id>",
                    },
                    "settings": {
                        "get": "GET /api/settings",
                        "update": "PUT /api/settings",
                    },
                    "notifications": {
                        "get_all": "GET /api/notifications",
                        "mark_read": "PUT /api/notifications/<id>/read",
                        "mark_all_read": "PUT /api/notifications/read-all",
                    },
                },
            }
        )

    @app.route("/uploads/baby_photos/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(allergies_bp, url_prefix="/api/allergies")
    app.register_blueprint(bath_bp, url_prefix="/api/baths")
    app.register_blueprint(checkup_bp, url_prefix="/api/checkups")
    app.register_blueprint(diaper_bp, url_prefix="/api/diapers")
    app.register_blueprint(feed_bp, url_prefix="/api/feedings")
    app.register_blueprint(sleep_bp, url_prefix="/api/sleep")
    app.register_blueprint(growth_bp, url_prefix="/api/growth")
    app.register_blueprint(baby_bp, url_prefix="/api/baby")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")
    app.register_blueprint(notification_bp, url_prefix="/api/notifications")

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)