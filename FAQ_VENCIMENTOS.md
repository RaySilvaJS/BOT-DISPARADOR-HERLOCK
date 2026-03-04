# ❓ Perguntas Frequentes - Sistema de Notificação de Vencimentos

## Instalação & Setup

### P1: O sistema vem instalado por padrão?
**R:** Sim! O sistema já está completamente integrado. Você não precisa fazer nada além de iniciar o bot normalmente:
```bash
node index.js
```

### P2: Preciso instalar alguma dependência nova?
**R:** Não. O sistema usa apenas as dependências que já existem:
- `googleapis` - para acessar API Google Contacts
- `readline` - para autenticação

Se não tiver instalado, execute:
```bash
npm install googleapis readline
```

### P3: Como funciona a autenticação com Google?
**R:** 
1. Primeira vez: O sistema pede um código de autorização
2. O token é salvo em `tmp/Google-Api/token.json`
3. Próximas vezes: Usa o token automaticamente
4. O sistema roda localmente - nenhum dado vai para servidor externo

## Funcionamento

### P4: Em que hora o sistema executa?
**R:** Às **08:00 da manhã** todos os dias.

Para mudar, edite `verificador_vencimentos.js` na linha ~245:
```javascript
if (horaAtual === 8) {  // ← mude o número 8 para outra hora (0-23)
```

### P5: Como posso testar agora sem esperar 08:00?
**R:** Execute:
```bash
node teste_vencimentos.js
```

Isso simula a verificação sem enviar mensagens de verdade.

### P6: O sistema envia múltiplas mensagens?
**R:** Não! Apenas **1 mensagem por cliente por dia**.

Se você reiniciar o bot antes de 08:01, ele não envia novamente (thanks ao arquivo `notificadas_hoje.json`).

### P7: Como funciona se a data não tem ano?
**R:** Se você colocar apenas `21/03` (sem ano), o sistema avisa todo 21 de março de cada ano.

Exemplo:
```
🥇 15/11 - RODOLFO
# Avisa todo 15 de novembro, independente do ano
```

### P8: E se a data passar?
**R:** Contatos já vencidos NÃO recebem mensagens.

Se quiser avisar antes, você pode:
- Configurar aviso com 3 dias de antecedência (próxima feature)
- Modificar a função `isVencimentoHoje()` para flexibilizar

## Mensagens

### P9: Como mudar as mensagens enviadas?
**R:** Edite `verificador_vencimentos.js` na função `gerarMensagemVencimento()`:

```javascript
function gerarMensagemVencimento(nomeCliente) {
  const mensagens = [
    `Sua mensagem 1 aqui...`,
    `Sua mensagem 2 aqui...`,
    `Sua mensagem 3 aqui...`,
  ];
  return mensagens[Math.floor(Math.random() * mensagens.length)];
}
```

### P10: Posso personalizar a mensagem com dados do cliente?
**R:** Sim! A informação disponível é o nome do cliente:

```javascript
function gerarMensagemVencimento(nomeCliente) {
  return `🚨 Olá ${nomeCliente}! Seu acesso vence HOJE! Responda "quero" para continuar.`;
}
```

Se quiser mais dados, você precisa modificar a função para acessar a API Google.

### P11: As mensagens saem com formatação correta?
**R:** Sim! O sistema usa formatação WhatsApp:
- `*texto*` = **negrito**
- `_texto_` = _itálico_
- Quebras de linha funcionam normalmente
- Emojis funcionam

Exemplo:
```javascript
`📌 *VENCIMENTO HOJE*\n\n👤 ${nomeCliente}\n\nResponda *"quero"*`
```

## Contatos & Datas

### P12: Como adicionar contatos com data?
**R:** Na API Google (contacts.google.com):

1. Novo contato
2. **Nome:** `🔍 21/03/2026 | JOÃO SILVA - SP 1234`
3. Salve

O sistema extrai a data do nome automaticamente.

### P13: Qual formato de data devo usar?
**R:** O formato é flexível:

✅ **Aceitos:**
```
03/04/2026      (DD/MM/AAAA)
21/03           (DD/MM)
21/03/2026      (DD/MM/AAAA)
🔍 21/03        (com emoji)
d - NOME        (com separador)
d | NOME        (ou pipe)
```

❌ **Não aceitos:**
```
2026-03-21      (ISO format)
21-03-2026      (com hífen)
2026/04/03      (ano primeiro)
```

### P14: Posso usar vários contatos mesmo dia?
**R:** Sim! Todos que vencerem no mesmo dia receberão aviso:

```
🔍 21/03/2026 | DN
🥇 21/03/2026 - MARIA
💎 21/03/2026 | JOÃO

# Resultado: 3 mensagens enviadas em 21/03/2026
```

### P15: O contato precisa ter número de telefone?
**R:** Sim! O sistema precisa do número para enviar no WhatsApp.

Se não tiver, o contato é pulado automaticamente (com log de aviso).

## Troubleshooting

### P16: Erro "Socket não disponível"
**Problema:** Bot não conectou ainda

