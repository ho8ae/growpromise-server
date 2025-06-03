#!/bin/bash

# 도메인과 이메일 설정
domains=(growpromise.com www.growpromise.com)
email="xogh22422@naver.com"

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")"

# 디렉토리 확인/생성
mkdir -p ./certbot/conf ./certbot/www ./nginx/conf.d

# 임시 nginx 설정 생성
cat > ./nginx/conf.d/default.conf << 'EOT'
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

# docker-compose.yml 생성
cat > docker-compose.yml << 'EOT'
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: nginx-growpromise
    restart: always
    ports:
      - "80:80"   # Let's Encrypt는 포트 80이 필요
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
  
  certbot:
    image: certbot/certbot
    container_name: certbot-growpromise
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
EOT

# 기존 컨테이너 정리 (있는 경우)
docker-compose down

# Docker Compose 실행
docker-compose up -d

# 잠시 대기
echo "Waiting for nginx to start..."
sleep 5

# 외부 접속 테스트 가능한지 안내
echo "Now, please check if you can access http://growpromise.com in your browser."
echo "You should see 'Hello from GrowPromise!' message."
echo "Wait for DNS propagation if needed (this can take up to 24-48 hours, but usually much less)."
read -p "Press Enter to continue with SSL certificate installation..." dummy

# 인증서 발급
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot \
  ${domains[@]/#/-d } \
  --email $email \
  --agree-tos \
  --no-eff-email

# 인증서 발급 성공 확인
if [ ! -d "./certbot/conf/live/growpromise.com" ]; then
  echo "Certificate issuance failed. Check logs and DNS settings."
  exit 1
fi

# HTTPS 설정 생성
cat > ./nginx/conf.d/default.conf << 'EOT'
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

server {
    listen 443 ssl;
    server_name growpromise.com www.growpromise.com;

    ssl_certificate /etc/letsencrypt/live/growpromise.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/growpromise.com/privkey.pem;
    
    # SSL 파라미터 추가
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    # 기본 응답
    location / {
        return 200 "HTTPS is working on growpromise.com!";
        add_header Content-Type text/plain;
    }
}
EOT

# Nginx 재시작
docker-compose restart nginx

echo "SSL setup completed! Now you can configure your actual services."
echo ""
echo "Next steps:"
echo "1. Certificate is ready at ./certbot/conf/live/growpromise.com/"
echo "2. Add growpromise volume to main nginx-proxy"
echo "3. Add growpromise.conf to main nginx-proxy/conf.d/"
echo "4. Stop this temporary nginx: docker-compose down"