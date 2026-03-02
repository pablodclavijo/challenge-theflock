import swaggerJsdoc from "swagger-jsdoc";

const port = process.env.PORT ?? 3000;

/**
 * Builds the OpenAPI spec.
 * Pass `schemas` generated from live Sequelize models so the spec always
 * reflects the current database structure after each server restart.
 */
export function buildSwaggerSpec(
  schemas: Record<string, object> = {},
): object {
  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "E-commerce API",
        version: "1.0.0",
        description: "API Node y Express para challenge TheFlock",
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: "Local development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas,
      },
    },
    apis: [
      "./src/presentation/http/routes/**/*.ts",
      "./src/presentation/http/controllers/**/*.ts",
    ],
  };

  return swaggerJsdoc(options);
}
