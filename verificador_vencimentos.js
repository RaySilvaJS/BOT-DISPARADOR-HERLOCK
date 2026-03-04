const { googleApiContats } = require("./tmp/Google-Api/index");
const fs = require("fs");
const path = require("path");

// ================= CONFIG =================
const notificadasPath = "./data/notificadas_hoje.json";

const loadJSON = (path, def = {}) =>
  fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : def;

const saveJSON = (path, data) =>
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ================= FUNÇÕES =================
/**
 * Extrai data de uma string de contato
 * Exemplos:
 * "🥇 03/04/2026 - WAGNER LOPES - PA 6806" → {dia: 03, mes: 04, ano: 2026}
 * "🔍 21/03/2026 | DN - SP 5193" → {dia: 21, mes: 03, ano: 2026}
 * "🥇15/11 - RODOLFO - PE 3754" → {dia: 15, mes: 11, ano: null}
 */
function extrairData(textoContato) {
  if (!textoContato) return null;

  // Regex melhorado para capturar data
  const match = textoContato.match(
    /^(\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic})?\s*(\d{2})\/(\d{2})(?:\/(\d{4}))?/u
  );

  if (!match) return null;

  return {
    dia: parseInt(match[2]),
    mes: parseInt(match[3]),
    ano: match[4] ? parseInt(match[4]) : null,
    textoOriginal: textoContato,
  };
}

/**
 * Verifica se a data do contato é hoje
 */
function isVencimentoHoje(dataContato) {
  if (!dataContato) return false;

  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth() + 1;
  const anoHoje = hoje.getFullYear();

  // Se tem ano especificado, verifica também o ano
  if (dataContato.ano) {
    return (
      dataContato.dia === diaHoje &&
      dataContato.mes === mesHoje &&
      dataContato.ano === anoHoje
    );
  }

  // Se não tem ano, ignora o ano (válido todos os anos)
  return dataContato.dia === diaHoje && dataContato.mes === mesHoje;
}

/**
 * Extrai nome do contato da string
 * Exemplos:
 * "🥇 03/04/2026 - WAGNER LOPES - PA 6806" → "WAGNER LOPES"
 * "🔍 21/03/2026 | DN - SP 5193" → "DN"
 */
function extrairNome(textoContato) {
  if (!textoContato) return "Cliente";

  // Tenta remover emoji e data do início
  let textoLimpo = textoContato
    .replace(/^(\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic})?\s*/u, "") // Remove emoji
    .replace(/^\d{2}\/\d{2}(?:\/\d{4})?\s*[|-]?\s*/, ""); // Remove data

  // Pega nome até encontrar | ou -
  const nomeMatch = textoLimpo.match(/^([^|-]+)/);
  return nomeMatch ? nomeMatch[1].trim() : "Cliente";
}

/**
 * Mensagem de aviso de vencimento
 */
function gerarMensagemVencimento(nomeCliente) {
  const mensagens = [
    `🚨 *AVISO DE VENCIMENTO* 🚨\n\n📌 ${nomeCliente}\n\nSeu acesso vence *HOJE*!\n\nResponda *"quero"* para renovar.\n\n🕵🏼 ARTHUR HERLOCK`,
    `⏰ *ATENÇÃO: VENCIMENTO HOJE* ⏰\n\n👤 ${nomeCliente}\n\nSua assinatura vence em poucas horas.\n\nMande *"quero"* para continuar.\n\n🕵🏼 ARTHUR HERLOCK`,
    `💎 *ACESSO VENCENDO HOJE* 💎\n\n✋ ${nomeCliente}\n\nRenove seu acesso agora!\n\nDigite *"quero"* para continuar.\n\n🕵🏼 ARTHUR HERLOCK`,
    `⚠️ *ÚLTIMO DIA DE ACESSO* ⚠️\n\n${nomeCliente}\n\nResponda *"quero"* para não perder o acesso.\n\n🕵🏼 ARTHUR HERLOCK`,
  ];

  return mensagens[Math.floor(Math.random() * mensagens.length)];
}

