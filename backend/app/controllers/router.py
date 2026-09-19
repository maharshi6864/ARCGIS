from fastapi import APIRouter
from app.controllers.det_controller import router as det_router
from app.controllers.vehicle_model_controller import router as vehicle_model_router
from app.controllers.vehicle_controller import router as vehicle_router
from app.controllers.recovery_controller import router as recovery_router
from app.controllers.user_controller import router as user_router
from app.controllers.stats_controller import router as stats_router

api_router = APIRouter(prefix="/api")

api_router.include_router(det_router)
api_router.include_router(vehicle_model_router)
api_router.include_router(vehicle_router)
api_router.include_router(recovery_router)
api_router.include_router(user_router)
api_router.include_router(stats_router)


@api_router.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "system": "Military Command & Asset Management System",
        "architecture": "MVC",
        "models": ["Det", "VehicleModel", "Vehicle", "Recovery", "Users"]
    }
