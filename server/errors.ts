import { Request, Response, NextFunction } from "express";

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface ApiErrorPayload {
  code: ErrorCode;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  message?: string;
  [key: string]: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Invalid request parameters.", details?: any) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed for request data.", details?: any) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required to perform this action.") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: You do not have sufficient permissions.") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict detected.") {
    super(409, "CONFLICT", message);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = "Too many requests. Please slow down and try again later.",
    retryAfterSeconds?: number,
  ) {
    super(429, "RATE_LIMITED", message, { retryAfterSeconds });
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected server error occurred.") {
    super(500, "INTERNAL_SERVER_ERROR", message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service is temporarily unavailable. Please try again later.") {
    super(503, "SERVICE_UNAVAILABLE", message);
  }
}

/**
 * Standard centralized error response formatter.
 * Returns both standardized `error: { code, message }` and backwards-compatible top-level `error: message`.
 */
export function formatErrorResponse(err: unknown): { statusCode: number; payload: any } {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      payload: {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
        // Backwards compatibility for existing client code expecting string error:
        message: err.message,
        errorMessage: err.message,
        errorString: err.message,
      },
    };
  }

  // Handle unexpected errors (never leak stack traces or internals)
  const _isProd = process.env.NODE_ENV === "production";
  const _rawMessage = err instanceof Error ? err.message : "Internal Server Error";

  return {
    statusCode: 500,
    payload: {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected internal error occurred. Please try again.",
      },
      message: "An unexpected internal error occurred.",
      errorMessage: "An unexpected internal error occurred.",
      errorString: "An unexpected internal error occurred.",
    },
  };
}

/**
 * Express centralized error handling middleware
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  const { statusCode, payload } = formatErrorResponse(err);

  // Structured server-side logging without leaking secrets
  console.error(
    `[API_ERROR] [${req.method}] ${req.originalUrl} - Status: ${statusCode} - Code: ${payload.error.code} - Msg: ${payload.error.message}`,
  );
  if (statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json(payload);
}
