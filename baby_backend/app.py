"""
Baby Monitor API - Main Application Module
"""
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity
from functools import wraps
import os
from datetime import timedelta
import logging
from logging.handlers import RotatingFileHandler
import time

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

# Configuration
class Config:
    """Application configuration."""
    # Security
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    
    # JWT Settings
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///baby_monitor.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    
    # File Upload
    UPLOAD_FOLDER = "static/uploads/baby_photos"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # CORS Origins - Updated to include localhost:5175 and allow localhost on any port
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",  # Added this port
        "http://localhost:3000",
        "http://localhost:*",  # Allows any localhost port
        "https://baby-monitor-3vgm.onrender.com",
        "https://baby-monitor-frontend.vercel.app"
    ]
    
    # Rate Limiting (in-memory for development, use Redis in production)
    RATELIMIT_ENABLED = os.environ.get("RATELIMIT_ENABLED", "False").lower() == "true"
    RATELIMIT_DEFAULT = "200 per day;50 per hour"
    
    # Logging
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    LOG_FILE = "logs/app.log"
    
    # API Version
    API_VERSION = "1.0.0"


def setup_logging(app):
    """Configure application logging."""
    log_level = getattr(logging, app.config["LOG_LEVEL"].upper())
    
    # Create logs directory if it doesn't exist
    os.makedirs(os.path.dirname(app.config["LOG_FILE"]), exist_ok=True)
    
    # File handler with rotation
    file_handler = RotatingFileHandler(
        app.config["LOG_FILE"],
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    # Remove default handlers
    app.logger.handlers.clear()
    
    # Add handlers
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)


