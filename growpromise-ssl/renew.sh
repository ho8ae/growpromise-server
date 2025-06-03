#!/bin/bash
echo "🔄 Renewing SSL certificates..."
cd ~/growpromise-ssl
docker-compose -f docker-compose-ssl.yml run --rm certbot renew
docker-compose -f docker-compose-ssl.yml restart nginx-ssl
echo "✅ Certificate renewal completed!"