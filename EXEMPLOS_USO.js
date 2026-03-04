/**
 * EXEMPLOS DE USO - Sistema de Notificação de Vencimentos
 * 
 * Este arquivo mostra exemplos práticos de como o sistema funciona
 * com diferentes formatos de contatos e datas.
 */

// ============================================
// EXEMPLO 1: Testando com dados fictícios
// ============================================

const { verificarVencimentos } = require("./verificador_vencimentos");

/**
 * Mock socket para não enviar mensagens de verdade
 */
const mockSocket = {
  sendMessage: async (jid, content) => {
    console.log(`\n📤 [TESTE] Mensagem para: ${jid}`);
    console.log(`📝 Conteúdo:\n${content.text}\n`);
  },
};

/**
 * EXEMPLO 2: Formatos de contato aceitos
 */

const EXEMPLOS_FORMATOS = {
  // Formato 1: Com emoji, data completa e nome
  exemplo1: "🥇 03/04/2026 - WAGNER LOPES - PA 6806",
  
  // Formato 2: Com emoji, data sem ano (repete todo ano)
  exemplo2: "🥇 15/11 - RODOLFO - PE 3754",
  
  // Formato 3: Com emoji, data, nome e código (separador |)
  exemplo3: "🔍 21/03/2026 | DN - SP 5193",
  
  // Formato 4: Outro emoji, data completa
  exemplo4: "💎 23/01/2026 | MARCOS NOBRE | BA 1968",
  
  // Formato 5: Emoji diferente
  exemplo5: "⭐ 15/06/2026 - CLIENTE X",
  
  // Formato 6: Sem emoji
  exemplo6: "10/12/2025 - JOÃO SILVA",
  
  // Formato 7: Data com ano diferentes
  exemplo7: "🔥 25/12/2026 | NATAL CLIENTE",
};

/**
 * EXEMPLO 3: Dados de contato estruturados
 */

const CONTATOS_EXEMPLO = [
  {
    emoji: "🥇",
    dia: 3,
    mes: 4,
    ano: 2026,
    nome: "WAGNER LOPES",
    telefone: "11987654321",
    completo: "🥇 03/04/2026 - WAGNER LOPES - PA 6806",
  },
  {
    emoji: "🔍",
    dia: 21,
    mes: 3,
    ano: 2026,
    nome: "DN",
    telefone: "21998765432",
    completo: "🔍 21/03/2026 | DN - SP 5193",
  },
  {
    emoji: "💎",
    dia: 15,
    mes: 11,
    ano: null, // Sem ano = toda vez que chega essa data no ano
    nome: "RODOLFO",
    telefone: "85988776655",
    completo: "🥇 15/11 - RODOLFO - PE 3754",
  },
];

/**
 * EXEMPLO 4: Simulação de dia de vencimento
 */

console.log("=".repeat(80));
console.log("📅 EXEMPLOS DE USO - Sistema de Notificação de Vencimentos");
console.log("=".repeat(80));

console.log("\n📝 FORMATOS DE CONTATO ACEITOS:\n");
Object.entries(EXEMPLOS_FORMATOS).forEach(([chave, formato], i) => {
  console.log(`${i + 1}. ${formato}`);
});

console.log("\n" + "=".repeat(80));
console.log("\n🎯 ESTRUTURA DE DADOS EXTRAÍDA:\n");

CONTATOS_EXEMPLO.forEach((contato, i) => {
  console.log(`Contato ${i + 1}:`);
  console.log(`  Original: ${contato.completo}`);
  console.log(`  Emoji:    ${contato.emoji}`);
  console.log(`  Data:     ${contato.dia}/${contato.mes}${contato.ano ? "/" + contato.ano : ""}`);
  console.log(`  Nome:     ${contato.nome}`);
  console.log(`  Telefone: ${contato.telefone}`);
  console.log("");
});

console.log("=".repeat(80));
console.log("\n⏰ COMPORTAMENTO POR DATA:\n");

const hoje = new Date();
const diaHoje = hoje.getDate();
const mesHoje = hoje.getMonth() + 1;
const anoHoje = hoje.getFullYear();

console.log(`Data atual: ${diaHoje}/${mesHoje}/${anoHoje}\n`);

