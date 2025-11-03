#!/bin/bash

# =============================================
# DEPLOY SCRIPT - NOLA Analytics
# =============================================

# Configurações
DOMAIN="seudominio.com"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================
# INÍCIO DO SCRIPT
# =============================================

log "🚀 Iniciando deploy do NOLA Analytics..."
log "Domínio: $DOMAIN"
log "Docker Compose: $DOCKER_COMPOSE_FILE"

# Verificar se o docker-compose existe
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    error "Arquivo $DOCKER_COMPOSE_FILE não encontrado!"
    exit 1
fi

# 1. Parar containers existentes
log "🛑 Parando containers existentes..."
docker-compose -f $DOCKER_COMPOSE_FILE down

# 2. Verificar e criar certificados SSL se necessário
if [ ! -d "ssl" ]; then
    warning "Pasta ssl não encontrada. Criando certificados auto-assinados..."
    mkdir -p ssl
    
    # Gerar certificado auto-assinado
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/$DOMAIN.key \
        -out ssl/$DOMAIN.crt \
        -subj "/C=BR/ST=SaoPaulo/L=SaoPaulo/O=NOLA/CN=$DOMAIN"
    
    success "Certificados SSL auto-assinados criados em ssl/"
else
    log "✅ Pasta ssl encontrada"
fi

# 3. Build das imagens
log "🔨 Build das imagens Docker..."
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache

if [ $? -ne 0 ]; then
    error "Falha no build das imagens!"
    exit 1
fi

# 4. Subir serviços
log "⬆️ Subindo serviços..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

if [ $? -ne 0 ]; then
    error "Falha ao subir serviços!"
    exit 1
fi

# 5. Aguardar serviços inicializarem
log "⏳ Aguardando inicialização dos serviços..."
sleep 30

# 6. Verificar status dos containers
log "🔍 Verificando status dos containers..."
docker-compose -f $DOCKER_COMPOSE_FILE ps

# 7. Verificar saúde dos serviços
log "🏥 Verificando saúde dos serviços..."

# Backend
log "Testando backend..."
if curl -f http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    success "Backend respondendo"
else
    warning "Backend não respondeu, mas pode ser normal (só acessível via nginx)"
fi

# Frontend via nginx
log "Testando frontend..."
if curl -f http://localhost > /dev/null 2>&1; then
    success "Frontend respondendo"
else
    error "Frontend não respondeu!"
fi

# 8. Verificar logs recentes
log "📋 Últimos logs dos serviços:"
docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=20

# 9. Informações finais
echo ""
success "✅ Deploy concluído com sucesso!"
echo ""
echo "📊 Serviços disponíveis:"
echo "   • Frontend: https://$DOMAIN"
echo "   • Backend API: https://$DOMAIN/api/v1/"
echo "   • Health Check: https://$DOMAIN/health"
echo ""
echo "🔧 Comandos úteis:"
echo "   • Ver logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "   • Parar serviços: docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "   • Reiniciar: docker-compose -f $DOCKER_COMPOSE_FILE restart"
echo "   • Status: docker-compose -f $DOCKER_COMPOSE_FILE ps"
echo ""
warning "⚠️  Lembre-se de:"
echo "   • Configurar DNS apontando para IP da VPS"
echo "   • Substituir certificados auto-assinados por Let's Encrypt em produção"
echo "   • Configurar backup regular do banco de dados"

# 10. Teste final
log "🎯 Teste final de acesso..."
if curl -f -k https://localhost > /dev/null 2>&1; then
    success "✅ Sistema totalmente operacional!"
else
    warning "⚠️  Sistema pode precisar de ajustes"
fi