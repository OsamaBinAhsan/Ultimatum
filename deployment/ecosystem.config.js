// ==============================================================================
// PM2 Process Manager Configuration for Ultimatum Platform
// Usage: pm2 start deployment/ecosystem.config.js
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'ultimatum',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
