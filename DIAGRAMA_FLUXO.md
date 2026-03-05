# 🔄 Diagrama de Fluxo - Sistema de Notificador de Vencimentos

## Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOT DISPARADOR HERLOCK                     │
│                      (WhatsApp com Baileys)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌───────▼────────┐
            │  DISPARADOR    │  │  MONITOR DE    │
            │  ORIGINAL      │  │  VENCIMENTOS   │
            │  (clientes     │  │  (novo!)       │
            │   vencidos)    │  │                │
            └────────────────┘  └───────┬────────┘
                                        │
                                        │ Executa
                                        │ 1x ao dia
                                        │ às 08:00
                                        │
                            ┌───────────▼──────────────┐
                            │ API GOOGLE CONTACTS      │
                            │ (Lista contatos)         │
                            └───────────┬──────────────┘
                                        │
                                        │
```

## Fluxo de Execução Detalhado

```
🚀 INICIALIZAÇÃO
═════════════════════════════════════════════════════════════════

    1. User executa: node index.js
                         │
                         └── Bot conecta ao WhatsApp
                              │
                              └── Aguarda QR Code
                                   │
                                   └── Scanneia com celular
                                        │
                                        └─► ✅ Bot Conectado!
                                             │
                                             ├─► Inicia DISPARADOR
                                             │   (envia msgs randômicas)
                                             │
                                             └─► Inicia MONITOR VENCIMENTOS
                                                 (verifica datas)


📅 EXECUÇÃO DIÁRIA (Todos os dias)
═════════════════════════════════════════════════════════════════

    ⏰ 08:00:00 ─────────► Monitor acorda
                          │
                          └─► ✓ É 08:00 hoje?
                              │
                              ├─ SIM ──► Carrega API Google
                              │          │
                              │          └─► Lista contatos
                              │              │
                              │              └─► Extrai datas (ano obrigatório)
                              │                  │
                              │                  ├─► João: 21/03/2026
                              │                  ├─► Maria: 15/11/2025   ← ignorado
                              │                  ├─► Pedro: 10/12/2026
                              │                  └─► ...
                              │
                              └─ NÃO ──► Aguarda 10 minutos
                                         │
                                         └─► Verifica novamente


🔍 VERIFICAÇÃO DE VENCIMENTO
═════════════════════════════════════════════════════════════════

    Para cada contato encontrado:
    │
    ├─► Extrai data do nome
    │   Exemplo: "🔍 21/03/2026 | DN - SP 5193"
    │         ↓ Parser
    │   Data: 21/03/2026
    │   Nome: DN
    │   Telefone: (extraído)
    │
    ├─► Compara: data contato == data hoje?
    │   │
    │   ├─► SIM ──────────────────────┐
    │   │                              │
    │   └─► NÃO ──►Pula próximo contato
    │
    └─► Já foi notificado hoje?
        │
        ├─► SIM ──► Pula (evita duplicata)
        │
        └─► NÃO ──► ENVIA MENSAGEM! 🎯


📤 ENVIO DE MENSAGEM
═════════════════════════════════════════════════════════════════

    Mensagem criada (aleatória entre 4 templates):
    │
    ├─► Templates possíveis:
    │   1. "🚨 AVISO DE VENCIMENTO 🚨"
    │   2. "⏰ ATENÇÃO: VENCIMENTO HOJE"
    │   3. "💎 ACESSO VENCENDO HOJE"
    │   4. "⚠️ ÚLTIMO DIA DE ACESSO"
    │
    ├─► Personaliza com nome do cliente
    │   "DN" ou "JOÃO SILVA" etc
    │
    ├─► Envia via Baileys/WhatsApp
    │   📱 Para: 55XXXXXXXXX@s.whatsapp.net
    │
    ├─► Marca como notificado
    │   💾 Salva em data/notificadas_hoje.json
    │
    └─► Aguarda 3-5 segundos antes do próximo


💾 RASTREAMENTO DIÁRIO
═════════════════════════════════════════════════════════════════

    data/notificadas_hoje.json:
    
    {
      "data": "2026-03-03",
      "clientes": {
        "55XXXXXXXXXXX@s.whatsapp.net": true,  ← Já notificado
        "55YYYYYYYYYYY@s.whatsapp.net": true
      }
    }

    ✅ Quando troca de dia: arquivo limpa automaticamente
    ✅ Evita enviar 2+ mensagens para mesmo cliente


📊 EXEMPLOS DE EXECUÇÃO
═════════════════════════════════════════════════════════════════

CENÁRIO 1: Nenhum vencimento hoje
────────────────────────────────────
    08:00:00 │ ⏰ Executando verificação diária...
             │ 📋 Verificando 45 contatos com vencimento...
             │ ✔️ Nenhum vencimento para hoje
             │
             └─► Aguarda até amanhã 08:00


