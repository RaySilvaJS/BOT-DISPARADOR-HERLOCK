# 📅 Sistema de Notificação de Vencimentos

## 📖 Descrição

Sistema automático que monitora os contatos salvos na **API do Google Contacts** e envia avisos de vencimento via WhatsApp quando a data de vencimento do cliente chegar.

## 🎯 Como Funciona

### 1️⃣ **Coleta de Dados**
- O sistema usa a API do Google para listar todos os contatos
- Extrai automaticamente as datas de vencimento dos nomes dos contatos
- Suporta diversos formatos de data nos contatos

### 2️⃣ **Monitoramento**
- Executa **automaticamente às 08:00 da manhã** todos os dias
- Verifica quais contatos têm vencimento na data atual
- Envia **apenas 1 mensagem por cliente por dia** (controle de envio)

### 3️⃣ **Notificação**
- Envia mensagem de aviso personalizada via WhatsApp
- Mensagens variadas e contextualizadas para não parecer spam
- Inclui nome do cliente na mensagem

## 📝 Formato de Contatos Suportado

O sistema reconhece diversos formatos de datas nos nomes de contatos da API Google:

```
🥇 03/04/2026 - WAGNER LOPES - PA 6806
🥇15/11 - RODOLFO - PE 3754
🔍 21/03/2026 | DN - SP 5193
💎 23/01/2026 | MARCOS NOBRE | BA 1968
⭐ 15/06/2026 - CLIENTE X
```

### Padrões de Data Aceitos:
- ✅ `DD/MM/AAAA` (com ano)
- ✅ `DD/MM` (sem ano - válido todos os anos)
- ✅ Opcional: emoji no início
- ✅ Opcional: nome do cliente depois da data
- ✅ Separadores: `-` ou `|`

## 🚀 Como Usar

### Descrição de Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `verificador_vencimentos.js` | Engine principal de verificação e envio de avisos |
| `teste_vencimentos.js` | Arquivo para testar o sistema manualmente |
| `data/notificadas_hoje.json` | Rastreamento de notificações enviadas hoje |

### Instalação & Setup

1. **O sistema já está integrado ao `index.js` principal**
   - Inicia automaticamente quando o bot conecta não precisa fazer nada!

2. **Certifique-se que tem as credenciais do Google configuradas:**
   ```
   tmp/Google-Api/
   ├── credentials.json   (arquivo de credenciais OAuth)
   └── token.json        (token de autenticação)
   ```

### Testando o Sistema

**Para testar sem esperar pelas 8:00 da manhã:**

```bash
node teste_vencimentos.js
```

Este comando:
- ✅ Conecta à API do Google
- ✅ Lista todos os contatos com datas
- ✅ Mostra quais venceriam hoje
- ✅ Simula o envio (não envia de verdade)

**Exemplo de saída:**

```
📅 Data atual: 21/03/2026
🕐 Hora: 10:30:45

✅ Encontrados 45 contatos com data

📋 CONTATOS COM DATAS:
────────────────────────────────────
1. 🔍 21/03/2026 | DN - SP 5193
   Data: 21/3/2026  🎯 VENCE HOJE

2. 🥇 15/11 - RODOLFO - PE 3754
   Data: 15/11  ⏳ Futuro
...
```

### Funcionamento Automático

Quando o bot está rodando:

1. **Às 08:00 da manhã** → Sistema verifica vencimentos
2. **Para cada cliente com vencimento hoje:**
   - Envia 1 mensagem de aviso
   - Marca como notificado (não envia novamente naquele dia)
3. **Logs no console:**
   ```
   ⏰ Executando verificação diária de vencimentos...
   📋 Verificando 45 contatos com vencimento...
   ✅ Aviso enviado para: DN (551234567890@s.whatsapp.net)
   🔔 1 aviso(s) de vencimento enviado(s) hoje!
   ```

## 📤 Mensagens Enviadas

O sistema alterna entre 4 templates de mensagens (escolhe aleatoriamente):

```
🚨 AVISO DE VENCIMENTO 🚨

📌 [NOME_CLIENTE]

Seu acesso vence HOJE!

Responda "quero" para renovar.

🕵🏼 ARTHUR HERLOCK
```

```
⏰ ATENÇÃO: VENCIMENTO HOJE ⏰

👤 [NOME_CLIENTE]

Sua assinatura vence em poucas horas.

Mande "quero" para continuar.

🕵🏼 ARTHUR HERLOCK
```

(+ 2 variações mais)

## ⚙️ Configurações

### Alterar Horário de Execução

Abra `verificador_vencimentos.js` e procure por:

```javascript
if (horaAtual === 8) {  // ← Mude 8 para a hora desejada (0-23)
```

### Alterar Mensagens

Edite a função `gerarMensagemVencimento()` em `verificador_vencimentos.js`:

```javascript
function gerarMensagemVencimento(nomeCliente) {
  const mensagens = [
    `🚨 *AVISO DE VENCIMENTO* 🚨\n\n...`, // Mensagem 1
    `⏰ *ATENÇÃO: VENCIMENTO HOJE* ⏰\n\n...`, // Mensagem 2
    // Adicione mais aqui!
  ];
  // ...
}
```

### Alterar Intervalo de Verificação

Procure por:

```javascript
// Verifica a cada 10 minutos
await delay(10 * 60 * 1000);  // ← Mude este valor
```

## 📊 Rastreamento

O arquivo `data/notificadas_hoje.json` armazena:

```json
{
  "data": "2026-03-03",
  "clientes": {
    "551234567890@s.whatsapp.net": true,
    "559876543210@s.whatsapp.net": true
  }
}
```

- **Limpeza automática**: A cada dia novo, o sistema limpa o registro
- **Evita duplicatas**: Não envia 2 mensagens para o mesmo cliente no mesmo dia

## 🐛 Troubleshooting

### "Erro ao listar contatos Google"

**Problema:** API do Google não conecta

**Solução:**
1. Verifique `credentials.json` em `tmp/Google-Api/`
2. Se não existe, siga o setup da API Google:
   ```bash
   node tmp/Google-Api/index.js
   ```
3. Autorize o acesso na URL que aparecer

### "Nenhum contato com data encontrado"

**Problema:** Nenhum contato tem data no formato esperado

**Solução:**
1. Abra `teste_vencimentos.js`:
   ```bash
   node teste_vencimentos.js
   ```
2. Verifique se seus contatos estão no formato correto
3. Adicione datas aos nomes dos contatos

### "Socket não disponível"

**Problema:** Bot não conectiu ainda

**Solução:**
- Aguarde o bot conectar ao WhatsApp
- Procure por "✅ Bot conectado" no console

## 🔐 Privacidade & Segurança

- ✅ Tokens da Google API são salvos localmente
- ✅ Nada é enviado para servidor externo
- ✅ Logs contêm apenas números de telefone (sem dados sensíveis)
- ✅ Arquivo de rastreamento é apenas controle local

## 📈 Futuros Aprimoramentos

Sugestões para expandir o sistema:

- [ ] Aviso com 3 dias de antecedência
- [ ] Aviso com 1 hora de antecedência (se combinado com hora específica)
- [ ] Dashboard com estatísticas de vencimentos
- [ ] Integração com banco de dados
- [ ] Notificações por email também
- [ ] Renovação automática de clientes

## 📞 Suporte

Se tiver problemas:

1. Verifique os logsdo console
2. Execute `node teste_vencimentos.js` para diagnóstico
3. Verifique se a API do Google está autenticada
4. Verifique se os contatos têm datas no formato correto

---

**Sistema desenvolvido com ❤️ para automação de avisos de vencimento**
