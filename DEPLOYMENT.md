# MSP Diesel Field Sales Route App - VM Deployment Guide

Complete guide for deploying this application on a Linux VM with PostgreSQL, Nginx, and PM2.

---

## 📋 Prerequisites

### Server Requirements

- **Operating System**: Ubuntu 22.04 LTS or newer (or equivalent Linux distribution)
- **CPU**: 2 vCPUs minimum (recommended: 4 vCPUs for production)
- **RAM**: 4 GB minimum (recommended: 8 GB for production)
- **Storage**: 20 GB minimum (SSD recommended)
- **Network**: Static IP address or domain name
- **Firewall**: Ports 80 (HTTP) and 443 (HTTPS) open

### Required Software

- **Node.js**: Version 20.x LTS
- **PostgreSQL**: Version 14 or newer
- **Nginx**: Latest stable version
- **PM2**: Process manager for Node.js
- **Certbot**: For SSL/TLS certificates (Let's Encrypt)

### External Services

- **HubSpot Private App**: API key with company read permissions
- **Mapbox Account**: API access token with geocoding/directions access
- **Domain Name**: (Optional) For SSL and custom URL

---

## 🚀 Step-by-Step Deployment

### Step 1: Server Setup

#### 1.1 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

#### 1.2 Install Node.js 20.x

```bash
# Install Node.js from NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

#### 1.3 Install PostgreSQL

```bash
# Install PostgreSQL 14+
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

#### 1.4 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
```

#### 1.5 Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

### Step 2: Database Setup

#### 2.1 Create PostgreSQL Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE DATABASE msp_diesel_routes;
CREATE USER msp_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE msp_diesel_routes TO msp_user;

# Grant schema permissions (PostgreSQL 15+)
\c msp_diesel_routes
GRANT ALL ON SCHEMA public TO msp_user;

# Exit PostgreSQL
\q
```

#### 2.2 Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Change listen_addresses (uncomment and modify):
listen_addresses = 'localhost'  # Or '*' for all interfaces

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line for local connections:
host    msp_diesel_routes    msp_user    127.0.0.1/32    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 2.3 Test Database Connection

```bash
psql -h localhost -U msp_user -d msp_diesel_routes -W
# Enter password when prompted
# If successful, you'll see: msp_diesel_routes=>
\q  # Exit
```

---

### Step 3: Application Deployment

#### 3.1 Create Application User

```bash
# Create dedicated user (better security)
sudo adduser --system --group --home /opt/msp-diesel msp-app

# Switch to application user
sudo -u msp-app -i
```

#### 3.2 Clone Application Code

```bash
# If using Git
cd /opt/msp-diesel
git clone <your-repo-url> app
cd app

# Or upload files via SCP/SFTP
# scp -r /local/path user@server:/opt/msp-diesel/app
```

#### 3.3 Install Dependencies

```bash
cd /opt/msp-diesel/app
npm install --production
```

#### 3.4 Create Environment File

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

**Required Environment Variables**:
```env
# Database (use local PostgreSQL)
DATABASE_URL=postgresql://msp_user:your_secure_password_here@localhost:5432/msp_diesel_routes
PGHOST=localhost
PGPORT=5432
PGUSER=msp_user
PGPASSWORD=your_secure_password_here
PGDATABASE=msp_diesel_routes

# HubSpot API
HUBSPOT_API_KEY=pat-na1-your-hubspot-key-here

# Mapbox API (same value for both)
MAPBOX_TOKEN=pk.eyJ1your-mapbox-token-here
VITE_MAPBOX_TOKEN=pk.eyJ1your-mapbox-token-here

# Session Security (generate: openssl rand -base64 32)
SESSION_SECRET=your-random-32-character-secret-here

# Node Environment
NODE_ENV=production
PORT=5000
```

#### 3.5 Run Database Migrations

```bash
# Create database tables
npm run db:push

# If you get permission errors, ensure user has privileges:
# sudo -u postgres psql -d msp_diesel_routes -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO msp_user;"
```

#### 3.6 Seed Demo User (Optional)

```bash
# Create demo user (demo/demo123)
npm run seed
```

#### 3.7 Build Application

```bash
# Build frontend and backend
npm run build

# This creates:
# - dist/client (frontend static files)
# - dist/server.js (backend server)
```

---

### Step 4: PM2 Process Manager Setup

#### 4.1 Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'msp-diesel-routes',
    script: './dist/server.js',
    instances: 2,  // Use 2 CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    restart_delay: 4000,
    autorestart: true,
    watch: false
  }]
};
```

#### 4.2 Create Logs Directory

```bash
mkdir -p /opt/msp-diesel/app/logs
```

#### 4.3 Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd -u msp-app --hp /opt/msp-diesel
# Follow the command it outputs (run as root)

# Check status
pm2 status
pm2 logs msp-diesel-routes

# Useful PM2 commands:
# pm2 restart msp-diesel-routes
# pm2 stop msp-diesel-routes
# pm2 delete msp-diesel-routes
# pm2 monit  # Real-time monitoring
```

---

### Step 5: Nginx Reverse Proxy

#### 5.1 Create Nginx Configuration

