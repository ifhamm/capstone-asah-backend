from pydantic import BaseModel
from typing import Dict, Any, List

# Single Prediction Request
class PredictionRequest(BaseModel):
    client: Dict[str, Any]

# Batch Prediction Request
class BatchPredictionRequest(BaseModel):
    clients: List[Dict[str, Any]]

# Single Prediction Response
class PredictionResponse(BaseModel):
    probability: float
    prediction: int
    label: str
    threshold: float

# Batch Prediction Response
class BatchPredictionResponse(BaseModel):
    results: List[PredictionResponse]
