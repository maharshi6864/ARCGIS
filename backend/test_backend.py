import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def test_backend_system():
    with TestClient(app) as client:
        print("1. Testing Health & System Endpoint...")
        r = client.get("/api/health")
        assert r.status_code == 200
        health = r.json()
        assert health["status"] == "online"
        assert "Recovery" in health["models"]
        assert "Weapon" not in health["models"]
        print("✓ Health Check Passed (Recovery Entity Verified, Weapon Removed)")

        print("\n2. Verifying Default Admin User (username: admin, password: admin)...")
        r = client.get("/api/users")
        assert r.status_code == 200
        users = r.json()
        assert len(users) >= 1
        admin = next((u for u in users if u["username"] == "admin"), None)
        assert admin is not None
        assert admin["role"] == "admin"
        assert admin["email"] == "admin@army.mil"
        print("✓ Default Admin User Verified")

        print("\n3. Testing Detachment Creation...")
        det_data = {
            "name": "106 FWC",
            "latitude": 27.5861,
            "longitude": 91.8594,
            "description": "Forward Operating Base 106 FWC"
        }
        r = client.post("/api/dets", json=det_data)
        assert r.status_code == 201
        det_id = r.json()["id"]
        print(f"✓ Detachment #{det_id} (106 FWC) Created")

        print("\n4. Testing Vehicle Model & Multi-Vehicle Creation with Serviceable/Unserviceable Status...")
        vm_data = {"name": "Armored Recovery Vehicle (ARV)", "critical_margin": 10.0}
        r = client.post("/api/vehicle-models", json=vm_data)
        assert r.status_code == 201
        vm_id = r.json()["id"]

        veh_data_1 = {
            "vehicle_model_id": vm_id,
            "det_id": det_id,
            "vehicle_type": "ARV Heavy",
            "status": "Serviceable",
            "critical_limit": 5.0
        }
        r = client.post("/api/vehicles", json=veh_data_1)
        assert r.status_code == 201
        veh_id_1 = r.json()["id"]

        veh_data_2 = {
            "vehicle_model_id": vm_id,
            "det_id": det_id,
            "vehicle_type": "Wrecker 8x8",
            "status": "Unserviceable",
            "critical_limit": 5.0
        }
        r = client.post("/api/vehicles", json=veh_data_2)
        assert r.status_code == 201
        veh_id_2 = r.json()["id"]
        print(f"✓ Vehicles #{veh_id_1} (Serviceable) & #{veh_id_2} (Unserviceable) Created under Det #{det_id}")

        print("\n5. Testing Recovery Activity Creation with Multi-Vehicle Assignment & Casualty Titles (No Equipment Type)...")
        rec_data = {
            "date": "2026-08-18",
            "time_taken_recovery": 2.5,
            "det_id": det_id,
            "description": "Generator engine failure requiring extraction to depot workshop.",
            "casualty_type": "Generator",
            "cas_vehicle_equipment_name": "30 KVA Genr",
            "from_lat": 27.6000,
            "from_lng": 91.8800,
            "from_place_description": "Post Klemta Grid 4",
            "to_lat": 27.5861,
            "to_lng": 91.8594,
            "to_place_description": "106 FWC Station Workshop",
            "effectiveness_index": 95.0,
            "call_received_time": "09:30",
            "time_to_reach": 0.5,
            "status": "Completed",
            "vehicle_ids": [veh_id_1, veh_id_2]
        }
        r = client.post("/api/recoveries", json=rec_data)
        assert r.status_code == 201
        rec_res = r.json()
        rec_id = rec_res["id"]
        assert rec_res["casualty_type"] == "Generator"
        assert rec_res["cas_vehicle_equipment_name"] == "30 KVA Genr"
        assert rec_res["det_id"] == det_id
        assert len(rec_res["vehicles"]) == 2
        print(f"✓ Recovery Activity #{rec_id} Created with 2 Assigned Recovery Vehicles & 30 KVA Genr")

        print("\n6. Testing Recovery Retrieval & Filtering...")
        r = client.get(f"/api/recoveries?det_id={det_id}")
        assert r.status_code == 200
        recs = r.json()
        target_rec = next((x for x in recs if x["id"] == rec_id), None)
        assert target_rec is not None
        assert len(target_rec["vehicles"]) == 2
        print(f"✓ Recovery #{rec_id} Filtered by Det #{det_id} with Vehicles Attached")

        print("\n7. Testing Recovery Update (Modifying Assigned Vehicles)...")
        update_data = {
            "status": "Completed",
            "effectiveness_index": 98.0,
            "vehicle_ids": [veh_id_1]
        }
        r = client.put(f"/api/recoveries/{rec_id}", json=update_data)
        assert r.status_code == 200
        updated = r.json()
        assert updated["effectiveness_index"] == 98.0
        assert len(updated["vehicles"]) == 1
        print(f"✓ Recovery #{rec_id} Updated successfully with single vehicle assignment")

        print("\n8. Testing Stats Endpoint, Active/Abort/Completed Statuses & Casualty Category Breakdown...")
        r = client.get("/api/stats")
        assert r.status_code == 200
        stats = r.json()
        assert "casualty_breakdown" in stats
        assert len(stats["casualty_breakdown"]) == 6
        assert "serviceable_vehicles" in stats
        assert "unserviceable_vehicles" in stats
        assert "active_recoveries" in stats
        assert "abort_recoveries" in stats
        assert "completed_recoveries" in stats
        print("✓ Stats Endpoint Passed with 6 Casualty Categories Breakdown, Active/Abort/Completed & Readiness Stats")

        print("\n🎉 ALL BACKEND TESTS, RECOVERY OPERATIONS & ADMIN INITIALIZATION PASSED!")

if __name__ == "__main__":
    test_backend_system()
