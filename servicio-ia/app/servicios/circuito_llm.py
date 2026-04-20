import logging
import time
from enum import Enum
from threading import Lock

logger = logging.getLogger(__name__)

UMBRAL_FALLOS_CONSECUTIVOS_PARA_ABRIR = 5
SEGUNDOS_CIRCUITO_ABIERTO_ANTES_DE_SONDEAR = 30
SEGUNDOS_VENTANA_CONTEO_FALLOS = 60


class EstadoCircuito(str, Enum):
    CERRADO = "cerrado"
    ABIERTO = "abierto"
    SEMI_ABIERTO = "semi_abierto"


class CircuitoAbiertoError(RuntimeError):
    pass


class CircuitoLlm:
    def __init__(self):
        self._estado: EstadoCircuito = EstadoCircuito.CERRADO
        self._fallos_consecutivos: int = 0
        self._timestamp_primer_fallo_en_ventana: float = 0.0
        self._timestamp_apertura: float = 0.0
        self._cerrojo = Lock()

    def consultar_estado(self) -> dict:
        with self._cerrojo:
            return {
                "estado": self._estado.value,
                "fallos_consecutivos": self._fallos_consecutivos,
                "segundos_desde_apertura": (time.monotonic() - self._timestamp_apertura) if self._estado == EstadoCircuito.ABIERTO else 0,
            }

    def verificar_si_permite_solicitud_o_lanzar(self) -> None:
        with self._cerrojo:
            if self._estado == EstadoCircuito.CERRADO:
                return
            if self._estado == EstadoCircuito.ABIERTO:
                tiempo_transcurrido = time.monotonic() - self._timestamp_apertura
                if tiempo_transcurrido >= SEGUNDOS_CIRCUITO_ABIERTO_ANTES_DE_SONDEAR:
                    self._estado = EstadoCircuito.SEMI_ABIERTO
                    logger.info("circuito_llm: transicion ABIERTO -> SEMI_ABIERTO (sondeo)")
                    return
                raise CircuitoAbiertoError(
                    f"Circuito abierto hace {tiempo_transcurrido:.1f}s. Reintente en "
                    f"{SEGUNDOS_CIRCUITO_ABIERTO_ANTES_DE_SONDEAR - tiempo_transcurrido:.1f}s."
                )

    def registrar_exito(self) -> None:
        with self._cerrojo:
            if self._estado == EstadoCircuito.SEMI_ABIERTO:
                logger.info("circuito_llm: sondeo exitoso, transicion SEMI_ABIERTO -> CERRADO")
            self._estado = EstadoCircuito.CERRADO
            self._fallos_consecutivos = 0
            self._timestamp_primer_fallo_en_ventana = 0.0

    def registrar_fallo(self) -> None:
        with self._cerrojo:
            ahora = time.monotonic()
            if self._fallos_consecutivos == 0 or (ahora - self._timestamp_primer_fallo_en_ventana) > SEGUNDOS_VENTANA_CONTEO_FALLOS:
                self._timestamp_primer_fallo_en_ventana = ahora
                self._fallos_consecutivos = 1
            else:
                self._fallos_consecutivos += 1

            if self._estado == EstadoCircuito.SEMI_ABIERTO:
                self._estado = EstadoCircuito.ABIERTO
                self._timestamp_apertura = ahora
                logger.warning("circuito_llm: sondeo fallido, transicion SEMI_ABIERTO -> ABIERTO")
                return

            if self._fallos_consecutivos >= UMBRAL_FALLOS_CONSECUTIVOS_PARA_ABRIR and self._estado == EstadoCircuito.CERRADO:
                self._estado = EstadoCircuito.ABIERTO
                self._timestamp_apertura = ahora
                logger.error(
                    "circuito_llm: umbral de fallos (%d) alcanzado, transicion CERRADO -> ABIERTO por %ds",
                    UMBRAL_FALLOS_CONSECUTIVOS_PARA_ABRIR,
                    SEGUNDOS_CIRCUITO_ABIERTO_ANTES_DE_SONDEAR,
                )


circuito_llm_global = CircuitoLlm()
