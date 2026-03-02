import { Sequelize } from "sequelize";
import { env } from "../config/env";
import { initModels } from "../persistence/sequelize/models";

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "postgres",
  logging: env.nodeEnv === "development" ? console.log : false
});

initModels(sequelize);

export const connectDatabase = async (): Promise<void> => {
  await sequelize.authenticate();
};