// ================= SISTEMA DE VENCIMENTOS =================
/**
 * Verifica vencimentos dos contatos da API Google
 * Envia 1 mensagem por cliente que venceu hoje
 */
async function verificarVencimentos(sock) {
  try {
    if (!sock || !sock.sendMessage) {
      console.log(
        "⚠️ Socket não disponível para verificação de vencimentos"
      );
      return;
    }

    // Carrega notificações de hoje
    const datahoje = new Date().toDateString();
    const notificadas = loadJSON(notificadasPath, {
      data: datahoje,
      clientes: {},
    });

    // Se mudou o dia, limpa o controle
    if (notificadas.data !== datahoje) {
      notificadas.data = datahoje;
      notificadas.clientes = {};
    }

    // Lista contatos da API Google
    const resultado = await googleApiContats(4, [1]); // Tipo 4 = listar, QUERY[0] = 1 (todos com data)

    if (resultado.erro) {
      console.log("⚠️ Erro ao listar contatos Google:", resultado.erro);
      return;
    }

    if (!resultado.response || !resultado.response.resultado) {
      console.log("ℹ️ Nenhum contato com data encontrado");
      return;
    }

    const contatos = resultado.response.resultado;
    console.log(`📋 Verificando ${contatos.length} contatos com vencimento...`);

    let videoEnviadas = 0;

    for (const contato of contatos) {
      const { nome, telefone, completo } = contato;

      // Se não tem telefone, pula
      if (!telefone || !nome) continue;

      // Formata número para WhatsApp
      const numeroWhatsapp = telefone.replace(/\D/g, "");
      if (numeroWhatsapp.length < 10) continue;

      const jid = `${numeroWhatsapp}@s.whatsapp.net`;

      // Verifica se já foi notificado hoje
      if (notificadas.clientes[jid]) {
        console.log(`✅ ${nome} já foi notificado hoje`);
        continue;
      }

      // Extrai data do nome
      const data = extrairData(completo);
      if (!data) {
        console.log(`⚠️ Não consegui extrair data de: ${completo}`);
        continue;
      }

      // Verifica se vence hoje
      if (!isVencimentoHoje(data)) {
        continue;
      }

      // ENCONTROU VENCIMENTO DE HOJE! 🎯
      try {
        const nomeCliente = extrairNome(completo);
        const mensagem = gerarMensagemVencimento(nomeCliente);

        await sock.sendMessage(jid, { text: mensagem });

        console.log(`✅ Aviso enviado para: ${nome} (${jid})`);
        videoEnviadas++;

        // Marca como notificado hoje
        notificadas.clientes[jid] = true;
        saveJSON(notificadasPath, notificadas);

        // Delay para não spammar
        await delay(3000 + Math.random() * 2000);
      } catch (erro) {
        console.log(`❌ Erro ao enviar para ${nome}:`, erro.message);
        await delay(5000);
      }
    }

    if (videoEnviadas > 0) {
      console.log(`\n🔔 ${videoEnviadas} aviso(s) de vencimento enviado(s) hoje!`);
    } else {
      console.log("✔️ Nenhum vencimento para hoje");
    }
  } catch (erro) {
    console.log("❌ Erro na verificação de vencimentos:", erro.message);
  }
}

/**
 * Inicia o monitoramento de vencimentos (executa 1x ao dia a partir das 8:00)
 */
async function iniciarMonitorVencimentos(sock) {
  console.log("🔔 Monitor de vencimentos iniciado");

  let ultimaVerificacao = null;

  while (true) {
    const agora = new Date();
    const horaAtual = agora.getHours();
    const dataHoje = agora.toDateString();

    // Executa às 08:00 da manhã, 1x por dia
    if (
      horaAtual === 8 &&
      ultimaVerificacao !== dataHoje &&
      sock &&
      sock.sendMessage
    ) {
      console.log("\n⏰ Executando verificação diária de vencimentos...");
      ultimaVerificacao = dataHoje;

      await verificarVencimentos(sock);
    }

    // Verifica a cada 10 minutos
    await delay(10 * 60 * 1000);
  }
}

module.exports = {
  verificarVencimentos,
  iniciarMonitorVencimentos,
};
