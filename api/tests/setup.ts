// Must run before any source module is imported so env.ts doesn't throw.
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_NAME = "ecommerce_test";
process.env.DB_USER = "postgres";
process.env.DB_PASSWORD = "postgres";
process.env.JWT_SECRET = "test_secret_do_not_use_in_prod";
process.env.JWT_EXPIRES_IN = "1h";
