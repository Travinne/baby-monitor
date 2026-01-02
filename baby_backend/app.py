from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request
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
    JWTManager(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    )

    @app.before_request
    def auth_guard():
        if request.method == "OPTIONS":
            return None

        if request.path.startswith("/api/auth"):
            return None

        if not request.path.startswith("/api"):
            return None

        verify_jwt_in_request()

    @app.route("/")
    def index():
        return jsonify(
            {
                "message": "Baby Monitor API",
                "version": app.config["API_VERSION"],
                "api_base": "/api",
                "documentation": "/api/docs",
            }
        )

    @app.route("/api/docs")
    def docs():
        return jsonify(
            {
                "name": "Baby Monitor API",
                "version": app.config["API_VERSION"],
                "auth": "/api/auth",
                "baby": "/api/baby",
                "feedings": "/api/feedings",
                "sleep": "/api/sleep",
                "diapers": "/api/diapers",
                "baths": "/api/baths",
                "growth": "/api/growth",
                "checkups": "/api/checkups",
                "allergies": "/api/allergies",
            }
        )

    @app.route("/uploads/baby_photos/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

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
    app.run(host="0.0.0.0", port=port)
