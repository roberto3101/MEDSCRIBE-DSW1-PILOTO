from pydantic import BaseModel, Field
from typing import Optional


class DatosPaciente(BaseModel):
    nombre_completo: str = Field(default="", max_length=300)
    tipo_documento: str = Field(default="", max_length=30)
    numero_documento: str = Field(default="", max_length=30)
    sexo: str = Field(default="", max_length=30)
    fecha_nacimiento: str = Field(default="", max_length=30)
    telefono: str = Field(default="", max_length=30)
    correo: str = Field(default="", max_length=150)
    direccion: str = Field(default="", max_length=300)


class PeticionGeneracion(BaseModel):
    nota_clinica: str = Field(..., min_length=10, max_length=100000)
    tipo_documento: str = Field(default="SOAP", min_length=2, max_length=50)
    paciente: Optional[DatosPaciente] = None
    especialidad: str = Field(default="", max_length=100)


class PeticionGenerarYGuardar(BaseModel):
    nota_clinica: str = Field(..., min_length=10, max_length=100000)
    tipo_documento: str = Field(default="SOAP", min_length=2, max_length=50)
    id_consulta: int = Field(default=0)
    id_medico: int = Field(default=0)
    id_paciente: int = Field(default=0)
    nombre_paciente: str = Field(default="")
    especialidad: str = Field(default="")
