const required = ["URL", "JWT_SECRET", "JWT_REFRESH_SECRET", "TOKEN", "TELEGRAM_API"];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
    console.warn("JWT secrets shorter than 32 characters are weak");
  }
  if (process.env.NODE_ENV === "production" && !process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.warn("TELEGRAM_WEBHOOK_SECRET is not set; webhook requests will be rejected");
  }
};

const trustProxyHops = () => {
  const hops = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? "1", 10);
  return Number.isInteger(hops) && hops >= 0 ? hops : 1;
};

module.exports = { validateEnv, trustProxyHops };
