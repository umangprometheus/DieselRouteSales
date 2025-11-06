# MSP Diesel Field Sales Route App - Quick Setup Summary

Fast-track guide for getting this app running on your VM or new Replit workspace.

---

## 🎯 What This App Does

Mobile field sales app for diesel sales reps to:
- Plan optimized daily routes based on customer locations
- Get GPS-based check-in prompts within 800 feet of customers
- Auto-log visits to HubSpot CRM
- Export daily activity reports

**Tech Stack**: React + TypeScript + Express + PostgreSQL + HubSpot + Mapbox

---

## ⚡ Quick Start (Replit)

### 1. Set Secrets

In Replit Secrets panel, add these **5 required secrets**:

```
DATABASE_URL            (auto-provided by Neon PostgreSQL integration)
HUBSPOT_API_KEY         (get from HubSpot → Settings → Private Apps)
MAPBOX_TOKEN            (get from https://account.mapbox.com)
VITE_MAPBOX_TOKEN       (same value as MAPBOX_TOKEN - must duplicate!)
SESSION_SECRET          (generate: openssl rand -base64 32)
```

### 2. Install & Run

```bash
npm install
npm run db:push    # Create database tables
npm run seed       # Create demo user (optional)
npm run dev        # Start application
```

### 3. Test Login

- URL: Your Replit preview URL
- Username: `demo`
- Password: `demo123`

**Done!** ✅ App is running on Replit.

---

## 🖥️ Quick Start (VM Deployment)

### Prerequisites

- Ubuntu 22.04+ VM
- 4 GB RAM minimum
- Domain name (for SSL)

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx + PM2
sudo apt install -y nginx
sudo npm install -g pm2
```

### 2. Setup Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE msp_diesel_routes;
CREATE USER msp_user WITH ENCRYPTED PASSWORD 'YourSecurePassword';
GRANT ALL PRIVILEGES ON DATABASE msp_diesel_routes TO msp_user;
\c msp_diesel_routes
GRANT ALL ON SCHEMA public TO msp_user;
EOF
```

### 3. Deploy Application

```bash
# Clone code
git clone <your-repo-url> /opt/msp-diesel/app
cd /opt/msp-diesel/app

# Install dependencies
npm install --production

# Create .env file (copy from .env.example and fill in values)
cp .env.example .env
nano .env

# Run database migrations
npm run db:push

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the command it outputs
```

### 4. Configure Nginx Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/msp-diesel
```

Paste this config (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/msp-diesel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL (Optional but Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**Done!** ✅ App is live at `https://yourdomain.com`

---

## 🔑 Environment Variables

### Required Secrets

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Auto (Replit) or `postgresql://user:pass@localhost/db` (VM) |
| `HUBSPOT_API_KEY` | HubSpot Private App token | HubSpot → Settings → Integrations → Private Apps |
| `MAPBOX_TOKEN` | Mapbox API key (server) | https://account.mapbox.com/access-tokens/ |
| `VITE_MAPBOX_TOKEN` | Mapbox API key (client) | **Same as MAPBOX_TOKEN** (must duplicate!) |
| `SESSION_SECRET` | Cookie encryption key | Generate: `openssl rand -base64 32` |

### Optional Secrets

| Variable | Description | Default |
|----------|-------------|---------|
| `HUBSPOT_FIELD_VISIT_ASSOCIATION_TYPE_ID` | Custom object association | Falls back to Notes if blank |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `5000` |

---

## 📁 Project Structure

```
msp-diesel-routes/
├── client/                   # React frontend
│   ├── src/
│   │   ├── pages/           # Route pages (login, plan, route, etc.)
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Auth, API, utilities
│   │   └── App.tsx          # Root component
│   └── index.html
├── server/                   # Express backend
│   ├── routes.ts            # API endpoints (509 lines)
│   ├── storage.ts           # Database operations
│   ├── services/            # HubSpot, Mapbox, Geo, Sync
│   └── index.ts             # Server entry point
├── shared/                   # Shared types
│   └── schema.ts            # Drizzle database schema
├── .env.example             # Environment template
├── package.json             # Dependencies
├── vite.config.ts           # Vite config
├── drizzle.config.ts        # Database config
├── PROJECT_CONTEXT.md       # Full documentation (this is key!)
├── DEPLOYMENT.md            # Complete VM deployment guide
└── SETUP_SUMMARY.md         # This file
```

---

## 🧪 Testing

### Demo Credentials

**Username**: `demo`  
**Password**: `demo123`

Pre-seeded with 10 companies in Memphis, TN.

### Quick Test Checklist

1. ✅ Login with demo/demo123
2. ✅ Click "Sync Companies" on Plan page
3. ✅ Select 3 companies on map
4. ✅ Click "Build Route"
5. ✅ Click "Start Route"
6. ✅ Navigate to Summary page
7. ✅ Click Logout button

