from contextlib import asynccontextmanager
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config.settings import settings
from app.database.connection import engine, SessionLocal
from app.database.base import Base
# Import all models to ensure they are registered on Base.metadata
import app.models  # noqa: F401
from app.models.user import User
from app.models.det import Det
from app.models.vehicle_model import VehicleModel
from app.models.vehicle import Vehicle
from app.models.recovery import Recovery
from app.services.user_service import hash_password
from app.controllers.router import api_router


def seed_initial_tactical_data(db):
    """Seed initial military detachments, vehicle models, random vehicles in dets, and sample recoveries."""
    # 1. Seed Detachments if none exist
    dets_count = db.query(Det).count()
    if dets_count == 0:
        default_dets = [
            Det(name="106 FWC", latitude=27.5861, longitude=91.8594, description="Forward Workshop Company 106 FWC"),
            Det(name="202 FWC", latitude=27.4200, longitude=91.7500, description="Forward Workshop Company 202 FWC"),
            Det(name="306 FWC", latitude=27.6500, longitude=91.6800, description="Forward Workshop Company 306 FWC"),
            Det(name="63 FWC", latitude=27.4800, longitude=92.1200, description="Forward Workshop Company 63 FWC"),
            Det(name="847 FWC", latitude=27.6100, longitude=92.0500, description="Forward Workshop Company 847 FWC"),
            Det(name="848 FWC", latitude=27.3500, longitude=92.2000, description="Forward Workshop Company 848 FWC"),
        ]
        db.add_all(default_dets)
        db.commit()
        print("✓ Initialized 6 Tactical AOR Detachments")

    all_dets = db.query(Det).all()

    # 2. Seed Vehicle Models if none exist
    models_count = db.query(VehicleModel).count()
    if models_count == 0:
        default_models = [
            VehicleModel(name="Armored Recovery Vehicle (ARV)", critical_margin=10.0),
            VehicleModel(name="Heavy Tow Wrecker (8x8)", critical_margin=15.0),
            VehicleModel(name="Tactical Winch Extraction Truck", critical_margin=8.0),
            VehicleModel(name="Mobile Hydraulic Crane 20T", critical_margin=12.0),
            VehicleModel(name="Lowboy Heavy Flatbed Transporter", critical_margin=20.0),
            VehicleModel(name="Light Field Repair Unit (4x4)", critical_margin=5.0),
        ]
        db.add_all(default_models)
        db.commit()
        print("✓ Initialized 6 Vehicle Hardware Models")

    all_models = db.query(VehicleModel).all()

    # 3. Seed Random Vehicles in Dets if vehicle count is low
    veh_count = db.query(Vehicle).count()
    if veh_count < 12 and all_dets and all_models:
        random.seed(42)
        vehicle_types = [
            "Heavy ARV",
            "Wrecker 8x8",
            "Hydraulic Crane",
            "Winch Extractor",
            "Light Field Unit",
            "Heavy Transporter",
        ]
        statuses = ["Serviceable", "Serviceable", "Serviceable", "Serviceable", "Unserviceable"]

        new_vehicles = []
        for det in all_dets:
            # Add 3 to 4 vehicles randomly in each Det
            num_vehs = random.randint(3, 4)
            for _ in range(num_vehs):
                model = random.choice(all_models)
                v_type = random.choice(vehicle_types)
                v_status = random.choice(statuses)
                v_limit = round(random.uniform(3.0, 12.0), 1)
                veh = Vehicle(
                    vehicle_model_id=model.id,
                    det_id=det.id,
                    vehicle_type=v_type,
                    status=v_status,
                    critical_limit=v_limit,
                )
                new_vehicles.append(veh)

        db.add_all(new_vehicles)
        db.commit()
        print(f"✓ Randomly populated {len(new_vehicles)} tactical vehicles across {len(all_dets)} Detachments")

    # 4. Seed Sample Recovery Activities across the 6 Casualty Categories if empty
    rec_count = db.query(Recovery).count()
    if rec_count == 0 and all_dets:
        sample_recoveries = [
            Recovery(
                date="2026-08-18",
                time_taken_recovery=2.5,
                det_id=all_dets[0].id,
                description="30 KVA Generator alternator failure at high-altitude forward post.",
                casualty_type="Generator",
                cas_vehicle_equipment_name="30 KVA Genr",
                from_lat=all_dets[0].latitude + 0.04,
                from_lng=all_dets[0].longitude + 0.03,
                from_place_description="Post Klemta Grid 4",
                to_lat=all_dets[0].latitude,
                to_lng=all_dets[0].longitude,
                to_place_description="106 FWC Workshop Bay",
                effectiveness_index=95.0,
                call_received_time="08:30",
                time_to_reach=0.5,
                status="Completed",
            ),
            Recovery(
                date="2026-08-16",
                time_taken_recovery=3.0,
                det_id=all_dets[0].id,
                description="15 KVA Generator overheated on continuous operational load.",
                casualty_type="Generator",
                cas_vehicle_equipment_name="15 KVA Genr",
                from_lat=all_dets[0].latitude + 0.06,
                from_lng=all_dets[0].longitude - 0.02,
                from_place_description="Maratha Ground Bunker 2",
                to_lat=all_dets[0].latitude,
                to_lng=all_dets[0].longitude,
                to_place_description="106 FWC Base Depot",
                effectiveness_index=90.0,
                call_received_time="11:15",
                time_to_reach=0.6,
                status="Completed",
            ),
            Recovery(
                date="2026-08-24",
                time_taken_recovery=1.8,
                det_id=all_dets[0].id,
                description="5 KVA portable tactical generator ignition breakdown.",
                casualty_type="Generator",
                cas_vehicle_equipment_name="5 KVA Genr",
                from_lat=all_dets[0].latitude - 0.03,
                from_lng=all_dets[0].longitude + 0.05,
                from_place_description="APJD Zong Forward Post",
                to_lat=all_dets[0].latitude,
                to_lng=all_dets[0].longitude,
                to_place_description="106 FWC Heavy Maintenance Bay",
                effectiveness_index=98.0,
                call_received_time="14:00",
                time_to_reach=0.4,
                status="Active",
            ),
            Recovery(
                date="2026-08-07",
                time_taken_recovery=4.2,
                det_id=all_dets[0].id,
                description="2.5 Ton tactical troop carrier transmission locked in mud road.",
                casualty_type="Heavy Vehicle",
                cas_vehicle_equipment_name="2.5 Ton Truck",
                from_lat=all_dets[0].latitude + 0.09,
                from_lng=all_dets[0].longitude + 0.07,
                from_place_description="Shungester Pass Sector",
                to_lat=all_dets[0].latitude,
                to_lng=all_dets[0].longitude,
                to_place_description="106 FWC Heavy Workshop",
                effectiveness_index=88.0,
                call_received_time="07:45",
                time_to_reach=1.1,
                status="Completed",
            ),
            Recovery(
                date="2026-08-12",
                time_taken_recovery=2.0,
                det_id=all_dets[1 % len(all_dets)].id,
                description="Gypsy 4x4 reconnaissance vehicle broken steering tie rod.",
                casualty_type="Light Vehicle",
                cas_vehicle_equipment_name="Gypsy 4x4 Patrol",
                from_lat=all_dets[1 % len(all_dets)].latitude + 0.05,
                from_lng=all_dets[1 % len(all_dets)].longitude - 0.04,
                from_place_description="Lumla Valley Checkpoint",
                to_lat=all_dets[1 % len(all_dets)].latitude,
                to_lng=all_dets[1 % len(all_dets)].longitude,
                to_place_description="202 FWC Workshop",
                effectiveness_index=96.0,
                call_received_time="13:20",
                time_to_reach=0.5,
                status="Active",
            ),
            Recovery(
                date="2026-08-19",
                time_taken_recovery=5.0,
                det_id=all_dets[2 % len(all_dets)].id,
                description="JCB Earthmover hydraulic line rupture during track clearing.",
                casualty_type="Engineering Equipment",
                cas_vehicle_equipment_name="JCB Earthmover 3DX",
                from_lat=all_dets[2 % len(all_dets)].latitude + 0.08,
                from_lng=all_dets[2 % len(all_dets)].longitude - 0.06,
                from_place_description="Nehya Mountain Cutting Site",
                to_lat=all_dets[2 % len(all_dets)].latitude,
                to_lng=all_dets[2 % len(all_dets)].longitude,
                to_place_description="306 FWC Heavy Bay",
                effectiveness_index=0.0,
                call_received_time="06:30",
                time_to_reach=0.8,
                status="Abort",
            ),
            Recovery(
                date="2026-08-22",
                time_taken_recovery=3.5,
                det_id=all_dets[3 % len(all_dets)].id,
                description="Tracked field ambulance electrical battery failure.",
                casualty_type="Special Vehicle",
                cas_vehicle_equipment_name="Tracked Ambulance",
                from_lat=all_dets[3 % len(all_dets)].latitude - 0.04,
                from_lng=all_dets[3 % len(all_dets)].longitude + 0.05,
                from_place_description="Munna Camp Medical Post",
                to_lat=all_dets[3 % len(all_dets)].latitude,
                to_lng=all_dets[3 % len(all_dets)].longitude,
                to_place_description="63 FWC Depot",
                effectiveness_index=94.0,
                call_received_time="15:10",
                time_to_reach=0.6,
                status="Completed",
            ),
            Recovery(
                date="2026-08-25",
                time_taken_recovery=2.2,
                det_id=all_dets[4 % len(all_dets)].id,
                description="Field water trailer axle snapped on rocky track.",
                casualty_type="Miscellaneous",
                cas_vehicle_equipment_name="Water Bowser Trailer",
                from_lat=all_dets[4 % len(all_dets)].latitude + 0.03,
                from_lng=all_dets[4 % len(all_dets)].longitude - 0.03,
                from_place_description="Chuje GG Forward Depot",
                to_lat=all_dets[4 % len(all_dets)].latitude,
                to_lng=all_dets[4 % len(all_dets)].longitude,
                to_place_description="847 FWC Repair Section",
                effectiveness_index=97.0,
                call_received_time="10:00",
                time_to_reach=0.4,
                status="Completed",
            ),
        ]
        # Attach det vehicles to recoveries
        for rec in sample_recoveries:
            det_vehs = db.query(Vehicle).filter(Vehicle.det_id == rec.det_id).limit(2).all()
            if det_vehs:
                rec.vehicles = det_vehs
        db.add_all(sample_recoveries)
        db.commit()
        print("✓ Initialized Sample Recovery Activities across all 6 Casualty Categories")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    Base.metadata.create_all(bind=engine)

    # 2. Perform safe schema migrations for SQLite
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(recoveries)")).fetchall()
            existing_cols = [row[1] for row in result]
            if "cas_vehicle_equipment_name" not in existing_cols:
                conn.execute(text("ALTER TABLE recoveries ADD COLUMN cas_vehicle_equipment_name VARCHAR(255)"))
                conn.commit()
                print("✓ Migrated recoveries table: added cas_vehicle_equipment_name column")
        except Exception as e:
            print(f"Migration note: {e}")

    # 3. Ensure default 'admin' user exists with full rights
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@army.mil",
                full_name="System Administrator",
                hashed_password=hash_password("admin"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("✓ Default admin user initialized (username: admin, password: admin)")

        # 4. Seed initial tactical data & random vehicles in dets
        seed_initial_tactical_data(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Military Tactical Detachment & Asset Management API",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount master API router
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "system": "Military Command & Asset Management System",
        "version": settings.VERSION,
        "docs": "/docs",
        "architecture": "MVC"
    }
