import { Sequelize } from "sequelize";

type OpenApiProperty = {
  type: string;
  format?: string;
  nullable?: boolean;
};

type OpenApiSchema = {
  type: "object";
  properties: Record<string, OpenApiProperty>;
  required?: string[];
};

/**
 * Maps the raw DB column type string returned by QueryInterface.describeTable()
 * to an OpenAPI 3.0 property.
 */
function dbTypeToOpenApi(dbType: string): OpenApiProperty {
  const t = dbType.toUpperCase().split("(")[0].trim();

  switch (t) {
    case "INT":
    case "INT2":
    case "INT4":
    case "INT8":
    case "INTEGER":
    case "TINYINT":
    case "SMALLINT":
    case "MEDIUMINT":
    case "SERIAL":
    case "SMALLSERIAL":
      return { type: "integer", format: "int32" };

    case "BIGINT":
    case "BIGSERIAL":
      return { type: "integer", format: "int64" };

    case "FLOAT":
    case "FLOAT4":
    case "REAL":
      return { type: "number", format: "float" };

    case "DECIMAL":
    case "NUMERIC":
    case "DOUBLE":
    case "DOUBLE PRECISION":
    case "FLOAT8":
    case "MONEY":
      return { type: "number", format: "double" };

    case "BOOL":
    case "BOOLEAN":
      return { type: "boolean" };

    case "DATE":
      return { type: "string", format: "date" };

    case "TIMESTAMP":
    case "TIMESTAMPTZ":
    case "TIMESTAMP WITHOUT TIME ZONE":
    case "TIMESTAMP WITH TIME ZONE":
    case "DATETIME":
      return { type: "string", format: "date-time" };

    case "UUID":
      return { type: "string", format: "uuid" };

    case "JSON":
    case "JSONB":
      return { type: "object" };

    case "USER-DEFINED":
    case "ENUM":
      return { type: "string" };

    default:
      return { type: "string" };
  }
}

/** Converts a snake_case / lower table name to PascalCase for use as schema key */
function toPascalCase(tableName: string): string {
  return tableName
    .replace(/[_-](.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

/**
 * Introspects every table that currently exists in the connected database and
 * builds OpenAPI 3.0 schemas from the live column definitions.
 * This runs after migrations so every table — including ones without a
 * TypeScript model file — appears in the Swagger UI automatically on restart.
 */
export async function generateSchemasFromDatabase(
  sequelize: Sequelize,
): Promise<Record<string, OpenApiSchema>> {
  const qi = sequelize.getQueryInterface();
  const schemas: Record<string, OpenApiSchema> = {};

  // showAllTables() returns string[] on Postgres
  const tables = (await qi.showAllTables()) as string[];

  await Promise.all(
    tables
      .filter((t) => t !== "SequelizeMeta") // skip Umzug/Sequelize internal table
      .map(async (tableName) => {
        const description = await qi.describeTable(tableName);
        // description: Record<columnName, { type, allowNull, defaultValue, primaryKey, ... }>

        const properties: Record<string, OpenApiProperty> = {};
        const required: string[] = [];

        for (const [colName, col] of Object.entries(description) as [string, any][]) {
          const prop = dbTypeToOpenApi(col.type ?? "");

          if (col.allowNull) {
            prop.nullable = true;
          }

          properties[colName] = prop;

          if (!col.allowNull && col.defaultValue === null && !col.primaryKey) {
            required.push(colName);
          }
        }

        const schemaName = toPascalCase(tableName);
        schemas[schemaName] = {
          type: "object",
          properties,
          ...(required.length > 0 ? { required } : {}),
        };
      }),
  );

  return schemas;
}
