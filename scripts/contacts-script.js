(async () => {
  const win = window.open("", "_blank");

  if (!win) {
    alert(
      "El navegador bloqueó la nueva ventana. Permite popups y vuelve a intentar.",
    );
    return;
  }

  win.document.open();
  win.document.write(`
      <html>
        <head>
          <title>contactos-cus-con-nombre</title>
          <style>
            body {
              font-family: monospace;
              white-space: pre-wrap;
              margin: 16px;
            }
          </style>
        </head>
        <body>
          <pre id="output">Cargando contactos...</pre>
        </body>
      </html>
    `);
  win.document.close();

  const output = win.document.getElementById("output");

  const contacts = await WPP.contact.list({ onlyMyContacts: true });
  const result = [];

  for (const contact of contacts) {
    const contactId =
      contact?.id?._serialized ||
      (typeof contact?.id === "string" ? contact.id : "");

    if (!contactId) continue;

    let cUsId = null;

    try {
      const entry = await WPP.contact.getPnLidEntry(contactId);
      cUsId = entry?.phoneNumber?._serialized || null;
    } catch {}

    if (!cUsId && contactId.endsWith("@c.us")) {
      cUsId = contactId;
    }

    if (cUsId && cUsId.endsWith("@c.us")) {
      result.push({
        id: cUsId,
        name:
          contact.formattedName ||
          contact.pushname ||
          contact.name ||
          contact.shortName ||
          "",
      });
    }
  }

  const uniqueMap = new Map(result.map((x) => [x.id, x]));
  const unique = [...uniqueMap.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const json = JSON.stringify(unique, null, 2);

  if (output) {
    output.textContent = json;
  }

  console.log(unique);
})();
