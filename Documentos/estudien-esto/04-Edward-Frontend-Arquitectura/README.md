# GUIA DE ESTUDIO - Edward Alexander Escobedo Murga
## Tema: Frontend React + Arquitectura general del sistema

> Esta carpeta contiene todo lo que necesitas saber para presentar tu parte. Lee los archivos en orden.

## Tu mision el dia de la presentacion

Tienes **dos responsabilidades**:

1. **Abrir la presentacion** explicando la arquitectura general (las 4 capas, como se conectan, por que microservicios).
2. **Explicar el frontend en React** (lo que el usuario realmente ve y toca).

Eres la **cara visible** de MedScribe. Tu parte es la que el profesor va a recordar visualmente porque vas a hacer la demo principal.

## Tu codigo vive en

```
cliente-web/
├── package.json                 <- dependencias y scripts
├── vite.config.ts               <- configuracion de Vite
├── tailwind.config.js           <- configuracion de Tailwind
├── index.html                   <- HTML raiz
└── src/
    ├── main.tsx                 <- punto de entrada
    ├── App.tsx                  <- rutas principales
    ├── paginas/                 <- 12 paginas
    ├── componentes/             <- componentes reutilizables
    ├── contextos/               <- Context API (estado global)
    ├── rutas/                   <- proteccion de rutas
    ├── servicios/               <- clientes HTTP
    ├── tipos/                   <- interfaces TypeScript
    └── utilidades/              <- funciones helper
```

Y tambien debes conocer la vision general del sistema:
```
docker-compose.yml               <- como se levanta todo el sistema
README.md (raiz)                 <- instalacion rapida
Documentos/estructura/           <- arquitectura general
```

## Archivos en esta carpeta

| Archivo | Que aprenderas | Cuando leerlo |
|---|---|---|
| `01-fundamentos.md` | Que es React, TypeScript, SPA, JWT, Tailwind, Vite, Docker, en lenguaje simple | PRIMERO |
| `02-recorrido-codigo.md` | Cada archivo y carpeta del frontend explicada | SEGUNDO |
| `03-arquitectura-general.md` | Las 4 capas, la comunicacion entre microservicios, el despliegue Docker | TERCERO |
| `04-preguntas-y-respuestas.md` | Lo que el profe puede preguntarte y como responder | ANTES DE PRESENTAR |
| `05-guion-presentacion.md` | Tu guion de 5 minutos palabra por palabra | EL DIA ANTES |

## Tiempo estimado de estudio

Como tu eres el que abre y cierra la demo, te recomiendo estudiar **mas que los demas**:
- Lectura completa: 3 horas
- Practicar la demo en vivo: al menos 5 veces completas
- Memorizar guion: 1 hora

**Total: 5 horas** distribuidas en 3 dias.

## Tu archivo clave del frontend

Si tienes que abrir un solo archivo en la demo, abre:
- **`cliente-web/src/contextos/ContextoAutenticacion.tsx`** - el Context global que maneja JWT, permisos RBAC y estado del usuario logueado. Es el corazon del frontend.

## Tu mensaje principal

Si el profesor te pregunta "en una frase, que hiciste tu":

> "Construi el frontend completo en React 19 con TypeScript: 12 paginas, mas de 30 componentes reutilizables, autenticacion en cliente con JWT, control de acceso por roles, y disene la arquitectura general del sistema en 4 capas con microservicios desplegados en Docker."

## Lo critico de tu parte

Tu eres el que abre la demo. Si el sistema no levanta o algo se rompe en vivo, **tu eres el que debe cubrir mientras se arregla**. Por eso:

- Practica levantar todo el sistema desde cero al menos 5 veces.
- Ten un **plan B**: capturas de pantalla del sistema funcionando, por si algo falla.
- Memoriza la URL: `localhost:3000` para el front, `localhost:5000/swagger` para la API.
