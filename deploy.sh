#!/bin/bash

# GrowPromise 간단 배포 스크립트

set -e

PROJECT_DIR="growpromise-project"
REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"

echo "🚀 Starting GrowPromise deployment..."

# 1. 프로젝트 디렉토리 설정
echo "📁 Setting up project directory..."
cd ~
if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    git clone $REPO_URL .
else
    cd $PROJECT_DIR
    git pull origin main
fi

# 2. 환경 변수 파일 생성 (최초 1회)
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment file..."
    cp .env.example .env
    echo "Please edit .env file with your actual values"
    echo "Especially: POSTGRES_PASSWORD, JWT_SECRET"
    exit 1
fi

# 3. Docker 네트워크 생성
echo "🌐 Creating Docker network..."
docker network create growpromise-network 2>/dev/null || echo "Network already exists"

# 4. 컨테이너 재시작
echo "🔄 Restarting containers..."
docker-compose down --remove-orphans
docker-compose up -d --build

# 5. 데이터베이스 마이그레이션
echo "🗄️ Running migrations..."
sleep 15
docker-compose exec -T api-server npx prisma migrate deploy

# 6. nginx 설정 업데이트
echo "🔧 Updating nginx..."
cd ~/nginx-proxy

# growpromise.conf 생성
cat > conf.d/growpromise.conf << 'EOF'
server {
    listen 3030;
    server_name _;
    
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    location / {
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        proxy_pass http://api-server-growpromise:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }
}
EOF

# 7. nginx-proxy에 growpromise 네트워크 추가
if ! docker network ls | grep -q growpromise-network; then
    echo "Adding growpromise network to nginx-proxy..."
    docker network connect growpromise-network nginx-proxy
fi

docker-compose restart nginx-proxy

# 8. 헬스체크
echo "🏥 Health check..."
cd ~/$PROJECT_DIR
sleep 30

if curl -f http://localhost:3030/health; then
    echo "✅ GrowPromise is running successfully!"
    echo "📱 API URL: http://$(curl -s http://checkip.amazonaws.com):3030"
else
    echo "❌ Health check failed!"
    docker-compose logs api-server
    exit 1
fi

echo "🎉 Deployment completed!"