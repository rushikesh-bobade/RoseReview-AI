import pino from "pino";
import { env } from "./env";

/**
 * Core application logger configured with environment-specific transports.
 * Uses pino-pretty for development and standard structured JSON for production.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            singleLine: true,
          },
        }
      : undefined,
});

/**
 * Domain-specific loggers for tracing grouped events.
 * Use these to maintain organized observability logs across the application.
 */
export const loggers = {
  db: logger.child({ module: "database" }),
  ai: logger.child({ module: "ai_engine" }),
  github: logger.child({ module: "github_integration" }),
  auth: logger.child({ module: "authentication" }),
  http: logger.child({ module: "http_server" }),
  workspace: logger.child({ module: "workspace" }),
};

/**
 * Helper to log AI processing lifecycles consistently.
 */
export const logAILifecycle = (operationId: string, event: "START" | "COMPLETE" | "FAILED", details?: Record<string, any>) => {
  const msg = `AI Operation [${event}]`;
  if (event === "FAILED") {
    loggers.ai.error({ operationId, ...details }, msg);
  } else {
    loggers.ai.info({ operationId, ...details }, msg);
  }
};
