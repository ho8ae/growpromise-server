#!/bin/bash

# 도메인과 이메일 설정
domains=(growpromise.com www.growpromise.com)
email="xogh22422@naver.com"  # 실제 이메일로 변경

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")"

# 디렉토리 확인/생성
mkdir -p ./nginx/conf.d ./certbot/conf ./certbot/www

# 임시 nginx 설정 생성 (SSL 인증서 발급용)
cat > ./nginx/conf.d/growpromise.conf << 'EOT'
server {
    listen 80;
    server_name growpromise.com www.growpromise.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "Hello from GrowPromise!";
        add_header Content-Type text/plain;
    }
}
EOT

# docker-compose-ssl.yml 생성
cat > docker-compose-ssl.yml << 'EOT'
version: '3.8'

services:
  nginx-ssl:
    image: nginx:alpine
    container_name: nginx-ssl-growpromise
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    networks:
      - growpromise-network
  
  certbot:
    image: certbot/certbot
    container_name: certbot-growpromise
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot

networks:
  growpromise-network:
    external: true
EOT

# 기존 컨테이너 정리 (있는 경우)
docker-compose -f docker-compose-ssl.yml down

# Docker Compose 실행
docker-compose -f docker-compose-ssl.yml up -d

# 잠시 대기
echo "Waiting for nginx to start..."
sleep 10

# DNS 전파 확인
echo "Testing DNS resolution..."
nslookup growpromise.com
echo ""
echo "Please check if you can access http://growpromise.com in your browser."
echo "You should see 'Hello from GrowPromise!' message."
echo "Wait for DNS propagation if needed (this can take up to 24-48 hours, but usually much less)."
read -p "Press Enter to continue with SSL certificate installation..." dummy

# 인증서 발급
docker-compose -f docker-compose-ssl.yml run --rm certbot certonly --webroot -w /var/www/certbot \
  ${domains[@]/#/-d } \
  --email $email \
  --agree-tos \
  --no-eff-email

# 인증서 발급 성공 확인
if [ ! -d "./certbot/conf/live/growpromise.co.kr" ]; then
  echo "Certificate issuance failed. Check logs and DNS settings."
  exit 1
fi

echo "SSL certificate successfully issued!"
echo "Now updating nginx configuration for HTTPS..."

# 최종 HTTPS 설정 생성
cat > ./nginx/conf.d/growpromise.conf << 'EOT'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name growpromise.com www.growpromise.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl;
    server_name growpromise.com www.growpromise.com;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/growpromise.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/growpromise.com/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    # API 프록시 설정
    location /api {
        proxy_pass http://api-server-growpromise:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 설정
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 기본 페이지
    location / {
        return 200 "HTTPS is working on GrowPromise!";
        add_header Content-Type text/plain;
    }
}
EOT

# Nginx 재시작
docker-compose -f docker-compose-ssl.yml restart nginx-ssl

echo "✅ SSL setup completed!"
echo "🌐 Your API is now available at: https://growpromise.com/api"
echo "📚 API docs: https://growpromise.com/api/api-docs"
echo ""
echo "Don't forget to:"
echo "1. Update your mobile app's API baseURL to: https://growpromise.com/api"
echo "2. Remove 'usesCleartextTraffic: true' from app.json"
echo "3. Set up automatic certificate renewal"