**Solução:**
- Aguarde "✅ Bot conectado" aparecer no console
- Escaneie o QR Code se pedido
- Verifique conexão de internet

### P17: Erro "Erro ao listar contatos Google"
**Problema:** Autenticação com API Google falhou

**Solução:**
1. Verifique se `credentials.json` existe em `tmp/Google-Api/`
2. Se não existe, configure manualmente:
   ```bash
   node tmp/Google-Api/index.js
   ```
3. Siga as instruções para autorizar
4. Token será salvo automaticamente

### P18: "Nenhum contato com data encontrado"
**Problema:** Seus contatos não têm datas no formato correto

**Solução:**
1. Verifique nomes dos contatos na API Google
2. Use o formato: `DD/MM` ou `DD/MM/AAAA`
3. Execute:
   ```bash
   node teste_vencimentos.js
   ```
4. Veja quais contatos foram reconhecidos

### P19: Nenhuma mensagem foi enviada
**Problema:** Nenhum contato vence hoje

**Esperado!** Apenas contatos com vencimento na data atual recebem aviso.

Para verificar:
```bash
node teste_vencimentos.js
```

### P20: "Arquivo notificadas_hoje.json não existe"
**Problema:** Arquivo foi deletado

**Solução:** Será criado automaticamente na próxima execução

Se quiser criar manualmente:
```json
{
  "data": "2026-03-03",
  "clientes": {}
}
```

## Performance & Limitações

### P21: O sistema afeta a performance do bot?
**R:** Não! 
- Executa 1x ao dia (não é repetitivo)
- Roda em background (não bloqueia)
- Não interfere com outras funções

### P22: Quantas mensagens posso enviar?
**R:** O sistema respeita o limite diário existente:
- Limite: 40 mensagens/dia
- Verificação: 08:00
- Avisos de vencimento contam nesse total

### P23: Pode enviar em horários específicos?
**R:** Atualmente executa 1x ao dia (08:00). Para mudanças:

Edite `verificador_vencimentos.js`:
```javascript
// Para executar a cada hora:
if (novaHora !== ultimaHoraVerificada) {
  ultimaHoraVerificada = novaHora;
  await verificarVencimentos(sock);
}
```

### P24: O sistema usa muita memória?
**R:** Não. Apenas:
- Lista contatos (1x ao dia)
- Verifica datas (rápido)
- Envia mensagens
- Libera memória depois

## Privacidade & Segurança

### P25: Meus dados estão seguros?
**R:** Sim!
- ✅ Tudo roda localmente
- ✅ Sem envio de dados externo
- ✅ Credenciais salvas apenas localmente
- ✅ Tokens armazenados no seu computador

### P26: Posso ver os logs?
**R:** Sim! No console onde o bot roda:

```
⏰ Executando verificação diária de vencimentos...
📋 Verificando 45 contatos com vencimento...
✅ Aviso enviado para: DN (551234567890@s.whatsapp.net)
🔔 1 aviso(s) de vencimento enviado(s) hoje!
```

### P27: Como deletar histórico?
**R:** Delete simplesmente:

```bash
# Limpar histórico de hoje
rm data/notificadas_hoje.json

# ou mude a data no arquivo:
# Abra data/notificadas_hoje.json e mude "data"
```

## Integração

### P28: Como o sistema se integra com o bot atual?
**R:** Automaticamente! Quando o bot conecta:

1. Inicia disparador (mensagens randômicas para clientes vencidos)
2. **Inicia monitor de vencimentos** (novo)
3. Ambos rodam em paralelo
4. Não há conflito

### P29: Posso desativar o sistema temporariamente?
**R:** Sim:

**Opção 1:** Comentar uma linha em `index.js`:
```javascript
// if (!monitorVencimentosRodando) {
//   monitorVencimentosRodando = true;
//   iniciarMonitorVencimentos(sock);
// }
```

**Opção 2:** Renomear o arquivo:
```bash
mv verificador_vencimentos.js verificador_vencimentos.js.backup
```

### P30: Como adicionar novas features?
**R:** O sistema é modular! Para adicionar:

1. Edite `verificador_vencimentos.js`
2. Modifique funções específicas:
   - `isVencimentoHoje()` - lógica de comparação
   - `gerarMensagemVencimento()` - templates
   - `iniciarMonitorVencimentos()` - timing

Exemplos de expansão:
- Aviso antecipado (3 dias antes)
- Contatos com status diferente
- Notificações por email também
- Dashboard de estatísticas

---

## 🆘 Ainda com dúvida?

1. **Leia a documentação:**
   ```bash
   cat VENCIMENTOS_README.md
   ```

2. **Veja exemplos práticos:**
   ```bash
   node EXEMPLOS_USO.js
   ```

3. **Teste o sistema:**
   ```bash
   node teste_vencimentos.js
   ```

4. **Verifique logs do console** quando o bot rodae

---

**Última atualização:** 03/03/2026
**Versão:** 1.0.0
**Status:** Pronto para produção ✅
