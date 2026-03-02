require("dotenv").config();

const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  dialect: "postgres"
};

module.exports = {
  development: {
    ...baseConfig,
    logging: console.log
  },
  test: {
    ...baseConfig,
    logging: false
  },
  production: {
    ...baseConfig,
    logging: false
  }
};
