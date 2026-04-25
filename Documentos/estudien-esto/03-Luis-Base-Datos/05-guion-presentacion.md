# 05. Guion de la presentacion (mapeado al HTML)

> Tu parte: **4:30 minutos** repartidos en 3 secciones del HTML.

---

## CONTEXTO IMPORTANTE

- Estas presentando con **el HTML abierto**.
- Cuando Jason termina la seccion 8 (Login), avanza con `→` y entras tu en la seccion 9.
- El indicador inferior derecho cambiara a tu avatar rojo.
- Tu turno empieza en el minuto **10:30** y termina en el **15:00**.

---

## SECCION 9 — MODELO DE CLASES DEL DOMINIO (1:00)

**En pantalla**: Seccion 9 "Modelo de Clases del dominio" con el diagrama

**Lo que dices**:
> "Buenas tardes profesor. Mi nombre es Luis Joel Curi, codigo i202417794. Yo disene la **base de datos en SQL Server**, donde vive toda la informacion clinica del sistema.
> 
> Antes de mostrar las tablas, esta es la **vista conceptual del dominio**. Aqui pueden ver las clases principales: una **Clinica** agrupa **Usuarios** y **Pacientes**; un **Usuario** puede ser **Medico**; un **Medico** atiende **Consultas**; cada Consulta sigue una **Plantilla** con sus **Secciones**, y genera **Documentos** PDF o Word.
> 
> Esta vista de clases es la traduccion natural de un sistema clinico real al modelo de datos."

→ **Avanza con `→`**

---

## SECCION 10 — MODELO ENTIDAD-RELACION (2:00)

**En pantalla**: Seccion 10 "Modelo Entidad-Relacion" con el diagrama ER

**Lo que dices** (PRIMERA PARTE — explicacion del modelo, ~1:00):
> "Esta es la vista fisica de la base de datos. Implementé **13 tablas relacionales** con integridad referencial completa.
> 
> La tabla raiz es **Clinicas**, porque somos un sistema **multi-tenant**: varias clinicas usan la misma instalacion sin ver datos de las otras. Casi todas las demas tablas tienen una clave foranea hacia ella.
> 
> Por debajo: una clinica tiene Usuarios, Pacientes y Roles personalizados. Cuando un medico atiende a un paciente, se crea una **Consulta**, que tiene N valores en **ValoresDeSeccionPorConsulta**, uno por cada seccion de la plantilla. Y genera **Documentos**.
> 
> Toda accion critica queda registrada en **AuditoriaDeConsultas** para trazabilidad, lo que cumple con la normativa de salud peruana."

**Lo que dices** (SEGUNDA PARTE — stored procedures + transacciones, ~1:00):
> "Para acceder a estas tablas, implementé **mas de 45 stored procedures**. Tomé la decision de usar stored procedures por cuatro razones:
> 
> Primero, **lo pide la rubrica del curso** como proceso de negocio.
> 
> Segundo, dan **seguridad por construccion**: imposible inyectar SQL malicioso porque los parametros pasan tipados.
> 
> Tercero, encapsulan **transacciones atomicas**. Por ejemplo, el SP `usp_Consultas_CrearConsultaConDocumentoEnTransaccion` inserta atomicamente en cuatro tablas: Consultas, ValoresDeSeccionPorConsulta, Documentos y AuditoriaDeConsultas. Si cualquier insert falla, **ROLLBACK revierte todo**. Imposible quedar con datos inconsistentes. Esto cumple las propiedades **ACID**.
> 
> Cuarto, **separacion de responsabilidades**: la logica de datos vive en SQL, la logica de aplicacion en C#. El DBA puede optimizar sin tocar el backend."

→ **Avanza con `→`**

---

## SECCION 11 — ESTADOS DE LA CONSULTA (1:30)

**En pantalla**: Seccion 11 "Estados de la Consulta" con el diagrama

**Lo que dices**:
> "Una consulta no es una entidad estatica: pasa por varios estados durante su vida util. Disene este ciclo de vida con **constraints CHECK** en SQL Server, que rechazan automaticamente cualquier transicion invalida.
> 
> Cuando se crea, queda en **BORRADOR**. Cuando el medico la edita y la procesa, pasa a **EN_PROCESO**. Cuando el administrador la valida, pasa a **APROBADA**. Si hay un problema, pasa a **ANULADA**.
> 
> Cada cambio de estado se registra en la **tabla de auditoria** con quien lo hizo, cuando, y por que. Esto da trazabilidad completa, que es un requisito legal en el sector salud peruano segun la Ley 30024 que crea el Registro Nacional de Historias Clinicas Electronicas.
> 
> Hasta aqui mi parte de base de datos. **Mi compañero Roberto les va a explicar a continuacion como la inteligencia artificial usa estos datos para generar las notas clinicas automaticamente**."

→ **Avanza con `→`** (pasa a la seccion 12 que ya es de Roberto)

---

## TIEMPO TOTAL: 4:30

---

## ANTES DE EMPEZAR — Lista de verificacion

- [ ] Jason esta presentando — espera tu turno
- [ ] Si quieres hacer una micro-demo, ten **SQL Server Management Studio** o **Azure Data Studio** abierto con la BD MedScribeDB
- [ ] (Opcional) Ten el archivo `usp_Consultas_CrearConsultaConDocumentoEnTransaccion.sql` listo en una pestana
- [ ] Tienes el guion en un segundo monitor o impreso

---

## SI TE QUEDA TIEMPO EXTRA (mas de 4:30)

Puedes agregar al final de la seccion 10 una **micro-demo de 30 segundos**:
1. Cambia rapido a SSMS/Azure Data Studio.
2. Abre el SP `usp_Consultas_CrearConsultaConDocumentoEnTransaccion.sql`.
3. Senala el `BEGIN TRY`, `BEGIN TRANSACTION`, los 4 INSERTs, el `COMMIT`, y el `ROLLBACK` en CATCH.
4. Mientras lo haces, di: "Como pueden ver aqui, este es el SP transaccional del que les hable. Los cuatro INSERTs estan dentro de un BEGIN TRANSACTION, y si cualquiera falla, ROLLBACK revierte todo."
5. Vuelve al HTML.

**Si no te alcanza el tiempo**, OMITE la demo. Lo prioritario es decir las palabras clave: **13 tablas, 45+ stored procedures, transacciones ACID, multi-tenant, auditoria**.

---

## SI TE INTERRUMPEN CON UNA PREGUNTA

**Estrategia**: responde en 2-3 frases y sigue.

**Si no sabes la respuesta**:
> "Buena pregunta, eso lo manejamos en el SP `usp_<TablaQueAdivinas>_<AccionQueAdivinas>`. Si quiere lo abrimos despues."

---

## TIPS

- **Habla con autoridad** sobre la base de datos. Tu eres el especialista.
- **No leas literal** este guion. Aprendete las ideas.
- **Cuando menciones "ACID"**, hazlo claro: A-tomicidad, C-onsistencia, I-solamiento, D-urabilidad.
- **Pasa la palabra a Roberto con energia**.

---

## LO QUE DEBE QUEDAR CLARO DESPUES DE TUS 4:30

1. **13 tablas relacionales** con integridad referencial.
2. **45+ stored procedures** que encapsulan toda la logica de datos.
3. **Transacciones atomicas con TRY/CATCH/ROLLBACK** para integridad.
4. **Multi-tenant + auditoria** para cumplir normativa de salud.
