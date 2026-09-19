from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.det import Det
from app.models.vehicle import Vehicle
from app.models.vehicle_model import VehicleModel
from app.models.recovery import Recovery


class StatsService:
    @staticmethod
    def get_dashboard_stats(db: Session):
        total_dets = db.query(Det).count()
        total_vehicles = db.query(Vehicle).count()
        
        # Vehicle Readiness: Serviceable / Unserviceable
        serviceable_vehicles = db.query(Vehicle).filter(
            Vehicle.status.in_(["Serviceable", "Operational"])
        ).count()
        unserviceable_vehicles = db.query(Vehicle).filter(
            Vehicle.status.in_(["Unserviceable", "Critical", "Maintenance"])
        ).count()

        total_vehicle_models = db.query(VehicleModel).count()

        # Recovery stats (Active, Abort, Completed)
        total_recoveries = db.query(Recovery).count()
        active_recoveries = db.query(Recovery).filter(Recovery.status.ilike("Active")).count()
        abort_recoveries = db.query(Recovery).filter(Recovery.status.ilike("Abort")).count()
        completed_recoveries = db.query(Recovery).filter(Recovery.status.ilike("Completed")).count()

        # Averages
        avg_effectiveness_row = db.query(func.avg(Recovery.effectiveness_index)).scalar()
        avg_effectiveness = round(float(avg_effectiveness_row), 1) if avg_effectiveness_row is not None else 100.0

        avg_time_to_reach_row = db.query(func.avg(Recovery.time_to_reach)).scalar()
        avg_time_to_reach = round(float(avg_time_to_reach_row), 1) if avg_time_to_reach_row is not None else 0.0

        # Casualty Breakdown by 6 standardized categories
        casualty_categories = [
            {"key": "Generator", "short": "Genr", "label": "Generator"},
            {"key": "Heavy Vehicle", "short": "Hy Veh", "label": "Heavy Vehicle"},
            {"key": "Light Vehicle", "short": "Lt Veh", "label": "Light Vehicle"},
            {"key": "Miscellaneous", "short": "Misc", "label": "Miscellaneous"},
            {"key": "Special Vehicle", "short": "Spl Veh", "label": "Special Vehicle"},
            {"key": "Engineering Equipment", "short": "Engr Eqpt", "label": "Engineering Equipment"},
        ]

        casualty_counts = {}
        for cat in casualty_categories:
            count = db.query(Recovery).filter(Recovery.casualty_type.ilike(f"%{cat['key']}%")).count()
            casualty_counts[cat["key"]] = count

        # Active or recent recoveries for dashboard stream
        active_recovery_list = (
            db.query(Recovery)
            .options(
                joinedload(Recovery.det),
                joinedload(Recovery.vehicles).joinedload(Vehicle.model),
            )
            .order_by(Recovery.id.desc())
            .all()
        )

        critical_alerts_count = unserviceable_vehicles + active_recoveries

        # Unserviceable vehicles list
        unserviceable_vehicle_list = (
            db.query(Vehicle)
            .filter(Vehicle.status.in_(["Unserviceable", "Critical", "Maintenance"]))
            .limit(10)
            .all()
        )

        return {
            "total_dets": total_dets,
            "total_vehicles": total_vehicles,
            "serviceable_vehicles": serviceable_vehicles,
            "unserviceable_vehicles": unserviceable_vehicles,
            "operational_vehicles": serviceable_vehicles, # backward compatibility
            "critical_vehicles": unserviceable_vehicles,   # backward compatibility
            "total_vehicle_models": total_vehicle_models,
            "total_recoveries": total_recoveries,
            "completed_recoveries": completed_recoveries,
            "active_recoveries": active_recoveries,
            "abort_recoveries": abort_recoveries,
            "in_progress_recoveries": active_recoveries, # backward compatibility
            "avg_effectiveness": avg_effectiveness,
            "avg_time_to_reach": avg_time_to_reach,
            "critical_alerts_count": critical_alerts_count,
            "casualty_breakdown": [
                {
                    "key": cat["key"],
                    "short": cat["short"],
                    "label": cat["label"],
                    "count": casualty_counts.get(cat["key"], 0)
                }
                for cat in casualty_categories
            ],
            "recent_recoveries": [
                {
                    "id": r.id,
                    "date": r.date,
                    "casualty_type": r.casualty_type,
                    "cas_vehicle_equipment_name": r.cas_vehicle_equipment_name or "Tactical Unit",
                    "det_name": r.det.name if r.det else "Unassigned",
                    "det_id": r.det_id,
                    "from_lat": r.from_lat,
                    "from_lng": r.from_lng,
                    "from_place": r.from_place_description or f"{r.from_lat:.2f}°, {r.from_lng:.2f}°",
                    "to_lat": r.to_lat,
                    "to_lng": r.to_lng,
                    "to_place": r.to_place_description or f"{r.to_lat:.2f}°, {r.to_lng:.2f}°",
                    "time_to_reach": r.time_to_reach,
                    "time_taken_recovery": r.time_taken_recovery,
                    "effectiveness_index": r.effectiveness_index,
                    "status": r.status,
                    "vehicles": [
                        {
                            "id": v.id,
                            "type": v.vehicle_type,
                            "status": v.status,
                            "model_name": v.model.name if v.model else "Vehicle",
                        }
                        for v in (r.vehicles or [])
                    ]
                }
                for r in active_recovery_list
            ],
            "unserviceable_vehicles_list": [
                {
                    "id": v.id,
                    "type": v.vehicle_type or "Standard",
                    "model_name": v.model.name if v.model else "Unknown",
                    "det_name": v.det.name if v.det else "Unassigned",
                    "det_id": v.det_id,
                    "status": v.status
                }
                for v in unserviceable_vehicle_list
            ]
        }
