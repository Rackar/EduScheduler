module.exports = {
  apps: [
    {
      name: "edus-server",
      script: "server.js",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },
    },
  ],
};
