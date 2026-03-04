const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const { iniciarMonitorVencimentos } = require("./verificador_vencimentos");

// ================= UTIL =================
const loadJSON = (path, def = {}) =>
  fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : def;

const saveJSON = (path, data) =>
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ================= LIMPEZA DE AUTH =================
function limparPastaAuth() {
  const authPath = "./auth";

  if (!fs.existsSync(authPath)) return;

  const arquivos = fs.readdirSync(authPath);
  const jsonFiles = arquivos.filter(
    (f) => f.endsWith(".json") && f !== "creds.json"
  );

  // Limpar se houver mais de 10 arquivos JSON
  if (jsonFiles.length > 10) {
    jsonFiles.forEach((arquivo) => {
      try {
        fs.unlinkSync(path.join(authPath, arquivo));
        console.log(`🗑️ Deletado: ${arquivo}`);
      } catch (err) {
        console.log(`⚠️ Erro ao deletar ${arquivo}:`, err.message);
      }
    });
    console.log(`✅ Limpeza concluída: ${jsonFiles.length} arquivos removidos`);
  }
}

// ================= CONFIG =================
const clientesData = loadJSON("./data/clientes.json");
const clientes = clientesData.clientesPrivate || [];

if (!clientes.length) {
  console.log("❌ Nenhum cliente encontrado");
  process.exit(1);
}

const enviosPath = "./data/envios.json";
const statePath = "./data/state.json";

const envios = loadJSON(enviosPath, {});
const state = loadJSON(statePath, {
  lastIndex: 0,
  enviosHoje: 0,
  dataHoje: new Date().toDateString(),
  contadorEnvios: 0,
});

const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;
const LIMITE_DIARIO = 40;

let disparadorRodando = false;
let monitorVencimentosRodando = false;

// ================= DETECÇÃO DE PEDIDO DE PIX =================
function detectarPedidoPix(texto) {
  if (!texto) return false;

  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const gatilhos = [
    "qual o pix",
    "qual seu pix",
    "me passa o pix",
    "manda o pix",
    "envia o pix",
    "passa o pix",
    "qual a chave pix",
    "manda a chave pix",
    "me manda a chave",
    "envia a chave",
    "passa sua chave",
    "qual a chave",
    "chave pix",
    "pix pra pagamento",
    "como pago",
    "como fazer o pagamento",
    "como faco o pagamento",
    "pra onde pago",
    "onde pago",
    "onde transfiro",
    "dados para pagamento",
    "me manda os dados",
    "vou pagar",
    "ja vou pagar",
    "ja vou fazer o pix",
    "posso fazer o pix",
    "pode mandar a chave",
    "manda a chave ai",
    "me passa a conta",
    "pix?",
    "pix ai",
    "qual pix",
    "manda pix",
    "chave ai",
  ];

  return gatilhos.some((g) => t.includes(g));
}

function mensagemPix() {
  return `💳 *PIX PARA PAGAMENTO*  

👤 Igor Vinicius da Silva  
🏦 Mercado Pago  
🔑 Chave PIX: +55 21 99759-2682  

Após pagar me envia o comprovante aqui 👍`;
}

// ================= FUNÇÕES =================
function clienteVencido(cliente) {
  if (!cliente.vencimento) return false;
  return new Date(cliente.vencimento).getTime() < Date.now();
}

function horarioPermitido() {
  const h = new Date().getHours();
  return h >= 8 && h <= 23;
}

function delayNormal() {
  return Math.floor(Math.random() * (25 * 60_000 - 10 * 60_000)) + 10 * 60_000;
}

function delayLongo() {
  return Math.floor(Math.random() * (90 * 60_000 - 45 * 60_000)) + 45 * 60_000;
}

