from flask import Blueprint, request, jsonify, current_app
from ..database import db
from ..models import BabyProfile
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename

babyprofile_bp = Blueprint("babyprofile_bp", __name__)

def save_image(file):
    if not file:
        return None

    filename = secure_filename(file.filename)
    upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)


    os.makedirs(os.path.dirname(upload_path), exist_ok=True)
    
    file.save(upload_path)
    
  
    return f"/static/uploads/baby_photos/{filename}"


@babyprofile_bp.route("/", methods=["GET"])
@jwt_required()
def get_baby_profile():
    user_id = get_jwt_identity()
    profile = BabyProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({"message": "No baby profile found", "profile": None}), 200

    return jsonify(profile.to_dict()), 200


@babyprofile_bp.route("/", methods=["POST"])
@jwt_required()
def add_baby_profile():
    user_id = get_jwt_identity()

    full_name = request.form.get("fullName")
    dob = request.form.get("dob")

   
    if not full_name or not dob:
        return jsonify({"error": "fullName and dob are required"}), 400

    gender = request.form.get("gender")
    weight = request.form.get("weight")
    height = request.form.get("height")
    notes = request.form.get("notes")

    photo = None
    if "photo" in request.files:
        photo = save_image(request.files["photo"])

    new_profile = BabyProfile(
        full_name=full_name,
        dob=dob,
        gender=gender,
        weight=weight,
        height=height,
        photo=photo,
        notes=notes,
        user_id=user_id
    )

    db.session.add(new_profile)
    db.session.commit()

    return jsonify(new_profile.to_dict()), 201


@babyprofile_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_baby_profile(id):
    user_id = get_jwt_identity()
    profile = BabyProfile.query.filter_by(id=id, user_id=user_id).first()

    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    profile.full_name = request.form.get("fullName", profile.full_name)
    profile.dob = request.form.get("dob", profile.dob)
    profile.gender = request.form.get("gender", profile.gender)
    profile.weight = request.form.get("weight", profile.weight)
    profile.height = request.form.get("height", profile.height)
    profile.notes = request.form.get("notes", profile.notes)

    if "photo" in request.files:
        profile.photo = save_image(request.files["photo"])

    db.session.commit()
    
    return jsonify(profile.to_dict()), 200