def create_app(config_class=Config):
    """Application factory."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Setup logging
    setup_logging(app)
    
    # Log startup
    app.logger.info("Baby Monitor API starting up...")
    app.logger.info(f"Log level: {app.config['LOG_LEVEL']}")
    app.logger.info(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    
    # More flexible CORS configuration
    CORS(app, 
         origins=app.config["CORS_ORIGINS"],
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept"],
         expose_headers=["Content-Type", "Authorization"],
         max_age=600)
    
    # Public routes that don't require JWT
    PUBLIC_ROUTES = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/check-availability",
        "/api/docs",
        "/",  # Root endpoint
    ]
    
    # Rate limiting decorator (simplified without flask_limiter dependency)
    def rate_limit(limit=100, per=3600):
        """Simple rate limiting decorator."""
        from collections import defaultdict
        from time import time
        
        requests = defaultdict(list)
        
        def decorator(f):
            @wraps(f)
            def wrapped(*args, **kwargs):
                if not app.config["RATELIMIT_ENABLED"]:
                    return f(*args, **kwargs)
                
                ip = request.remote_addr
                current_time = time()
                
                # Clean old requests
                requests[ip] = [req_time for req_time in requests[ip] 
                               if current_time - req_time < per]
                
                # Check if limit exceeded
                if len(requests[ip]) >= limit:
                    app.logger.warning(f"Rate limit exceeded for IP: {ip}")
                    return jsonify({
                        "success": False,
                        "message": "Rate limit exceeded. Please try again later.",
                        "retry_after": per
                    }), 429
                
                # Add current request
                requests[ip].append(current_time)
                return f(*args, **kwargs)
            return wrapped
        return decorator
    
    # Add request time to environ
    @app.before_request
    def start_timer():
        request.environ['REQUEST_TIME'] = time.time()
    
    @app.before_request
    def before_request():
        """Process requests before they reach endpoints."""
        # Skip logging for health checks
        if request.path not in ['/api/health', '/health', '/']:
            app.logger.info(f"Request: {request.method} {request.path} - IP: {request.remote_addr}")
        
        # Handle OPTIONS preflight
        if request.method == 'OPTIONS':
            response = jsonify({'status': 'ok'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Max-Age', '600')
            return response
    
    @app.before_request
    def protect_routes():
        """Protect API routes with JWT authentication."""
        # Skip JWT verification for OPTIONS requests
        if request.method == 'OPTIONS':
            return
        
        # Skip JWT for public routes
        if any(request.path.startswith(route) for route in PUBLIC_ROUTES):
            return
        
        # Skip JWT for static files
        if request.path.startswith("/static/") or request.path.startswith("/uploads/"):
            return
        
        # Require JWT for all routes (including health endpoints)
        try:
            verify_jwt_in_request()
            # Log successful authentication
            user_id = get_jwt_identity()
            app.logger.debug(f"Authenticated request from user: {user_id}")
        except Exception as e:
            app.logger.warning(f"Authentication failed for {request.path}: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Authentication required",
                "error": str(e) if app.debug else "Invalid or missing token"
            }), 401
    
    # JWT callbacks
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "message": "Token has expired",
            "is_expired": True
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "success": False,
            "message": "Invalid token",
            "error": str(error) if app.debug else "Invalid token format"
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            "success": False,
            "message": "Authorization token is missing",
            "error": str(error) if app.debug else "Missing authorization header"
        }), 401
    
    # Static files
    @app.route("/uploads/baby_photos/<path:filename>")
    def get_uploaded_file(filename):
        """Serve uploaded files."""
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
    
    # API Documentation/Info endpoint
    @app.route("/api/docs")
    def api_documentation():
        """API documentation endpoint."""
        return jsonify({
            "name": "Baby Monitor API",
            "version": app.config["API_VERSION"],
            "endpoints": {
                "auth": "/api/auth",
                "baby": "/api/baby",
                "feedings": "/api/feedings",
                "sleep": "/api/sleep",
                "diapers": "/api/diapers",
                "baths": "/api/baths",
                "growth": "/api/growth",
                "checkups": "/api/checkups",
                "allergies": "/api/allergies",
                "settings": "/api/settings",
                "notifications": "/api/notifications"
            },
            "documentation": "See API documentation for detailed endpoint information",
            "authentication": "JWT Bearer token required for protected endpoints"
        })
    
    # Health check endpoint with rate limiting - PROTECTED WITH JWT
    @app.route("/api/health")
    @app.route("/health")
    @rate_limit(limit=10, per=60)  # 10 requests per minute
    def health_check():
        """Health check endpoint - now requires authentication."""
        try:
            # Check database connection
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
            app.logger.error(f"Database health check failed: {e}")
        
        request_time = request.environ.get('REQUEST_TIME', time.time())
        response_time = time.time() - request_time
        
        # Get user info from JWT
        user_id = get_jwt_identity()
        
        return jsonify({
            "status": "healthy",
            "service": "Baby Monitor API",
            "version": app.config["API_VERSION"],
            "timestamp": time.time(),
            "response_time": f"{response_time:.3f}s",
            "database": db_status,
            "environment": "production" if not app.debug else "development",
            "authenticated_user": user_id
        }), 200
    
    # Root endpoint - PUBLIC
    @app.route("/")
    def index():
        """Root endpoint - remains public."""
        return jsonify({
            "message": "Baby Monitor API",
            "version": app.config["API_VERSION"],
            "documentation": "/api/docs",
            "health_check": "/api/health (requires authentication)",
            "api_base": "/api"
        })
    
    # Register blueprints
    BLUEPRINTS = [
        (auth_bp, "/api/auth"),
        (allergies_bp, "/api/allergies"),
        (bath_bp, "/api/baths"),
        (checkup_bp, "/api/checkups"),
        (diaper_bp, "/api/diapers"),
        (feed_bp, "/api/feedings"),
        (sleep_bp, "/api/sleep"),
        (growth_bp, "/api/growth"),
        (baby_bp, "/api/baby"),
        (settings_bp, "/api/settings"),
        (notification_bp, "/api/notifications"),
    ]
    
    for blueprint, url_prefix in BLUEPRINTS:
        app.register_blueprint(blueprint, url_prefix=url_prefix)
        app.logger.debug(f"Registered blueprint: {blueprint.name} at {url_prefix}")
    
    # Database initialization CLI commands
    @app.cli.command("init-db")
    def init_db_command():
        """Initialize the database."""
        with app.app_context():
            db.create_all()
            app.logger.info("Database tables created successfully")
            print("✓ Database tables created successfully")
    
    @app.cli.command("seed-db")
    def seed_db_command():
        """Seed the database with initial data."""
        try:
            from .seed import seed_database
            with app.app_context():
                seed_database()
                app.logger.info("Database seeded successfully")
                print("✓ Database seeded successfully")
        except ImportError:
            app.logger.error("Seed module not found")
            print("✗ Seed module not found. Make sure seed.py exists in baby_backend directory.")
    
    # Create database tables on startup (only in development)
    with app.app_context():
        try:
            db.create_all()
            app.logger.info("Database tables initialized")
        except Exception as e:
            app.logger.error(f"Failed to initialize database: {e}")
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        app.logger.warning(f"404 Not Found: {request.path} from {request.remote_addr}")
        return jsonify({
            "success": False,
            "message": "Resource not found",
            "path": request.path,
            "error": str(error) if app.debug else "Not Found"
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        app.logger.warning(f"405 Method Not Allowed: {request.method} {request.path}")
        return jsonify({
            "success": False,
            "message": "Method not allowed",
            "allowed_methods": ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            "error": str(error) if app.debug else "Method Not Allowed"
        }), 405
    
    @app.errorhandler(429)
    def ratelimit_handler(error):
        app.logger.warning(f"429 Rate Limit Exceeded: {request.remote_addr} {request.path}")
        return jsonify({
            "success": False,
            "message": "Rate limit exceeded",
            "error": "Too many requests. Please try again later."
        }), 429
    
    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error(f"500 Internal Server Error: {error}")
        return jsonify({
            "success": False,
            "message": "Internal server error",
            "error": str(error) if app.debug else "An internal error occurred",
            "request_id": id(request)
        }), 500
    
    # Request teardown
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        """Clean up database session after each request."""
        if exception:
            app.logger.error(f"Request teardown with exception: {exception}")
        db.session.remove()
    
    app.logger.info("Baby Monitor API is ready to handle requests")
    app.logger.info(f"Running in {'production' if not app.debug else 'development'} mode")
    app.logger.info(f"CORS enabled for origins: {app.config['CORS_ORIGINS']}")
    app.logger.info(f"Health endpoints (/api/health, /health) now require JWT authentication")
    
    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
    
    print(f"🚀 Starting Baby Monitor API on port {port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"📊 API Version: {Config.API_VERSION}")
    print(f"🗄️  Database: {Config.SQLALCHEMY_DATABASE_URI}")
    print(f"📝 Logs: {Config.LOG_FILE}")
    print(f"🌐 CORS Origins: {Config.CORS_ORIGINS}")
    print(f"🔐 JWT Enabled: Yes")
    print("-" * 50)
    
    app.run(host="0.0.0.0", port=port, debug=debug)