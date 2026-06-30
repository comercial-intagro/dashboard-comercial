# Instructivo: Autorizar un nuevo usuario al Dashboard Comercial

Seguí estos pasos cada vez que quieras dar acceso a una persona nueva.
El usuario nuevo necesita tener una cuenta de **Gmail** (o un correo gestionado por Google Workspace).

---

## Paso 1 — Abrir el Apps Script

1. Entrá a **script.google.com**
2. Iniciá sesión con tu cuenta
3. Abrí el proyecto **"Dashboard Intagro - Backend"**

---

## Paso 2 — Encontrar la lista de correos autorizados

En el código, cerca del inicio, buscá este bloque:

```
const AUTHORIZED_EMAILS = [
  "brian.icardi@gmail.com",
  "smonteoliva.glen@gmail.com",
  ...
];
```

---

## Paso 3 — Agregar el nuevo correo

1. Poné el cursor al final del último correo de la lista
2. Agregá una **coma** después de las comillas de cierre de ese último correo
3. En una línea nueva, escribí el correo del nuevo usuario entre comillas

**Reglas importantes:**
- El correo va **todo en minúsculas**
- Tiene que ir entre **comillas dobles** `"..."`
- Cada correo (menos el último) lleva una **coma** al final

**Ejemplo** — agregando `nuevo.usuario@gmail.com`:

```
const AUTHORIZED_EMAILS = [
  "brian.icardi@gmail.com",
  "smonteoliva.glen@gmail.com",
  "estebanrugna@gmail.com",
  "nuevo.usuario@gmail.com"
];
```

(Fijate que el correo nuevo es el último, por eso NO lleva coma al final;
y al correo que antes era el último —estebanrugna— SÍ le agregaste la coma.)

---

## Paso 4 — Guardar

- Apretá el ícono del disquete 💾 (o Ctrl + S)
- Esperá a que arriba diga **"Proyecto guardado"**

---

## Paso 5 — Desplegar la nueva versión

Este es el paso que más se olvida. Si no lo hacés, el cambio NO tiene efecto.

1. Botón azul **"Implementar"** (arriba a la derecha)
2. Click en **"Administrar implementaciones"**
3. Click en el **lápiz ✏️** de la implementación activa
4. En el campo **"Versión"** → abrir el desplegable → elegir **"Nueva versión"**
   ⚠️ Si dejás la versión vieja, el cambio no se publica
5. (Opcional) En "Descripción" poné algo como: "Agregar acceso a [nombre]"
6. Botón **"Implementar"** (abajo a la derecha)
7. Cerrá con **"Listo"**

---

## Paso 6 — Listo

El nuevo usuario ya puede entrar a:
**https://comercial-intagro.github.io/dashboard-comercial/**

Solo tiene que iniciar sesión con el Gmail que autorizaste.

---

## Notas y problemas comunes

- **No hace falta tocar el HTML ni hacer git push.** Agregar usuarios es solo del Apps Script.

- **Si el usuario dice "no me deja entrar":**
  - Verificá que escribiste el correo EXACTAMENTE igual al que usa la persona
    (sin espacios, todo en minúsculas)
  - Confirmá que elegiste **"Nueva versión"** al desplegar (Paso 5, punto 4).
    Es el error más común.
  - Pedile que pruebe en una ventana de incógnito (Ctrl + Shift + N)

- **Para QUITAR un usuario:** mismo procedimiento, pero borrás la línea de su
  correo en vez de agregarla (cuidando de no dejar comas sueltas), guardás y
  desplegás nueva versión.

- **Importante:** este procedimiento (agregar/quitar correos) NO requiere
  autorizar permisos nuevos. Solo desplegar nueva versión y listo.
