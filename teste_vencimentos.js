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

// Mock do socket para testes
const mockSocket = {
  sendMessage: async (jid, content) => {
    console.log(`\n📤 [TESTE] Mensagem que seria enviada para: ${jid}`);
    console.log(`📝 Conteúdo:\n${content.text}\n`);
  },
};

// Função de teste
async function testarVencimentos() {
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
        console.log("⚠️ Nenhum contato com data encontrado na API Google\n");
        return;
      }

      const contatos = resultado.response.resultado;
      console.log(`✅ Encontrados ${contatos.length} contatos com data\n`);

      // Lista todos os contatos
      console.log("📋 CONTATOS COM DATAS:");
      console.log("─".repeat(80));
      
      contatos.forEach((c, i) => {
        const status = (c.dia === hoje.getDate() && c.mes === hoje.getMonth() + 1) 
          ? "🎯 VENCE HOJE" 
          : "⏳ Futuro";
        console.log(`${i + 1}. ${c.completo}`);
        console.log(`   Data: ${c.dia}/${c.mes}${c.ano ? `/${c.ano}` : ''}  ${status}`);
        console.log("");
      });

      console.log("─".repeat(80) + "\n");

      // Executa verificação
      console.log("🔔 Executando verificação de vencimentos...\n");
      await verificarVencimentos(mockSocket);

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
