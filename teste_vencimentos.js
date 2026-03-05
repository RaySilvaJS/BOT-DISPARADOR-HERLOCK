/**
 * ARQUIVO DE TESTE - VERIFICADOR DE VENCIMENTOS
 * 
 * Este arquivo permite testar o sistema de notificação de vencimentos
 * sem esperar pelas 8:00 da manhã.
 * 
 * Use assim:
 * node teste_vencimentos.js
 */

const { verificarVencimentos } = require("./verificador_vencimentos");
const { googleApiContats } = require("./tmp/Google-Api/index");
// opcional: iniciar bot para enviar mensagens reais
const { startBot } = require("./index");


// Mock do socket para testes
const mockSocket = {
  sendMessage: async (jid, content) => {
    console.log(`\n📤 [TESTE] Mensagem que seria enviada para: ${jid}`);
    console.log(`📝 Conteúdo:\n${content.text}\n`);
  },
};

// Função de teste
async function testarVencimentos() {
  if (process.argv.includes("--real")) {
    console.log("\n👀 Executando em modo REAL (mensagens serão enviadas pelo bot). Use com cuidado!");
  }
  try {
    console.log("🧪 INICIANDO TESTE DO SISTEMA DE VENCIMENTOS\n");
    console.log("================================================\n");

    // Mostra data de hoje
    const hoje = new Date();
    console.log(`📅 Data atual: ${hoje.toLocaleDateString("pt-BR")}`);
    console.log(`🕐 Hora: ${hoje.toLocaleTimeString("pt-BR")}\n`);

    // Inicializa API Google
    console.log("🔄 Conectando à API Google Contacts...");
    try {
      const resultado = await googleApiContats(4, [1]);
      
      if (resultado.erro) {
        console.log(`❌ Erro ao acessar a API: ${resultado.erro}`);
        console.log("\n💡 Dica: Certifique-se de ter credenciais.json e token.json configurados");
        console.log("   em: tmp/Google-Api/\n");
        return;
      }

      if (!resultado.response || !resultado.response.resultado) {
        console.log("⚠️ Nenhum contato com EMOJI PERMITIDO E DATA encontrado");
        console.log("\n💡 Contatos válidos devem ter:");
        console.log("   • Emoji: 🥉 🥈 🥇 💎 🔍");
        console.log("   • Data: DD/MM/AAAA (ano obrigatório)");
        console.log("\n   Exemplo: 🔍 21/03/2026 | DN - SP 5193\n");
        return;
      }

      const contatos = resultado.response.resultado;
      console.log(`✅ Encontrados ${contatos.length} contatos com data\n`);

      // Lista todos os contatos
      console.log("📋 CONTATOS COM DATAS:");
      console.log("─".repeat(80));

      contatos.forEach((c, i) => {
        let status = "";
        const anoHoje = hoje.getFullYear();
        const mesHoje = hoje.getMonth() + 1;
        const diaHoje = hoje.getDate();

        // apenas datas com ano do ano atual geram mensagem
        const anoContato = parseInt(c.ano, 10);
        const mesContato = parseInt(c.mes, 10);
        const diaContato = parseInt(c.dia, 10);

        if (
          anoContato === anoHoje &&
          mesContato === mesHoje &&
          diaContato === diaHoje
        ) {
          status = "🎯 VENCE HOJE";
        } else {
          status = "⏳ Ignorado (não é data do ano atual)";
        }

        console.log(`${i + 1}. ${c.completo}`);
        console.log(`   Data: ${c.dia}/${c.mes}/${c.ano}  ${status}`);
        console.log("");
      });

      console.log("─".repeat(80) + "\n");

      // Executa verificação
      console.log("🔔 Executando verificação de vencimentos...\n");
      // escolhe socket de teste ou real
      let sock = mockSocket;
      if (process.argv.includes("--real")) {
        console.log("⚠️ Modo real ativado – aguardando conexão do bot...");
        sock = await startBot();
        console.log("✅ Bot conectado! Iniciando envios...");
        // aguarda um pouco para garantir que está pronto
        await new Promise(r => setTimeout(r, 2000));
      }
      await verificarVencimentos(sock);

    } catch (error) {
      console.log("❌ Erro:", error.message);
    }

    console.log("\n================================================");
    console.log("✅ Teste concluído\n");

  } catch (erro) {
    console.error("❌ Erro fatal no teste:", erro);
  }

  process.exit(0);
}

// Executa
testarVencimentos();
