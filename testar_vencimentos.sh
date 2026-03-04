#!/bin/bash

# SCRIPT DE TESTE RÁPIDO - SISTEMA DE VENCIMENTOS

echo "🚀 TESTE RÁPIDO DO SISTEMA DE VENCIMENTOS"
echo "=========================================="
echo ""
echo "📅 Data/Hora atual: $(date '+%d/%m/%Y %H:%M:%S')"
echo ""

# Verifica se os arquivos necessários existem
echo "🔍 Verificando arquivos necessários..."

if [ ! -f "tmp/Google-Api/credentials.json" ]; then
    echo "❌ ERRO: Arquivo 'tmp/Google-Api/credentials.json' não encontrado"
    echo ""
    echo "📝 Para usar o sistema de vencimentos, você precisa:"
    echo "   1. Ir em: https://console.cloud.google.com"
    echo "   2. Criar credenciais OAuth 2.0"
    echo "   3. Salvar como: tmp/Google-Api/credentials.json"
    echo ""
    exit 1
fi

if [ ! -f "tmp/Google-Api/token.json" ]; then
    echo "⚠️  Arquivo token.json não encontrado"
    echo "   O sistema tentará obter um novo token na primeira execução"
    echo ""
fi

if [ ! -f "verificador_vencimentos.js" ]; then
    echo "❌ ERRO: Arquivo 'verificador_vencimentos.js' não encontrado"
    exit 1
fi

echo "✅ Todos os arquivos necessários estão presentes"
echo ""

# Oferece opções
echo "O que você deseja fazer?"
echo ""
echo "1️⃣  Testar o sistema de vencimentos AGORA (sem esperar 08:00)"
echo "2️⃣  Ver horaçã de próxima execução automática"
echo "3️⃣  Ver status dos contatos com vencimento"
echo ""

read -p "Digite sua escolha (1, 2 ou 3): " choice

case $choice in
  1)
    echo ""
    echo "🧪 Executando teste..."
    echo ""
    node teste_vencimentos.js
    ;;
  2)
    echo ""
    current_hour=$(date '+%H')
    if [ "$current_hour" -lt 8 ]; then
      minutes_left=$((8 - current_hour))
      minutes_left=$((minutes_left * 60))
      echo "⏰ Próxima execução: às 08:00 da manhã (faltam ~$minutes_left minutos)"
    else
      echo "⏰ Próxima execução: amanhã às 08:00 da manhã"
    fi
    echo ""
    ;;
  3)
    echo ""
    echo "📋 Liste de contatos com vencimento:"
    node teste_vencimentos.js | grep "VENCE HOJE" || echo "Nenhum vencimento hoje"
    echo ""
    ;;
  *)
    echo "❌ Opção inválida"
    exit 1
    ;;
esac

echo "✅ Pronto!"
echo ""
echo "📖 Para mais informações, leia: VENCIMENTOS_README.md"
