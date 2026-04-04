from pydantic import BaseModel, Field


class PeticionGeneracion(BaseModel):
    nota_clinica: str = Field(..., min_length=10, max_length=100000)
    tipo_documento: str = Field(default="SOAP", min_length=2, max_length=50)


class PeticionGenerarYGuardar(BaseModel):
    nota_clinica: str = Field(..., min_length=10, max_length=100000)
    tipo_documento: str = Field(default="SOAP", min_length=2, max_length=50)
    id_consulta: int = Field(default=0)
    id_medico: int = Field(default=0)
    id_paciente: int = Field(default=0)
    nombre_paciente: str = Field(default="")
    especialidad: str = Field(default="")
