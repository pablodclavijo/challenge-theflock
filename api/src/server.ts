import { connectDatabase } from "./infrastructure/database/sequelize";
import { env } from "./infrastructure/config/env";
import { app } from "./presentation/http/app";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    console.log("Database connection successful");

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Error starting server", error);
    process.exit(1);
  }
};

void startServer();