CENÁRIO 2: 2 clientes vencendo hoje
────────────────────────────────────
    08:00:15 │ ⏰ Executando verificação diária...
             │ 📋 Verificando 45 contatos com vencimento...
             │ ✅ Aviso enviado para: DN (55986543210@s.whatsapp.net)
             │ ✅ Aviso enviado para: JOÃO (55988776655@s.whatsapp.net)
             │ 🔔 2 aviso(s) de vencimento enviado(s) hoje!
             │
             └─► Próxima execução: amanhã 08:00


CENÁRIO 3: Bot reiniciado 2x no mesmo dia
────────────────────────────────────────
    08:00 │ Bot inicia
          │ ✅ Aviso enviado para: DN
          │
    10:00 │ User reinicia bot
          │ ✅ Monitor inicia
          │ ℹ️ DN já foi notificado hoje (pula)
          │
          └─► Sem envio duplicado! ✓


🔄 INTEGRAÇÃO COM DISPARADOR ORIGINAL
═════════════════════════════════════════════════════════════════

    Ambos rodando em paralelo:

    ┌──────────────────────────────────────┐
    │  BOT DISPARADOR (Original)           │
    │  - Envia msgs aos clientes vencidos  │
    │  - 40 msgs/dia limite                │
    │  - Rodando 24/7                      │
    └──────────────────────────────────────┘
                        │
                        │ Coexistem
                        │ pacificamente
                        │
    ┌──────────────────────────────────────┐
    │  MONITOR VENCIMENTOS (Novo)          │
    │  - Envia avisos de vencimento        │
    │  - 1 msg/cliente/dia                 │
    │  - Executa 08:00                     │
    └──────────────────────────────────────┘


⚙️ CONFIGURAÇÕES AJUSTÁVEIS
═════════════════════════════════════════════════════════════════

    ┌─ HORÁRIO ──┬─ Arquivo: verificador_vencimentos.js
    │            ├─ Linha: ~245
    │            └─ Valor: if (horaAtual === 8) {
    │
    ├─ MENSAGENS ┬─ Arquivo: verificador_vencimentos.js
    │            ├─ Função: gerarMensagemVencimento()
    │            └─ Adicione/remova templates
    │
    └─ INTERVALO ┬─ Arquivo: verificador_vencimentos.js
                 ├─ Linha: ~250
                 └─ Valor: await delay(10 * 60 * 1000);


🧪 MODO TESTE
═════════════════════════════════════════════════════════════════

    $ node teste_vencimentos.js

    Resultado:
    ✓ Conecta à API Google
    ✓ Lista todos os contatos com data
    ✓ Mostra quais venceriam hoje
    ✓ Simula envio (não envia de verdade)
    ✓ Retorna diagnóstico completo

    Exemplo de output:
    📅 Data atual: 21/03/2026
    📋 CONTATOS COM DATAS:
       1. 🔍 21/03/2026 | DN - SP 5193  [🎯 VENCE HOJE]
       2. 🥇 15/11 - RODOLFO - PE 3754  [⏳ Futuro]
       ...


📈 PERFORMANCE & RECURSOS
═════════════════════════════════════════════════════════════════

    Execução 1x ao dia (08:00):
    ├─ CPU: ~2-5% por 30 segundos
    ├─ Memória: ~10-20 MB temporária
    ├─ Internet: Apenas para API Google
    └─ Roda em background (não bloqueia)

    Mensagens enviadas:
    ├─ Contagem contínua (no limite diário de 40)
    ├─ Delays padronizados (evita spam)
    └─ Respeitam limite do WhatsApp


🔐 PRIVACIDADE & SEGURANÇA
═════════════════════════════════════════════════════════════════

    Dados armazenados:
    ├─ credentials.json → Credenciais OAuth Google (local)
    ├─ token.json → Token de acesso (local)
    ├─ notificadas_hoje.json → Apenas JID do cliente
    └─ index.js, logs → Nomes sem dados sensíveis

    ✓ Tudo roda localmente
    ✓ Sem envio a servidores externos
    ✓ Sem armazenamento de histórico
    ✓ Sem coleta de dados pessoais além do necessário


🎓 ARQUIVOS DE DOCUMENTAÇÃO
═════════════════════════════════════════════════════════════════

    ├─ VENCIMENTOS_README.md
    │  └─ Guia completo (setup, uso, troubleshooting)
    │
    ├─ IMPLEMENTACAO_RESUMO.md
    │  └─ Resumo técnico (o que foi implementado)
    │
    ├─ FAQ_VENCIMENTOS.md
    │  └─ 30+ perguntas frequentes respondidas
    │
    ├─ EXEMPLOS_USO.js
    │  └─ Exemplos práticos executáveis
    │
    ├─ IMPLEMENTACAO_CHECKLIST.txt
    │  └─ Lista completa do que foi feito
    │
    └─ Este arquivo (DIAGRAMA_FLUXO.md)
       └─ Visualização do fluxo


✅ CONCLUSÃO
═════════════════════════════════════════════════════════════════

Sistema pronto para usar!

Apenas execute:
    $ node index.js

E deixe rodar. Às 08:00 de cada dia, o sistema
automaticamente verifica e notifica clientes que
venceram naquele dia.

Simples. Eficaz. Seguro. ✨
