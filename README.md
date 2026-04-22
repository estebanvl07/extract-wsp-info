# wss

Proyecto pequeño para extraer y normalizar datos de `WhatsApp Web` usando `WPP` en el navegador, y luego guardarlos como archivos JSON locales.

Este repositorio incluye scripts para:

- exportar contactos a `contacts.json`
- exportar chats a `whatsapp-chats2.json`
- revisar rápidamente la cantidad de chats con `index.js`

## Requisitos

Antes de usar los scripts, necesitas tener acceso a `WhatsApp Web` y contar con `WPP` disponible en la página.

Este proyecto se apoya en `wa-js` de WPPConnect:

- Repositorio: [https://github.com/wppconnect-team/wa-js/tree/main#](https://github.com/wppconnect-team/wa-js/tree/main#)

`wa-js` expone la variable global `WPP` dentro de `WhatsApp Web`, lo que permite usar funciones como:

- `WPP.contact.list()`
- `WPP.contact.getPnLidEntry()`
- `WPP.chat.list()`
- `WPP.chat.getMessages()`

Sin `WPP`, estos scripts no van a funcionar.

## Estructura

- `scripts/contacts-script.js`: extrae contactos y los normaliza a IDs tipo `@c.us`
- `scripts/chats-script.js`: extrae chats de usuarios, normaliza IDs y ordena mensajes por fecha
- `contacts.json`: salida esperada de contactos
- `whatsapp-chats2.json`: salida esperada de chats
- `index.js`: ejemplo simple que carga el JSON de chats y muestra cuántas conversaciones hay

## Cómo se usa

### 1. Abrir WhatsApp Web

Entra a `https://web.whatsapp.com/` y asegúrate de que la sesión ya esté iniciada.

### 2. Cargar `WPP`

Debes tener `wa-js` inyectado en la página para que exista `window.WPP`.

Puedes hacerlo con alguna de estas opciones:

- usando una extensión como `Tampermonkey`
- inyectando el script manualmente en el navegador
- usando tu propio flujo basado en `wa-js`

Para validar que todo está listo, en la consola del navegador prueba:

```js
window.WPP
```

Si devuelve un objeto, ya puedes ejecutar los scripts.

### 3. Exportar contactos

1. Abre `WhatsApp Web`
2. Abre la consola del navegador
3. Copia y pega el contenido de `scripts/contacts-script.js`
4. Ejecuta el script

El script abrirá una nueva ventana con el JSON generado.

La salida tendrá una estructura como esta:

```json
[
  {
    "id": "573xxxxxxxxx@c.us",
    "name": "Nombre del contacto"
  }
]
```

Luego puedes copiar ese contenido y guardarlo en `contacts.json`.

### 4. Exportar chats

1. Abre `WhatsApp Web`
2. Abre la consola del navegador
3. Copia y pega el contenido de `scripts/chats-script.js`
4. Ejecuta el script

Este script:

- carga los contactos
- lista chats de usuarios
- excluye grupos
- intenta normalizar IDs `@lid` hacia `@c.us`
- extrae todos los mensajes
- ordena los mensajes por `timestamp`
- genera un objeto JSON por chat

La salida se muestra en una nueva ventana y además intenta copiarse al portapapeles automáticamente.

Ejemplo de estructura:

```json
{
  "573xxxxxxxxx@c.us": [
    {
      "id": "false_xxx",
      "from": "573xxxxxxxxx@c.us",
      "to": "573yyyyyyyyy@c.us",
      "body": "hola",
      "type": "chat",
      "timestamp": 1776818121,
      "fromMe": false
    }
  ]
}
```

Después puedes pegar el resultado en `whatsapp-chats2.json`.

## Normalización de IDs

Los scripts intentan convertir identificadores internos como `@lid` a números tipo `@c.us` usando:

```js
WPP.contact.getPnLidEntry(...)
```

Eso ayuda a dejar contactos y mensajes con IDs más consistentes para procesarlos después.

Cuando no se puede resolver un ID, el script conserva el valor original.

## Uso local del JSON

Si ya tienes `whatsapp-chats2.json`, puedes ejecutar:

```bash
node index.js
```

Actualmente `index.js` solo carga el archivo y muestra cuántas claves de chat existen.

## Flujo recomendado

1. Inyectar `wa-js` en `WhatsApp Web`
2. Ejecutar `scripts/contacts-script.js`
3. Guardar el resultado en `contacts.json`
4. Ejecutar `scripts/chats-script.js`
5. Guardar el resultado en `whatsapp-chats2.json`
6. Procesar los datos localmente con `Node.js` si lo necesitas

## Notas

- Los scripts están pensados para usarse manualmente desde el navegador.
- No están empaquetados como una app completa ni como un CLI.
- Si `WhatsApp Web` cambia internamente, algunas funciones de `WPP` podrían variar con el tiempo.
- Revisa la documentación oficial de `wa-js` para ver funciones disponibles y cambios recientes:
  [https://github.com/wppconnect-team/wa-js/tree/main#](https://github.com/wppconnect-team/wa-js/tree/main#)
