from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import (
    PredictionRequest, 
    BatchPredictionRequest,
    PredictionResponse,
    BatchPredictionResponse
)
from src.inference import ModelInference
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Bank Marketing Prediction API",
    description="ML API for Bank Marketing Campaign Prediction",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model
try:
    model_inference = ModelInference()
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model_inference = None

@app.get("/")
async def root():
    return {
        "message": "Bank Marketing Prediction API",
        "version": "1.0.0",
        "status": "online",
        "model_loaded": model_inference is not None
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model_inference is not None,
        "algorithm": "LightGBM",
        "threshold": 0.24
    }

@app.get("/model/info")
async def model_info():
    return {
        "algorithm": "LightGBM (Gradient Boosting)",
        "performance": {
            "f1_score": 0.5158,
            "precision": 0.4835,
            "recall": 0.5528,
            "accuracy": 0.8831,
            "roc_auc": 0.8101
        },
        "threshold": 0.24,
        "features": {
            "input": 16,
            "engineered": 25,
            "total_after_engineering": 41,
            "total_after_preprocessing": 73
        }
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if model_inference is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    try:
        client_data = request.client
        result = model_inference.predict(client_data)
        return result
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    if model_inference is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    try:
        clients_data = request.clients
        results = model_inference.predict_batch(clients_data)
        return {"results": results}
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
