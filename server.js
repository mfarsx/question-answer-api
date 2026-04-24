const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const path = require("path");

const routers = require("./routers/index");
const { connectDatabase } = require("./helpers/database/connectDatabase");
const { validateEnv } = require("./helpers/config/env");
const customErrorHandlers = require("./middlewares/errors/customErrorHandler");

dotenv.config({
  path: "./config/env/config.env",
  quiet: true,
});

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    environment: NODE_ENV,
  });
});

app.use("/api", routers);
app.use(customErrorHandlers);

const startServer = async () => {
  validateEnv();
  await connectDatabase();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`App Started on ${PORT} : ${NODE_ENV}`);
  });

  return server;
};

if (NODE_ENV !== "test") {
  startServer().catch((error) => {
    console.error("Failed to start application", error.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
};