CONTATOS_EXEMPLO.forEach((contato) => {
  let status = "";
  let mensagem = "";

  // Com ano especificado
  if (contato.ano) {
    if (
      contato.dia === diaHoje &&
      contato.mes === mesHoje &&
      contato.ano === anoHoje
    ) {
      status = "🎯 VENCE HOJE";
      mensagem = "✅ Este cliente receberia uma mensagem AGORA de aviso";
    } else if (contato.ano < anoHoje) {
      status = "❌ JÁ VENCEU";
      mensagem = "Este cliente já passou da data de vencimento";
    } else if (
      contato.mes < mesHoje ||
      (contato.mes === mesHoje && contato.dia < diaHoje)
    ) {
      status = "⏳ VENCE ESTE ANO";
      mensagem = "Este cliente vence ainda este ano";
    } else {
      status = "📅 FUTURO";
      mensagem = "Este cliente vence no futuro";
    }
  }
  // Sem ano especificado (repetido todo ano)
  else {
    if (contato.dia === diaHoje && contato.mes === mesHoje) {
      status = "🎯 VENCE HOJE";
      mensagem = "✅ Este cliente receberia uma mensagem AGORA de aviso";
    } else {
      status = "⏳ PRÓXIMO";
      mensagem = "Este cliente vence novamente em " + contato.dia + "/" + contato.mes;
    }
  }

  console.log(`${contato.nome}:`);
  console.log(`  Status:  ${status}`);
  console.log(`  ${mensagem}`);
  console.log("");
});

console.log("=".repeat(80));
console.log("\n🔄 FLUXO DE FUNCIONAMENTO:\n");

console.log(`PASSO 1: Sistema conecta à API Google Contacts
         └─> Lista todos os contatos

PASSO 2: Para cada contato, extrai a data do nome
         └─> Exemplo: "🔍 21/03/2026 | DN - SP 5193" → 21/03/2026

PASSO 3: Verifica se a data = data de hoje
         └─> Se sim → próximo passo
         └─> Se não → pula para próximo contato

PASSO 4: Extrai nome do cliente
         └─> Exemplo: "DN" ou "WAGNER LOPES"

PASSO 5: Cria mensagem de aviso personalizada
         └─> Exemplo: "🚨 AVISO DE VENCIMENTO\n📌 DN\n..."

PASSO 6: Envia mensagem via WhatsApp
         └─> Para: 21998765432@s.whatsapp.net
         └─> Com: mensagem personalizada

PASSO 7: Marca como notificado hoje
         └─> Futuras execuções não enviam novamente

PASSO 8: Aguarda próximo dia
         └─> Executa novamente amanhã às 08:00
`);

console.log("=".repeat(80));
console.log("\n📊 MÉTRICAS ESPERADAS:\n");

const totalContatos = CONTATOS_EXEMPLO.length;
const vencimentosHoje = CONTATOS_EXEMPLO.filter(
  (c) =>
    c.dia === diaHoje &&
    c.mes === mesHoje &&
    (!c.ano || c.ano === anoHoje)
);

console.log(`Total de contatos no exemplo:     ${totalContatos}`);
console.log(`Vencimentos hoje:                 ${vencimentosHoje.length}`);
console.log(`Mensagens que seriam enviadas:    ${vencimentosHoje.length}`);
console.log(`Próxima execução automática:      amanhã às 08:00\n`);

console.log("=".repeat(80));
console.log("\n💡 DICAS IMPORTANTES:\n");

console.log("1. ✅ CORRETO - Formatos aceitos:");
console.log("   • 🥇 03/04/2026 - WAGNER LOPES");
console.log("   • 15/11 - RODOLFO");
console.log("   • 🔍 21/03/2026 | DN\n");

console.log("2. ❌ INCORRETO - Formatos não reconhecidos:");
console.log("   • Wagner Lopes - 03/04/2026 (data no final)");
console.log("   • 04-03-2026 (separador - em vez de /)");
console.log("   • 2026/04/03 (formato invertido)\n");

console.log("3. 🔧 Para adicionar contatos com data na API Google:");
console.log("   1. Abra Google Contacts (contacts.google.com)");
console.log("   2. Crie novo contato");
console.log("   3. Nome: 🔍 21/03/2026 | DN - SP 5193");
console.log("   4. Clique em Salvar\n");

console.log("4. ⏰ Para testar imediatamente (sem esperar 08:00):");
console.log("   node teste_vencimentos.js\n");

console.log("=".repeat(80));
console.log("\n✅ Exemplos carregados com sucesso!");
console.log("📖 Leia VENCIMENTOS_README.md para documentação completa\n");
