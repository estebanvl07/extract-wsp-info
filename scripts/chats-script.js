(async () => {
  const win = window.open("", "_blank");

  if (!win) {
    alert(
      "El navegador bloqueó la nueva pestaña. Permite popups y vuelve a intentar.",
    );
    return;
  }

  win.document.open();
  win.document.write(`
      <html>
        <head>
          <title>whatsapp-historial-normalizado</title>
          <style>
            body {
              font-family: monospace;
              white-space: pre-wrap;
              margin: 16px;
            }
          </style>
        </head>
        <body>
          <pre id="output">Preparando extracción...</pre>
        </body>
      </html>
    `);
  win.document.close();

  const output = win.document.getElementById("output");

  const setStatus = (text) => {
    if (output) output.textContent = text;
    console.log(text);
  };

  const toStr = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value._serialized === "string") return value._serialized;
    return String(value);
  };

  const isGroupId = (id) => typeof id === "string" && id.includes("@g.us");
  const isUserId = (id) =>
    typeof id === "string" && (id.endsWith("@c.us") || id.endsWith("@lid"));

  const normalizedIdCache = new Map();

  async function resolveToPhonePreferred(id) {
    const rawId = toStr(id);
    if (!rawId) return "";
    if (isGroupId(rawId)) return rawId;

    if (normalizedIdCache.has(rawId)) {
      return normalizedIdCache.get(rawId);
    }

    let finalId = rawId;

    if (isUserId(rawId)) {
      try {
        const entry = await WPP.contact.getPnLidEntry(rawId);
        const phone = entry?.phoneNumber?._serialized;
        const lid = entry?.lid?._serialized;

        if (phone) {
          finalId = phone;
          normalizedIdCache.set(phone, phone);
          if (lid) normalizedIdCache.set(lid, phone);
        } else {
          finalId = rawId;
          if (lid) normalizedIdCache.set(lid, lid);
          normalizedIdCache.set(rawId, rawId);
        }
      } catch {
        normalizedIdCache.set(rawId, rawId);
        finalId = rawId;
      }
    } else {
      normalizedIdCache.set(rawId, rawId);
    }

    return finalId;
  }

  setStatus("Cargando contactos...");
  const contacts = await WPP.contact.list();

  for (let i = 0; i < contacts.length; i++) {
    const contactId = toStr(contacts[i]?.id);
    if (!contactId || isGroupId(contactId)) continue;

    try {
      await resolveToPhonePreferred(contactId);
    } catch {}
  }

  setStatus("Cargando chats...");
  const chats = await WPP.chat.list({ onlyUsers: true });

  const result = {};

  for (let i = 0; i < chats.length; i++) {
    const chat = chats[i];
    const rawChatId = toStr(chat?.id);

    if (!rawChatId || isGroupId(rawChatId)) continue;

    const normalizedChatId = await resolveToPhonePreferred(rawChatId);

    setStatus(`Extrayendo chat ${i + 1}/${chats.length}: ${normalizedChatId}`);

    let messages = [];
    try {
      messages = await WPP.chat.getMessages(rawChatId, { count: -1 });
    } catch (err) {
      result[normalizedChatId] = {
        error: String(err),
      };
      continue;
    }

    const normalizedMessages = [];

    for (const m of messages) {
      const rawMsgId = toStr(m?.id);
      const rawFrom = toStr(m?.from);
      const rawTo = toStr(m?.to);

      const from = await resolveToPhonePreferred(rawFrom);
      const to = await resolveToPhonePreferred(rawTo);

      const inferredFromMe =
        typeof rawMsgId === "string" && rawMsgId.startsWith("true_");

      normalizedMessages.push({
        id: rawMsgId,
        from,
        to,
        body: m?.body || "",
        type: m?.type || "",
        timestamp: m?.t || m?.timestamp || null,
        fromMe: inferredFromMe,
        ...(rawFrom && rawFrom !== from ? { originalFrom: rawFrom } : {}),
        ...(rawTo && rawTo !== to ? { originalTo: rawTo } : {}),
      });
    }

    if (!result[normalizedChatId]) {
      result[normalizedChatId] = [];
    }

    if (Array.isArray(result[normalizedChatId])) {
      result[normalizedChatId].push(...normalizedMessages);
      result[normalizedChatId].sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
      );
    }
  }

  const json = JSON.stringify(result, null, 2);

  if (output) {
    output.textContent = json;
  }

  try {
    await navigator.clipboard.writeText(json);
    console.log("JSON copiado al portapapeles");
  } catch (err) {
    console.warn("No se pudo copiar automáticamente al portapapeles", err);
  }
})();
