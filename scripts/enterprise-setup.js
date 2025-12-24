#!/usr/bin/env node

/**
 * Enterprise Setup Script for LMA Bridge
 * Automated setup for production deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnterprise() {
  console.log('🏢 LMA Bridge Enterprise Setup');
  console.log('================================\n');

  // Collect configuration
  const config = {};

  console.log('📋 API Configuration:');
  config.GEMINI_API_KEY = await question('Enter your Gemini API key: ');
  config.API_TIMEOUT = await question('API timeout in ms (default: 30000): ') || '30000';
  config.API_RATE_LIMIT = await question('API rate limit per minute (default: 100): ') || '100';

  console.log('\n🔒 Security Configuration:');
  config.ENABLE_ENCRYPTION = await question('Enable encryption? (y/n, default: y): ') !== 'n' ? 'true' : 'false';
  config.SESSION_TIMEOUT = await question('Session timeout in ms (default: 1800000): ') || '1800000';
  config.MAX_FILE_SIZE = await question('Max file size in bytes (default: 52428800): ') || '52428800';

  console.log('\n📊 Compliance Configuration:');
  config.ENABLE_GDPR = await question('Enable GDPR compliance? (y/n, default: y): ') !== 'n' ? 'true' : 'false';
  config.ENABLE_SOX = await question('Enable SOX compliance? (y/n, default: y): ') !== 'n' ? 'true' : 'false';
  config.DATA_RETENTION_DAYS = await question('Data retention period in days (default: 2555): ') || '2555';

  console.log('\n🚀 Feature Configuration:');
  config.ENABLE_AI_ANALYSIS = await question('Enable AI analysis? (y/n, default: y): ') !== 'n' ? 'true' : 'false';
  config.ENABLE_ADVANCED_REPORTING = await question('Enable advanced reporting? (y/n, default: y): ') !== 'n' ? 'true' : 'false';
  config.ENABLE_MULTI_TENANT = await question('Enable multi-tenant support? (y/n, default: n): ') === 'y' ? 'true' : 'false';

  // Generate environment file
  const envContent = generateEnvFile(config);
  
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
  fs.writeFileSync(envFile, envContent);

  console.log(`\n✅ Configuration saved to ${envFile}`);

  // Generate Docker configuration if requested
  const useDocker = await question('\n🐳 Generate Docker configuration? (y/n): ');
  if (useDocker === 'y') {
    generateDockerConfig(config);
    console.log('✅ Docker configuration generated');
  }

  // Generate Nginx configuration if requested
  const useNginx = await question('\n🌐 Generate Nginx configuration? (y/n): ');
  if (useNginx === 'y') {
    const domain = await question('Enter your domain name: ');
    generateNginxConfig(domain);
    console.log('✅ Nginx configuration generated');
  }

  console.log('\n🎉 Enterprise setup complete!');
  console.log('\nNext steps:');
  console.log('1. Review the generated configuration files');
  console.log('2. Run: npm run deploy:build');
  console.log('3. Deploy using your preferred method');
  console.log('4. Monitor health at: /api/health');

  rl.close();
}

function generateEnvFile(config) {
  return `# LMA Bridge Enterprise Configuration
# Generated on ${new Date().toISOString()}

# API Configuration
GEMINI_API_KEY=${config.GEMINI_API_KEY}
API_TIMEOUT=${config.API_TIMEOUT}
API_RATE_LIMIT=${config.API_RATE_LIMIT}

# Security Configuration
ENABLE_AUDIT_LOGGING=true
ENABLE_ENCRYPTION=${config.ENABLE_ENCRYPTION}
SESSION_TIMEOUT=${config.SESSION_TIMEOUT}
MAX_FILE_SIZE=${config.MAX_FILE_SIZE}
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Performance Configuration
CACHE_TIMEOUT=600000
MAX_CONCURRENT_REQUESTS=50
ENABLE_COMPRESSION=true
ENABLE_CDN=true

# Compliance Configuration
ENABLE_GDPR=${config.ENABLE_GDPR}
ENABLE_SOX=${config.ENABLE_SOX}
DATA_RETENTION_DAYS=${config.DATA_RETENTION_DAYS}
AUDIT_LOG_RETENTION_DAYS=${config.DATA_RETENTION_DAYS}

# Feature Flags
ENABLE_AI_ANALYSIS=${config.ENABLE_AI_ANALYSIS}
ENABLE_REALTIME_UPDATES=true
ENABLE_ADVANCED_REPORTING=${config.ENABLE_ADVANCED_REPORTING}
ENABLE_MULTI_TENANT=${config.ENABLE_MULTI_TENANT}

# Application Configuration
NEXT_PUBLIC_APP_NAME=LMA Bridge
NODE_ENV=production
`;
}

function generateDockerConfig(config) {
  const dockerComposeOverride = `# Docker Compose Override for Enterprise
version: '3.8'

services:
  lma-bridge:
    environment:
      - GEMINI_API_KEY=${config.GEMINI_API_KEY}
      - ENABLE_ENCRYPTION=${config.ENABLE_ENCRYPTION}
      - ENABLE_ADVANCED_REPORTING=${config.ENABLE_ADVANCED_REPORTING}
      - ENABLE_MULTI_TENANT=${config.ENABLE_MULTI_TENANT}
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
`;

  fs.writeFileSync('docker-compose.override.yml', dockerComposeOverride);
}

function generateNginxConfig(domain) {
  const nginxConfig = `# Nginx Configuration for LMA Bridge Enterprise
events {
    worker_connections 1024;
}

http {
    upstream lma_bridge {
        server lma-bridge:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    server {
        listen 80;
        server_name ${domain};
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${domain};

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        location / {
            proxy_pass http://lma_bridge;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/health {
            proxy_pass http://lma_bridge;
            access_log off;
        }
    }
}
`;

  fs.writeFileSync('nginx.conf', nginxConfig);
}

// Run setup
setupEnterprise().catch(console.error);