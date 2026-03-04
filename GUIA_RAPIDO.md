🚀 GUIA DE INÍCIO RÁPIDO (2 MINUTOS)
═══════════════════════════════════════════════════════════════════════════════

## ⚡ TL;DR (Resumão)

Um sistema foi criado para enviar avisos automáticos quando clientes vencerem.

**O que faz:**
- ✅ Lê contatos da API Google
- ✅ Extrai datas dos nomes (🔍 21/03/2026 | DN)
- ✅ Quando chega 21/03/2026, envia mensagem
- ✅ Apenas 1 mensagem por cliente por dia

**Como usar:**
```bash
node index.js  # É isso! Sistema roda sozinho às 08:00
```

═══════════════════════════════════════════════════════════════════════════════

## 📋 ARQUIVOS CRIADOS

1. `verificador_vencimentos.js` ............... Engine do sistema
2. `teste_vencimentos.js` ................... Para testar AGORA
3. `VENCIMENTOS_README.md` .................. Documentação completa
4. `FAQ_VENCIMENTOS.md` .................... Perguntas frequentes
5. `EXEMPLOS_USO.js` ....................... Exemplos práticos
6. Mais 3 arquivos de documentação e diagrama

═══════════════════════════════════════════════════════════════════════════════

## 🎯 COMO COMEÇAR AGORA

### PASSO 1: Teste o Sistema (30 segundos)
```bash
node teste_vencimentos.js
```

**Resultado esperado:**
```
✅ Encontrados 45 contatos com data
📋 CONTATOS COM DATAS:
   1. 🔍 21/03/2026 | DN - SP 5193  [🎯 VENCE HOJE]
   2. 🥇 15/11 - RODOLFO - PE 3754  [⏳ Futuro]
   ...
```

### PASSO 2: Inicie o Bot (Normal)
```bash
node index.js
```

**Aguarde:**
```
✅ Bot conectado
🔔 Monitor de vencimentos iniciado
```

### PASSO 3: Sistema Funciona
- Diariamente às **08:00** o sistema verifica
- Clientes com vencimento hoje recebem aviso
- Pronto! 🎉

═══════════════════════════════════════════════════════════════════════════════

## 📝 FORMATO DE CONTATO

Na API Google, os contatos devem ter o formato:

```
🔍 21/03/2026 | DN - SP 5193
```

**Estrutura:**
- `🔍` = Emoji (opcional)
- `21/03/2026` = DATA (DD/MM/AAAA ou DD/MM)
- `DN` = NOME (extraído automaticamente)

**Exemplos válidos:**
```
✅ 🥇 03/04/2026 - WAGNER LOPES - PA 6806
✅ 🔍 21/03/2026 | DN - SP 5193
✅ 💎 23/01/2026 | MARCOS NOBRE | BA 1968
✅ 15/11 - RODOLFO - PE 3754
✅ 10/12/2026 JOÃO SILVA
```

═══════════════════════════════════════════════════════════════════════════════

## ⏰ QUANDO FUNCIONA

| Hora | O que acontece |
|------|-----------------|
| 00:00-07:59 | Monitor aguarda |
| **08:00** | **Sistema executa!** ✨ |
| 08:00-23:59 | Próxima execução amanhã |
| Dia seguinte 08:00 | Executa novamente |

**Nota:** Pode mudar a hora. Veja FAQ_VENCIMENTOS.md pergunta P4.

═══════════════════════════════════════════════════════════════════════════════

## 🧪 ATIVAR TESTE MANUAL

Para testar **SEM ESPERAR** pelas 08:00:

```bash
node teste_vencimentos.js
```

Isso simula a execução e mostra quais clientes venceriam hoje.

═══════════════════════════════════════════════════════════════════════════════

## ✅ CHECKLIST DE FUNCIONAMENTO

- [ ] Executou `node teste_vencimentos.js` com sucesso
- [ ] Viu lista de contatos com datas
- [ ] Iniciou o bot com `node index.js`
- [ ] Viu "✅ Bot conectado" no console
- [ ] Viu "🔔 Monitor de vencimentos iniciado"
- [ ] (Opcional) Aguardou 08:00 para ver execução real

**Pronto!** Sistema está 100% funcional ✓

═══════════════════════════════════════════════════════════════════════════════

## 🔧 PERSONALIZAÇÕES COMUNS

### Mudar Horário (ex: 09:00 em vez de 08:00)
Arquivo: `verificador_vencimentos.js`, linha 245
```javascript
if (horaAtual === 9) {  // ← mude 8 para 9
```

### Mudar Mensagens
Arquivo: `verificador_vencimentos.js`, função `gerarMensagemVencimento()`
```javascript
const mensagens = [
  `Sua mensagem aqui`,
  `Outra mensagem`,
];
```

### Ver Mais Opções
Leia: `FAQ_VENCIMENTOS.md`

═══════════════════════════════════════════════════════════════════════════════

## ❌ ERROS COMUNS & SOLUÇÕES

**"Erro ao listar contatos Google"**
→ Certifique-se que tem `credentials.json` em `tmp/Google-Api/`

**"Nenhum contato com data encontrado"**
→ Seus contatos não têm datas no formato correto
→ Adicione no padrão: `DD/MM/AAAA` ou `DD/MM`

**"Socket não disponível"**
→ Bot não conectou ainda - aguarde "✅ Bot conectado"

**"Nenhuma mensagem foi enviada"**
→ Nenhum cliente vencia hoje (esperado!)
→ Teste com: `node teste_vencimentos.js`

═══════════════════════════════════════════════════════════════════════════════

## 📚 PRÓXIMAS LEITURAS

Se quer **entender melhor**:
1. Leia: `VENCIMENTOS_README.md`
2. Veja: `DIAGRAMA_FLUXO.md`
3. Execute: `node EXEMPLOS_USO.js`

Se tem **dúvidas**:
1. Procure em: `FAQ_VENCIMENTOS.md`
2. Tem 30+ perguntas respondidas

Se quer **customizar**:
1. Leia: `IMPLEMENTACAO_RESUMO.md`
2. Section "Configurações Principais"

═══════════════════════════════════════════════════════════════════════════════

## ⏱️ RESUMO DO TEMPO NECESSÁRIO

| Atividade | Tempo |
|-----------|-------|
| Ler este guia | 2 min |
| Testar com `teste_vencimentos.js` | 1 min |
| Iniciar bot | 1 min |
| **TOTAL** | **~5 min** |

**Pronto para usar em 5 minutos!** ⚡

═══════════════════════════════════════════════════════════════════════════════

## 🎯 O SISTEMA FUNCIONA?

Procure por estas mensagens no console:

```
✅ Bot conectado          ← Bot conectou ao WhatsApp
🔔 Monitor iniciado       ← Monitor de vencimentos ativo
```

Se vir ambas = Sucesso! ✓

═══════════════════════════════════════════════════════════════════════════════

## 🚀 AGORA VÁ!

```bash
# 1. Teste rápido
node teste_vencimentos.js

# 2. Inicie o bot
node index.js

# 3. Pronto! Sistema rodando 🎉
```

Sistema executará automaticamente às 08:00 de cada dia.
Nenhuma ação adicional necessária!

═══════════════════════════════════════════════════════════════════════════════

**Dúvidas?** Veja: `FAQ_VENCIMENTOS.md`
**Quer acompanhar?** Veja: `DIAGRAMA_FLUXO.md`
**Entender tudo?** Leia: `VENCIMENTOS_README.md`

Sucesso! 🎉