// ================= BOT =================
async function startBot() {
  limparPastaAuth();

  const { state: authState, saveCreds } = await useMultiFileAuthState("./auth");
const pino = require("pino");

const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    auth: authState,
    printQRInTerminal: false,
    logger: pino({
      level: "silent",
    }),
    browser: ["NS Multi Device", "Chrome", "3.0"],
    version,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "open") {
      console.log("✅ Bot conectado");
      if (!disparadorRodando) {
        disparadorRodando = true;
        disparador(sock);
      }
      if (!monitorVencimentosRodando) {
        monitorVencimentosRodando = true;
        iniciarMonitorVencimentos(sock);
      }
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Conexão fechada. Reconectar:", shouldReconnect, lastDisconnect?.error);
      if (shouldReconnect) startBot();
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    try {
      const messages = m.messages || [];

      for (const msg of messages) {
        if (!msg || !msg.message) continue;
        if (msg.key?.fromMe) continue;

        const remoteJid = msg.key?.remoteJid.includes("@lid") ? msg.key?.remoteJidAlt : msg.key?.remoteJid
        // console.log("🔍 Processando mensagem de:", JSON.stringify(m, null, 2));
        if (!remoteJid || remoteJid.endsWith("@g.us")) continue;

        const messageContent = msg.message || {};
        let content = "";

        if (typeof messageContent === "string") content = messageContent;
        else if (messageContent.conversation)
          content = messageContent.conversation;
        else if (messageContent.extendedTextMessage?.text)
          content = messageContent.extendedTextMessage.text;
        else if (messageContent.imageMessage?.caption)
          content = messageContent.imageMessage.caption;
        else if (
          messageContent.listResponseMessage?.singleSelectReply?.selectedRowId
        )
          content =
            messageContent.listResponseMessage.singleSelectReply.selectedRowId;
        else if (messageContent.buttonsResponseMessage?.selectedButtonId)
          content = messageContent.buttonsResponseMessage.selectedButtonId;

        const text = (content || "").toString().trim().toLowerCase();
        if (text) console.log("📩 Mensagem recebida de", remoteJid, ":", text);

        // 🔥 PEDIDO DE PIX
        if (detectarPedidoPix(text)) {
          await sock.sendMessage(remoteJid, { text: mensagemPix() });
          console.log("💰 Cliente pediu PIX — chave enviada para", remoteJid);
          continue;
        }

        if (text === "quero") {
          if (envios[remoteJid]) {
            await sock.sendMessage(remoteJid, {
              text: "Link do Grupo 👇🏼\n\nhttps://chat.whatsapp.com/CqPD4qqM3h2DabDrvlRSFh",
            });
            console.log("✅ Resposta enviada para:", remoteJid);
          } else {
            console.log("🔒 Remetente não autorizado:", remoteJid);
          }
        }
      }
    } catch (err) {
      console.log("❌ Erro ao processar mensagens:", err);
    }
  });
}

// ================= DISPARADOR =================
async function disparador(sock) {
  let index = state.lastIndex;

  while (true) {
    if (!horarioPermitido()) {
      await delay(30 * 60_000);
      continue;
    }

    if (new Date().toDateString() !== state.dataHoje) {
      state.dataHoje = new Date().toDateString();
      state.enviosHoje = 0;
      state.contadorEnvios = 0;
      saveJSON(statePath, state);
    }

    if (state.enviosHoje >= LIMITE_DIARIO) {
      await delay(6 * 60 * 60_000);
      continue;
    }

    const cliente = clientes[index];
    const numero = cliente.number;
    const ultimoEnvio = envios[numero] ? new Date(envios[numero]).getTime() : 0;
    const agora = Date.now();

    if (
      clienteVencido(cliente) &&
      (!ultimoEnvio || agora - ultimoEnvio >= SETE_DIAS)
    ) {
      try {
        await sock.sendMessage(numero, { text: mensagemAleatoria(cliente) });

        envios[numero] = new Date().toISOString();
        state.enviosHoje++;
        state.contadorEnvios++;

        saveJSON(enviosPath, envios);
        saveJSON(statePath, state);

        const limitePausa = Math.floor(Math.random() * (8 - 5 + 1)) + 5;

        if (state.contadorEnvios >= limitePausa) {
          await delay(delayLongo());
          state.contadorEnvios = 0;
        } else {
          await delay(delayNormal());
        }
      } catch {
        await delay(15 * 60_000);
      }
    }

    index++;
    if (index >= clientes.length) index = 0;
    state.lastIndex = index;
    saveJSON(statePath, state);
  }
}

// ================= MENSAGENS =================
function mensagemAleatoria() {
  const mensagens = [
    `🚨 Grupo de consultas de dados ATUALIZADO!\n\nEnvie *"quero"* que te mando o link novo.\n\n🕵🏼 ARTHUR HERLOCK`,
    `📢 Aviso importante!\n\nGrupo movido.\n\nResponda *"quero"* para receber o link.\n\n🕵🏼 ARTHUR HERLOCK`,
    `🔍 Grupo em novo endereço!\n\nMande *"quero"* para entrar.\n\n🕵🏼 ARTHUR HERLOCK`,
    `💎 Atualização do grupo.\n\nResponda *"quero"* que envio o acesso.\n\n🕵🏼 ARTHUR HERLOCK`,
    `⚠️ Mudamos o grupo.\n\nEnvie *"quero"* para o novo link.\n\n🕵🏼 ARTHUR HERLOCK`,
    `📂 Novo grupo liberado.\n\nManda *"quero"* aqui.\n\n🕵🏼 ARTHUR HERLOCK`,
    `🛡️ Grupo atualizado.\n\nResponda *"quero"* que envio o link.\n\n🕵🏼 ARTHUR HERLOCK`,
    `🚀 Grupo versão nova.\n\nMande *"quero"* para entrar.\n\n🕵🏼 ARTHUR HERLOCK`,
  ];

  return mensagens[Math.floor(Math.random() * mensagens.length)];
}

// ================= START =================
startBot();
