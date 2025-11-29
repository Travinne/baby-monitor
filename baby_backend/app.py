from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
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


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///baby_monitor.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'


app.config["JWT_SECRET_KEY"] = "super-secret-jwt" 
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"

jwt = JWTManager(app)


app.config['UPLOAD_FOLDER'] = 'static/uploads/baby_photos'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)
migrate = Migrate(app, db)

@app.route('/static/uploads/baby_photos/<path:filename>')
def get_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


app.register_blueprint(auth_bp, url_prefix="/api")


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
    return jsonify({"message": " API Running, Login Required First!"})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