---

## 💰 Cost Comparison

### Replit (Current Setup)

| Service | Usage | Free Tier | Cost |
|---------|-------|-----------|------|
| Replit Hosting | 24/7 | Included | $0 |
| Neon PostgreSQL | 5 MB | 3 GB free | $0 |
| HubSpot API | 1,000 req/day | 10,000/day free | $0 |
| Mapbox Geocoding | ~50 req/day | 100,000/mo free | $0 |
| Mapbox Directions | ~15 req/day | 10,000/mo free | $0 |
| **Total** | | | **$0/month** |

### VM Deployment (Production Scale)

| Service | Cost | Notes |
|---------|------|-------|
| DigitalOcean Droplet (4GB) | $24/mo | Or AWS/GCP equivalent |
| PostgreSQL (self-hosted) | $0 | Included with VM |
| Domain name | $12/yr | Optional |
| SSL (Let's Encrypt) | $0 | Free |
| **Total** | **~$25/month** | More control, better performance |

---

## 🔧 Common Commands

### Development

```bash
npm run dev              # Start dev server (Vite + Express)
npm run build            # Build for production
npm run db:push          # Sync database schema
npm run seed             # Create demo user
```

### Production (PM2)

```bash
pm2 start ecosystem.config.js   # Start app
pm2 logs msp-diesel-routes      # View logs
pm2 restart msp-diesel-routes   # Restart app
pm2 stop msp-diesel-routes      # Stop app
pm2 monit                       # Real-time monitoring
```

### Database

```bash
# Connect to database
psql -h localhost -U msp_user -d msp_diesel_routes

# Backup database
pg_dump -U msp_user msp_diesel_routes > backup.sql

# Restore database
psql -U msp_user msp_diesel_routes < backup.sql
```

---

## 🚨 Troubleshooting

### Issue: "Cannot connect to database"

**Solution**: Check `DATABASE_URL` in `.env` or Replit Secrets

```bash
# Test connection
psql -h localhost -U msp_user -d msp_diesel_routes -W
```

### Issue: "Map not loading"

**Solution**: Verify BOTH Mapbox tokens are set:

- `MAPBOX_TOKEN` (server-side)
- `VITE_MAPBOX_TOKEN` (client-side) - **must be identical!**

### Issue: "HubSpot sync fails"

**Solution**: Check HubSpot API key permissions:

1. Go to HubSpot → Settings → Private Apps
2. Verify scopes include: `crm.objects.companies.read`
3. Regenerate key if needed

### Issue: "PM2 app crashes on startup"

**Solution**: Check PM2 logs for errors:

```bash
pm2 logs msp-diesel-routes --lines 100
```

Common causes:
- Missing environment variables in `.env`
- Database not running
- Port 5000 already in use

### Issue: "Bottom nav showing on login page"

**Solution**: Already fixed! Clear browser cache:

- Chrome/Edge: Ctrl+Shift+R
- Firefox: Ctrl+F5
- Safari: Cmd+Shift+R

---

## 📚 More Documentation

For complete details, see:

- **PROJECT_CONTEXT.md** - Full architecture, API docs, database schema (400+ lines)
- **DEPLOYMENT.md** - Complete VM deployment guide with Nginx, SSL, backups
- **replit.md** - System architecture and technical decisions

---

## ✅ Deployment Checklist

### Before Going Live

- [ ] All environment variables set
- [ ] Database tables created (`npm run db:push`)
- [ ] HubSpot sync works (test with "Sync Companies" button)
- [ ] Maps load correctly (verify Mapbox tokens)
- [ ] Login/logout functional
- [ ] SSL certificate installed (VM only)
- [ ] Backups configured (VM only)
- [ ] Monitoring enabled (PM2 Plus or similar)

### Post-Deployment

- [ ] Test login with demo/demo123
- [ ] Verify HubSpot company sync
- [ ] Test route building and navigation
- [ ] Test check-in flow
- [ ] Test daily summary export
- [ ] Create real user accounts
- [ ] Set up uptime monitoring
- [ ] Document any customizations

---

## 🎯 Next Steps

1. **Review PROJECT_CONTEXT.md** for complete technical overview
2. **Set up monitoring** (UptimeRobot, PM2 Plus, etc.)
3. **Create production users** (replace demo account)
4. **Customize UI** (colors in `design_guidelines.md`)
5. **Setup backups** (automated PostgreSQL dumps)
6. **Configure alerts** (downtime, errors, etc.)

---

**Quick Setup Version**: 1.0  
**Last Updated**: November 6, 2025  
**Questions?** See PROJECT_CONTEXT.md or DEPLOYMENT.md
