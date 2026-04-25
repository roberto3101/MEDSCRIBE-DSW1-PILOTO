# GUIA DE ESTUDIO - Jason Davila Delgado
## Tema: Backend en C# .NET con ASP.NET Core 9

> Esta carpeta contiene todo lo que necesitas saber para presentar tu parte. Lee los archivos en orden.

## Tu mision el dia de la presentacion

Vas a explicar el **gateway**: la puerta de entrada del sistema. Toda peticion del frontend pasa primero por tu codigo en C# antes de llegar a la base de datos o al servicio IA. Aqui vive la seguridad, la validacion y la orquestacion.

## Tu codigo vive en

```
gateway-dotnet/
└── src/MedScribe.API/
    ├── Program.cs                  <- bootstrap de la aplicacion
    ├── Controladores/              <- 7 controladores REST
    ├── Servicios/                  <- ClienteServicioIA y ProveedorContextoClinica
    ├── Datos/DAO/                  <- 8 DAOs que invocan stored procedures
    ├── Contratos/                  <- 8 interfaces para inyeccion de dependencias
    ├── Modelos/                    <- Entidades + DTOs de peticiones
    ├── Validadores/                <- SanitizadorDeTexto
    └── Intermediarios/             <- ManejadorGlobalDeExcepciones (middleware)
```

## Archivos en esta carpeta

| Archivo | Que aprenderas | Cuando leerlo |
|---|---|---|
| `01-fundamentos.md` | Que es C#, .NET, ASP.NET Core, JWT, BCrypt, ADO.NET, en lenguaje simple | PRIMERO |
| `02-recorrido-codigo.md` | Cada archivo del backend explicado, donde encontrarlo | SEGUNDO |
| `03-flujos-clave.md` | Login, crear consulta, multi-tenant: paso a paso con codigo real | TERCERO |
| `04-preguntas-y-respuestas.md` | Lo que el profe puede preguntarte y como responder | ANTES DE PRESENTAR |
| `05-guion-presentacion.md` | Tu guion de 5 minutos palabra por palabra | EL DIA ANTES |

## Tiempo estimado de estudio

- Lectura completa: 2 horas
- Memorizar guion: 30 minutos
- Practicar exposicion en voz alta: 3 veces (15 min cada una)

**Total: 3 horas y media** distribuidas en 2-3 dias.

## Tu archivo clave

Si tienes que abrir un solo archivo en la demo, abre:
- **`gateway-dotnet/src/MedScribe.API/Controladores/AutenticacionControlador.cs`** - el controlador de login. Es el mas representativo de todo el patron MVC en capas.

## Tu mensaje principal

Si el profesor te pregunta "en una frase, que hiciste tu":

> "Construi el gateway en C# .NET 9 que actua como puerta de entrada del sistema: 7 controladores REST, autenticacion JWT con BCrypt, control de acceso por roles RBAC, multi-tenant para que cada clinica solo vea sus propios datos, y orquestacion de las llamadas al servicio de IA, todo accediendo a la base de datos a traves de stored procedures con ADO.NET."
