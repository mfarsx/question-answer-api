const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET_KEY", "JWT_EXPIRE", "JWT_COOKIE"];
const INSECURE_DEFAULTS = new Set(["change-me", "dalarira", "your-email@example.com", "your-app-password"]);

const validateEnv = () => {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      throw new Error(`${key} is not configured`);
    }
  }

  const { JWT_SECRET_KEY, NODE_ENV } = process.env;

  if (JWT_SECRET_KEY.length < 32) {
    throw new Error("JWT_SECRET_KEY must be at least 32 characters long");
  }

  if (NODE_ENV === "production" && INSECURE_DEFAULTS.has(JWT_SECRET_KEY)) {
    throw new Error("JWT_SECRET_KEY must not use an insecure default in production");
  }
};

const isSmtpConfigured = () => {
  const requiredSmtpVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];

  return requiredSmtpVars.every((key) => {
    const value = process.env[key];
    return value && !INSECURE_DEFAULTS.has(value);
  });
};

module.exports = {
  validateEnv,
  isSmtpConfigured,
};
