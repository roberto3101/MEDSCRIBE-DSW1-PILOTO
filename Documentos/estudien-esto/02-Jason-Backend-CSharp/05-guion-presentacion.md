# 05. Guion de la presentacion (mapeado al HTML)

> Tu parte: **4:30 minutos** repartidos en 2 secciones del HTML. Tienes mas tiempo por seccion porque tienes menos secciones.

---

## CONTEXTO IMPORTANTE

- Estas presentando con **el HTML abierto** (`Documentos/Web/informe-medscribe.html`).
- Cuando Edward termina la seccion 6 (Despliegue), avanza con `→` y entras tu en la seccion 7.
- El indicador inferior derecho cambiara automaticamente a tu nombre y avatar morado.
- Tu turno empieza en el minuto **6:00** y termina en el **10:30**.

---

## SECCION 7 — CASOS DE USO DEL SISTEMA (2:00)

**En pantalla**: Seccion 7 "Casos de uso" con el diagrama de actores

**Lo que dices**:
> "Buenas tardes profesor. Mi nombre es Jason Davila Delgado, codigo i202415540. Yo me encargue del **backend en C# .NET 9**, que es la puerta de entrada de todo el sistema y el componente que define quien puede hacer que cosa.
> 
> En este diagrama ven como definimos a los **actores** del sistema. Tenemos dos: el **Medico** y el **Administrador**. Un detalle de diseno importante es que usamos **herencia entre actores**, como ven con la flecha punteada: el Administrador hereda todos los permisos del Medico y ademas tiene los suyos propios.
> 
> Esto se traduce en el codigo: el Medico puede iniciar sesion, gestionar pacientes, crear consultas, editar notas, ver historial. El Administrador hereda todo eso y suma cuatro casos exclusivos: aprobar documentos, gestionar usuarios, gestionar roles, y configurar plantillas.
> 
> Implemente todos estos casos de uso en **siete controladores REST** con aproximadamente 30 endpoints en total: Autenticacion, Consulta, Paciente, Documento, Clinica, Usuarios y Roles."

→ **Avanza con `→`**

---

## SECCION 8 — AUTENTICACION: SECUENCIA DE LOGIN (2:30)

**En pantalla**: Seccion 8 "Autenticacion: secuencia de Login" con el diagrama

**Lo que dices** (PRIMERA PARTE — explicacion, ~1:30):
> "Aqui esta el flujo de autenticacion que implemente, que vale 4 puntos en la rubrica.
> 
> Cuando el usuario manda su correo y contrasena al endpoint de login, el controlador valida el formato y llama al DAO. El DAO ejecuta un **stored procedure** que verifica la contrasena con **BCrypt**, un algoritmo de hash lento a proposito y dificil de revertir por fuerza bruta.
> 
> Si la validacion pasa, el controlador genera un **token JWT firmado con HMAC SHA256**. El token contiene el id del usuario, el id de la clinica, el rol, y todos los permisos del usuario serializados como JSON. El frontend lo guarda en localStorage y lo envia en cada peticion siguiente.
> 
> Cada endpoint protegido valida el token automaticamente con un middleware. Y aqui viene lo bueno: tambien valida **permisos granulares**. Si un usuario intenta crear un paciente sin tener el permiso 'pacientes.crear', recibe un 403 Forbidden sin que el controlador siquiera se ejecute. Esto se llama **RBAC granular**: roles con permisos por modulo y accion."

**Lo que haces** (SEGUNDA PARTE — micro-demo, ~1:00):
1. **Cambia rapido a una pestana del navegador con Swagger abierto** (`localhost:5000/swagger`).
2. Senala los 7 controladores.
3. Vuelve al HTML.

**Mientras lo haces, dices**:
> "Aqui pueden ver los siete controladores documentados con Swagger, cada uno con sus endpoints. Toda esta API que acaba de mostrar Edward en el frontend, esta detras del backend que diseñé.
> 
> En cuanto al acceso a datos: **NO usamos Entity Framework**. Usamos **ADO.NET puro con stored procedures**, que es lo que pide la rubrica del curso y lo que va a explicar mi compañero Luis a continuacion."

→ **Avanza con `→`** (pasa a seccion 9, que ya es de Luis)

---

## TIEMPO TOTAL: 4:30

---

## ANTES DE EMPEZAR — Lista de verificacion

- [ ] Edward esta presentando — espera tu turno
- [ ] Tienes Swagger abierto en una pestana separada (`localhost:5000/swagger`)
- [ ] Tienes el guion en un segundo monitor o impreso
- [ ] Sabes en que momento toca tu seccion 7 (cuando Edward avance desde la 6)

---

## SI EL TIEMPO TE QUEDA CORTO

Si Edward se demoro mas de la cuenta y solo te quedan 3 minutos, **omite la micro-demo de Swagger** y resume:
- Seccion 7 en 1:30
- Seccion 8 en 1:30 sin demo

Lo importante es decir las palabras clave: **JWT, BCrypt, ADO.NET, stored procedures, RBAC granular, multi-tenant**.

---

## SI TE INTERRUMPEN CON UNA PREGUNTA

**Estrategia**: responde en 2-3 frases y sigue.

**Si no sabes la respuesta**:
> "Buena pregunta, esa logica especifica esta en el archivo [X]. La idea general es [concepto]. Si quiere podemos abrirlo despues."

---

## TIPS

- **Habla con conviccion**. El backend es la parte tecnica mas seria del sistema.
- **Cuando muestres Swagger**, hazlo rapido. No te enrolles probando endpoints.
- **No te disculpes** por los detalles tecnicos. El profe espera que sepas.
- **Pasa la palabra a Luis con energia**: "...mi compañero Luis" no "este... ahora pasa Luis".

---

## LO QUE DEBE QUEDAR CLARO DESPUES DE TUS 4:30

1. **Hay 7 controladores con 30+ endpoints** organizados por funcionalidad.
2. **JWT firmado + BCrypt + RBAC granular** garantizan seguridad.
3. **Multi-tenant** asegura que cada clinica solo ve sus propios datos.
4. **ADO.NET con stored procedures**, no Entity Framework — y eso conecta con la siguiente seccion (Luis).
