import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

export default {
  apps: [{
    name: 'msp-diesel-routes',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 5000,
      DATABASE_URL: process.env.DATABASE_URL,
      PGHOST: process.env.PGHOST,
      PGPORT: process.env.PGPORT,
      PGUSER: process.env.PGUSER,
      PGPASSWORD: process.env.PGPASSWORD,
      PGDATABASE: process.env.PGDATABASE,
      DB_SSL: process.env.DB_SSL,
      HUBSPOT_API_KEY: process.env.HUBSPOT_API_KEY,
      MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
      VITE_MAPBOX_TOKEN: process.env.VITE_MAPBOX_TOKEN,
      SESSION_SECRET: process.env.SESSION_SECRET,
      COOKIE_SECURE: process.env.COOKIE_SECURE,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    restart_delay: 4000,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: 5000,
    merge_logs: true,
    kill_timeout: 5000
  }]
};
