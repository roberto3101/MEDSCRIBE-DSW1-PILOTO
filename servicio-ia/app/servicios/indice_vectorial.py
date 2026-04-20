import hashlib
import logging
import os
import re
from functools import lru_cache
from threading import Lock
from typing import Optional

logger = logging.getLogger(__name__)

URL_QDRANT = os.getenv("QDRANT_URL", "http://qdrant:6333")
NOMBRE_COLECCION = "medscribe_rag"
NOMBRE_MODELO_EMBEDDINGS = os.getenv(
    "MODELO_EMBEDDINGS", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
DIMENSION_VECTORES = 384

MINIMO_PALABRAS_POR_CHUNK = 15
MAXIMO_PALABRAS_POR_CHUNK = 300

DIRECTORIO_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_INDICACIONES = os.path.join(DIRECTORIO_BASE, "indicaciones")
RUTA_CONTEXTO = os.path.join(DIRECTORIO_BASE, "contexto")

_cerrojo_indexacion = Lock()


@lru_cache(maxsize=1)
def _obtener_cliente_qdrant():
    from qdrant_client import QdrantClient
    cliente = QdrantClient(url=URL_QDRANT, timeout=10)
    return cliente


@lru_cache(maxsize=1)
def _obtener_modelo_embeddings():
    from sentence_transformers import SentenceTransformer
    logger.info("indice_vectorial: cargando modelo %s (puede tardar en primera ejecucion)", NOMBRE_MODELO_EMBEDDINGS)
    modelo = SentenceTransformer(NOMBRE_MODELO_EMBEDDINGS)
    return modelo


def indice_vectorial_disponible() -> bool:
    try:
        cliente = _obtener_cliente_qdrant()
        cliente.get_collections()
        return True
    except Exception as error:
        logger.warning("indice_vectorial: Qdrant no disponible (%s)", error)
        return False


def _asegurar_coleccion_creada() -> None:
    from qdrant_client.http import models as qmodels
    cliente = _obtener_cliente_qdrant()
    existentes = {c.name for c in cliente.get_collections().collections}
    if NOMBRE_COLECCION not in existentes:
        cliente.create_collection(
            collection_name=NOMBRE_COLECCION,
            vectors_config=qmodels.VectorParams(size=DIMENSION_VECTORES, distance=qmodels.Distance.COSINE),
        )
        logger.info("indice_vectorial: coleccion %s creada", NOMBRE_COLECCION)


def _inferir_metadata_de_ruta(ruta_archivo: str) -> dict:
    nombre = os.path.basename(ruta_archivo)
    metadata = {"archivo": nombre, "ruta_completa": ruta_archivo}

    if "/indicaciones/" in ruta_archivo.replace("\\", "/"):
        metadata["categoria"] = "indicacion"
        if nombre == "nota_soap.md":
            metadata["tipo_documento"] = "SOAP"
        elif nombre == "historia_clinica.md":
            metadata["tipo_documento"] = "HistoriaClinica"
        elif nombre == "receta.md":
            metadata["tipo_documento"] = "Receta"
    elif "/especialidades/" in ruta_archivo.replace("\\", "/"):
        metadata["categoria"] = "especialidad"
        metadata["especialidad"] = os.path.splitext(nombre)[0]
    elif "/terminologia/" in ruta_archivo.replace("\\", "/"):
        metadata["categoria"] = "terminologia"
        if "cie10" in nombre:
            metadata["subtipo"] = "cie10"
        elif "farmacos" in nombre:
            metadata["subtipo"] = "farmacos"
    return metadata


def _trocear_markdown_por_secciones(texto: str) -> list[tuple[str, str]]:
    lineas = texto.splitlines()
    secciones: list[tuple[str, str]] = []
    encabezado_actual = "(sin encabezado)"
    buffer: list[str] = []

    for linea in lineas:
        if re.match(r"^#{1,3}\s+", linea):
            if buffer:
                contenido = "\n".join(buffer).strip()
                if contenido:
                    secciones.append((encabezado_actual, contenido))
                buffer = []
            encabezado_actual = linea.strip().lstrip("#").strip()
        else:
            buffer.append(linea)

    if buffer:
        contenido = "\n".join(buffer).strip()
        if contenido:
            secciones.append((encabezado_actual, contenido))

    return secciones


def _subdividir_chunk_grande(contenido: str) -> list[str]:
    palabras = contenido.split()
    if len(palabras) <= MAXIMO_PALABRAS_POR_CHUNK:
        return [contenido]

    sub_chunks = []
    paso = MAXIMO_PALABRAS_POR_CHUNK
    for inicio in range(0, len(palabras), paso):
        sub_chunks.append(" ".join(palabras[inicio:inicio + paso]))
    return sub_chunks


def _generar_chunks_de_archivo(ruta_archivo: str, contenido_texto: str) -> list[dict]:
    metadata_base = _inferir_metadata_de_ruta(ruta_archivo)
    secciones = _trocear_markdown_por_secciones(contenido_texto)
    chunks: list[dict] = []

    for encabezado, contenido in secciones:
        for sub_contenido in _subdividir_chunk_grande(contenido):
            if len(sub_contenido.split()) < MINIMO_PALABRAS_POR_CHUNK:
                continue
            texto_para_embedding = f"{encabezado}\n{sub_contenido}"
            chunks.append({
                "texto": texto_para_embedding,
                "metadata": {**metadata_base, "seccion": encabezado},
            })
    return chunks


def _recolectar_archivos_markdown() -> list[str]:
    rutas: list[str] = []
    for raiz, _directorios, archivos in os.walk(RUTA_INDICACIONES):
        for archivo in archivos:
            if archivo.endswith(".md"):
                rutas.append(os.path.join(raiz, archivo))
    for raiz, _directorios, archivos in os.walk(RUTA_CONTEXTO):
        for archivo in archivos:
            if archivo.endswith(".md"):
                rutas.append(os.path.join(raiz, archivo))
    return rutas


def _hash_estable_para_id(texto: str) -> int:
    digest = hashlib.sha1(texto.encode("utf-8")).hexdigest()
    return int(digest[:15], 16)


def reindexar_todos_los_documentos_rag(forzar_recreacion: bool = False) -> dict:
    from qdrant_client.http import models as qmodels

    with _cerrojo_indexacion:
        cliente = _obtener_cliente_qdrant()
        if forzar_recreacion:
            try:
                cliente.delete_collection(NOMBRE_COLECCION)
                logger.info("indice_vectorial: coleccion %s eliminada para recreacion", NOMBRE_COLECCION)
            except Exception:
                pass

        _asegurar_coleccion_creada()
        modelo = _obtener_modelo_embeddings()

        rutas = _recolectar_archivos_markdown()
        total_chunks = 0
        archivos_procesados = 0

        for ruta in rutas:
            try:
                with open(ruta, "r", encoding="utf-8") as archivo:
                    contenido = archivo.read()
            except OSError as error:
                logger.warning("indice_vectorial: no se pudo leer %s (%s)", ruta, error)
                continue

            chunks = _generar_chunks_de_archivo(ruta, contenido)
            if not chunks:
                continue

            textos = [c["texto"] for c in chunks]
            vectores = modelo.encode(textos, normalize_embeddings=True).tolist()

            puntos = []
            for chunk, vector in zip(chunks, vectores):
                id_punto = _hash_estable_para_id(f"{chunk['metadata']['ruta_completa']}::{chunk['metadata']['seccion']}::{chunk['texto'][:60]}")
                puntos.append(qmodels.PointStruct(
                    id=id_punto,
                    vector=vector,
                    payload={"texto": chunk["texto"], **chunk["metadata"]},
                ))

            cliente.upsert(collection_name=NOMBRE_COLECCION, points=puntos)
            total_chunks += len(puntos)
            archivos_procesados += 1

        info = cliente.get_collection(NOMBRE_COLECCION)
        resumen = {
            "archivos_procesados": archivos_procesados,
            "chunks_indexados": total_chunks,
            "total_en_coleccion": info.points_count,
        }
        logger.info("indice_vectorial: reindexado completo %s", resumen)
        return resumen


def consultar_estado_indice() -> dict:
    try:
        cliente = _obtener_cliente_qdrant()
        existentes = {c.name for c in cliente.get_collections().collections}
        if NOMBRE_COLECCION not in existentes:
            return {"disponible": True, "coleccion_existe": False, "chunks": 0}
        info = cliente.get_collection(NOMBRE_COLECCION)
        return {
            "disponible": True,
            "coleccion_existe": True,
            "chunks": info.points_count,
            "modelo_embeddings": NOMBRE_MODELO_EMBEDDINGS,
            "dimension": DIMENSION_VECTORES,
        }
    except Exception as error:
        return {"disponible": False, "error": str(error)}


def buscar_chunks_relevantes(
    consulta_texto: str,
    top_k: int = 5,
    especialidad: Optional[str] = None,
    tipo_documento: Optional[str] = None,
) -> list[dict]:
    from qdrant_client.http import models as qmodels

    if not consulta_texto or not consulta_texto.strip():
        return []

    modelo = _obtener_modelo_embeddings()
    vector = modelo.encode(consulta_texto, normalize_embeddings=True).tolist()

    condiciones_should: list = []
    if especialidad:
        condiciones_should.append(qmodels.FieldCondition(
            key="especialidad", match=qmodels.MatchValue(value=especialidad.lower())
        ))
        condiciones_should.append(qmodels.FieldCondition(
            key="categoria", match=qmodels.MatchValue(value="terminologia")
        ))
    if tipo_documento:
        condiciones_should.append(qmodels.FieldCondition(
            key="tipo_documento", match=qmodels.MatchValue(value=tipo_documento)
        ))

    filtro = qmodels.Filter(should=condiciones_should) if condiciones_should else None

    cliente = _obtener_cliente_qdrant()
    try:
        respuesta = cliente.query_points(
            collection_name=NOMBRE_COLECCION,
            query=vector,
            query_filter=filtro,
            limit=top_k,
            with_payload=True,
        )
        resultados = respuesta.points
    except Exception as error:
        logger.warning("indice_vectorial: busqueda fallo (%s)", error)
        return []

    return [
        {
            "score": float(r.score),
            "texto": r.payload.get("texto", ""),
            "archivo": r.payload.get("archivo", ""),
            "seccion": r.payload.get("seccion", ""),
            "categoria": r.payload.get("categoria", ""),
            "especialidad": r.payload.get("especialidad"),
        }
        for r in resultados
    ]
