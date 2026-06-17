from fastapi import FastAPI
from id_generator import generate_short_id

app = FastAPI()

@app.get("/api/generate")
async def generate_id():
    return {"id": generate_short_id()}
