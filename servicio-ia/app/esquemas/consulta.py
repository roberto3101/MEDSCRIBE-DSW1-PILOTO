from pydantic import BaseModel, Field


class PeticionProcesamiento(BaseModel):
    transcripcion: str = Field(..., min_length=10, max_length=50000)
    especialidad: str = Field(default="", max_length=100)
    tipo_documento: str = Field(default="SOAP", min_length=2, max_length=50)