```bash
# Exit msp-app user (Ctrl+D)
# Create Nginx site config as root
sudo nano /etc/nginx/sites-available/msp-diesel
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # Replace with your domain or IP

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Client upload size limit
    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/msp-diesel-access.log;
    error_log /var/log/nginx/msp-diesel-error.log;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve static files directly (performance optimization)
    location /assets {
        alias /opt/msp-diesel/app/dist/client/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 5.2 Enable Nginx Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/msp-diesel /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 5.3 Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

---

### Step 6: SSL/TLS Certificate (Let's Encrypt)

#### 6.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 6.2 Obtain SSL Certificate

```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (recommended: 2 - redirect all HTTP to HTTPS)
```

#### 6.3 Test Auto-Renewal

```bash
# Certbot auto-renews via systemd timer
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

#### 6.4 Updated Nginx Config (After SSL)

Certbot should automatically update your Nginx config. Verify:

```bash
sudo nano /etc/nginx/sites-available/msp-diesel
```

Should now include:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... rest of config
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

### Step 7: Monitoring & Maintenance

#### 7.1 Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/msp-diesel
```

```
/opt/msp-diesel/app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 msp-app msp-app
    postrotate
        pm2 reload msp-diesel-routes > /dev/null
    endscript
}
```

#### 7.2 Database Backups

```bash
# Create backup script
sudo nano /opt/msp-diesel/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/msp-diesel/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/msp_diesel_routes_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -h localhost -U msp_user -d msp_diesel_routes > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Make executable
sudo chmod +x /opt/msp-diesel/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/msp-diesel/backup.sh
```

#### 7.3 Monitoring with PM2

```bash
# Install PM2 Plus for monitoring (optional)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔧 Troubleshooting

### Application Won't Start

**Check PM2 logs:**
```bash
pm2 logs msp-diesel-routes --lines 100
```

**Common issues:**
- Database connection failed → Check `DATABASE_URL` in `.env`
- Port already in use → Check if another service is using port 5000
- Missing dependencies → Run `npm install` again

### Database Connection Issues

**Test connection:**
```bash
psql -h localhost -U msp_user -d msp_diesel_routes -W
```

**Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

**Check permissions:**
```bash
sudo -u postgres psql -c "\l"  # List databases
sudo -u postgres psql -c "\du" # List users
```

### Nginx Issues

**Check Nginx error logs:**
```bash
sudo tail -f /var/log/nginx/msp-diesel-error.log
```

**Test configuration:**
```bash
sudo nginx -t
```

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```

### SSL Certificate Problems

**Check certificate status:**
```bash
sudo certbot certificates
```

**Manual renewal:**
```bash
sudo certbot renew --force-renewal
```

### Application Performance Issues

**Check resource usage:**
```bash
pm2 monit  # Real-time monitoring
htop       # System resources
```

**Increase PM2 instances** (if you have more CPU cores):
```javascript
// In ecosystem.config.js
instances: 4  // Use 4 cores instead of 2
```

**Database slow queries:**
```bash
# Enable PostgreSQL query logging
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: log_min_duration_statement = 1000  # Log queries >1s
sudo systemctl restart postgresql
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# 1. Switch to app user
sudo -u msp-app -i
cd /opt/msp-diesel/app

# 2. Pull latest code
git pull origin main

# 3. Install new dependencies
npm install --production

# 4. Run database migrations (if any)
npm run db:push

# 5. Rebuild application
npm run build

# 6. Restart PM2
pm2 restart msp-diesel-routes

# 7. Check logs
pm2 logs msp-diesel-routes --lines 50
```

### Rollback Procedure

```bash
# 1. Restore database backup
gunzip /opt/msp-diesel/backups/msp_diesel_routes_YYYYMMDD_HHMMSS.sql.gz
psql -h localhost -U msp_user -d msp_diesel_routes < /opt/msp-diesel/backups/msp_diesel_routes_YYYYMMDD_HHMMSS.sql

# 2. Revert code
git checkout <previous-commit-hash>
npm install --production
npm run build
pm2 restart msp-diesel-routes
```

---

## 📊 Monitoring & Alerts

### Setup Uptime Monitoring

Use services like:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **StatusCake**

Configure HTTP checks for:
- `https://yourdomain.com/api/auth/me` (should return 401 or user object)

### PM2 Plus (Optional)

```bash
# Link to PM2 Plus account
pm2 link <secret-key> <public-key>

# View metrics at: https://app.pm2.io
```

---

## 🔐 Security Best Practices

### 1. Firewall Configuration

```bash
# Only allow SSH, HTTP, HTTPS
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. SSH Hardening

```bash
sudo nano /etc/ssh/sshd_config

# Disable root login
PermitRootLogin no

# Use key-based auth only
PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

### 3. Regular Updates

```bash
# Setup automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### 4. PostgreSQL Security

```bash
# Restrict PostgreSQL to localhost only
sudo nano /etc/postgresql/14/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'
```

### 5. Environment Variable Protection

```bash
# Secure .env file
chmod 600 /opt/msp-diesel/app/.env
chown msp-app:msp-app /opt/msp-diesel/app/.env
```

---

## 📞 Support Checklist

Before seeking help, verify:

- [ ] All environment variables are set in `.env`
- [ ] Database is running: `sudo systemctl status postgresql`
- [ ] Application is running: `pm2 status`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Firewall allows traffic: `sudo ufw status`
- [ ] SSL certificate is valid: `sudo certbot certificates`
- [ ] Check logs: `pm2 logs` and `/var/log/nginx/msp-diesel-error.log`

---

**Deployment Guide Version**: 1.0  
**Last Updated**: November 6, 2025  
**Tested On**: Ubuntu 22.04 LTS
