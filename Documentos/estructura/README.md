# Arquitectura de MedScribe AI

> Carpeta para entender de un vistazo como esta organizado el proyecto. Lee este archivo primero, luego entra a `frontend/` o `backend/` segun lo que quieras profundizar.

---

## Tipo de arquitectura que usamos

MedScribe usa una **arquitectura de microservicios en capas**, comunicada por APIs REST sobre HTTP, y empaquetada con Docker Compose.

En palabras simples: el sistema esta partido en **4 piezas independientes** que se hablan por internet (aunque corran en la misma maquina). Cada pieza tiene una sola responsabilidad y puede actualizarse sin tocar a las demas.

```
[Cliente Web React] <--HTTP--> [Gateway C# .NET] <--HTTP--> [Servicio IA Python]
                                       |                            |
                                       v                            v
                              [SQL Server BD]              [Qdrant + Redis + Disco]
```

---

## Por que elegimos esta arquitectura

### 1. Microservicios en lugar de un monolito
Un monolito (todo en un solo programa) habria sido mas rapido de empezar pero peor a mediano plazo. Elegimos microservicios por estas razones:

| Ventaja | Que significa |
|---|---|
| **Independencia de tecnologias** | El backend de negocio en C# (lo que pide Cibertec) y el cerebro de IA en Python (donde estan los modelos). Cada uno usa el lenguaje ideal. |
| **Trabajo en paralelo del equipo** | Roberto trabaja en Python sin tocar C#. Jason en C# sin tocar Python. Edward en React sin pelearse con nadie. |
| **Escalabilidad** | Si el servicio de IA se satura (procesamiento pesado), se puede levantar en otra maquina sin tocar el frontend ni la BD. |
| **Reemplazo facil** | Manana se puede cambiar Llama por GPT-4 sin tocar el frontend ni la base de datos. |

### 2. Arquitectura en capas dentro de cada microservicio
Cada microservicio respeta la separacion clasica:

- **Capa de presentacion** (Frontend React): unica capa que el usuario ve.
- **Capa de aplicacion** (Controladores REST): recibe peticiones, valida, delega.
- **Capa de logica de negocio** (Servicios): reglas de negocio.
- **Capa de acceso a datos** (DAOs / repositorios): hablar con la base de datos.

Esto cumple los requisitos del curso: `aplicacion en capas, MVC .net core y servicios web`.

### 3. Comunicacion sincronica REST + asincronica con Redis
- **REST sincrono** para operaciones rapidas (login, listar pacientes, guardar).
- **Cola con Redis** para operaciones lentas (procesar audio largo, generar PDF). Asi el usuario no se queda esperando.

### 4. Empaquetado con Docker Compose
Todos los componentes en contenedores. Levantar todo con `docker compose up`. Esto evita el famoso "en mi computadora si funciona".

---

## Patrones de diseno aplicados

| Patron | Donde se usa | Para que sirve |
|---|---|---|
| **MVC** | Backend C# | Separar Modelo, Vista (JSON) y Controlador |
| **Repository / DAO** | `gateway-dotnet/Datos/DAO/` | Aislar el acceso a la base de datos |
| **Dependency Injection** | C# y Python | Inyectar dependencias en lugar de instanciarlas |
| **Circuit Breaker** | `servicio-ia/.../circuito_llm.py` | Cortar llamadas al LLM cuando esta caido |
| **Retry con backoff exponencial** | `servicio_claude.py` | Reintentar peticiones lentas con espera creciente |
| **Idempotencia** | `idempotencia.py` | Evitar procesar dos veces la misma peticion |
| **Multi-tenant** | `ProveedorContextoClinica.cs` | Cada clinica solo ve sus propios datos |
| **RBAC (Role Based Access Control)** | C# + JSON en BD | Permisos granulares por modulo y accion |
| **RAG (Retrieval Augmented Generation)** | `servicio_rag.py` + Qdrant | Dar contexto medico al LLM antes de generar la nota |

---

## Mapa de responsabilidades por microservicio

| Microservicio | Responsabilidad | Tecnologia | Puerto |
|---|---|---|---|
| **cliente-web** | Interfaz de usuario | React 19 + Vite + Tailwind | 3000 |
| **gateway-dotnet** | API REST, seguridad, persistencia | C# .NET 9 + ASP.NET Core | 5000 |
| **servicio-ia** | Pipeline de inteligencia artificial | Python 3.12 + FastAPI | 8000 |
| **db** | Datos relacionales | SQL Server Express | 1434 |
| **qdrant** | Datos vectoriales (RAG) | Qdrant | 6333 |
| **redis** | Cola y cache | Redis | 6379 |

---

## Flujo de una peticion completa (ejemplo: crear consulta)

1. El **medico** hace click en "Nueva Consulta" (Frontend React)
2. El frontend manda `POST /api/consultas` al **Gateway C#** con audio + JWT
3. El Gateway valida el JWT, verifica permisos (`consultas.crear`)
4. El Gateway llama al **Servicio IA Python**: `POST /api/ia/transcribir`
5. El Servicio IA usa Whisper, Pyannote, Llama 3.3 para generar la nota
6. El Gateway recibe la nota y la guarda en **SQL Server** via stored procedure
7. El Gateway pide al Servicio IA generar PDF y Word
8. El Frontend recibe la consulta creada y muestra los enlaces de descarga

---

## Donde profundizar

- `frontend/` - Como esta organizado el cliente web React
- `backend/` - Como esta organizado el gateway C# y el servicio IA Python
