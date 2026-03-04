import swaggerUi from "swagger-ui-express";
import { connectDatabase, sequelize } from "./infrastructure/database/sequelize";
import { env } from "./infrastructure/config/env";
import { app } from "./presentation/http/app";
import { buildSwaggerSpec } from "./config/swagger";
import { generateSchemasFromDatabase } from "./config/schema-introspection";
import { startOrderStatusConsumer } from "./infrastructure/messaging/order-status.consumer";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    console.log("Database connection successful");

    // Start RabbitMQ consumer for order status changes from Admin
    await startOrderStatusConsumer();

    // Introspect the live database and build the Swagger spec so every table —
    // including ones without a TypeScript model file — appears on restart.
    const schemas = await generateSchemasFromDatabase(sequelize);
    const swaggerSpec = buildSwaggerSpec(schemas);

    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get("/api/docs.json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
      console.log(`Swagger UI available at http://localhost:${env.port}/api/docs`);
    });
  } catch (error) {
    console.error("Error starting server", error);
    process.exit(1);
  }
};

void startServer();
