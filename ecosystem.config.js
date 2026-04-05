// PM2 process configuration
// Run with: pm2 start ecosystem.config.js
// IMPORTANT: instances must stay at 1 — SSE state is in-memory per process.

module.exports = {
  apps: [
    {
      name: "chat",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
