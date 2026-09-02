import { Request, Response, NextFunction } from "express";
import { ValidationError } from "./errors";

export type ValidatorFn = (value: any, fieldName: string) => string | null;

export const RESOURCE_CATEGORIES = [
  "summary",
  "notes",
  "previous_exam",
  "cheat_sheet",
  "study_guide",
  "lab_material",
  "practice_material",
  "reference",
  "other",
  "lecture_notes",
  "lab_manual",
  "assignment",
  "important_questions",
  "reference_book",
] as const;

export const RESOURCE_FILE_TYPES = ["pdf", "docx", "pptx", "zip", "code", "image"] as const;

export const Validators = {
  string:
    (min = 1, max = 2000): ValidatorFn =>
    (value, field) => {
      if (typeof value !== "string") return `${field} must be a string.`;
      if (value.trim().length < min) return `${field} must be at least ${min} character(s).`;
      if (value.trim().length > max) return `${field} must not exceed ${max} characters.`;
      return null;
    },

  email: (): ValidatorFn => (value, field) => {
    if (typeof value !== "string") return `${field} must be a valid email string.`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return `${field} is not a valid email address.`;
    return null;
  },

  phone: (): ValidatorFn => (value, field) => {
    if (typeof value !== "string") return `${field} must be a valid phone number.`;
    const phoneRegex = /^\+?[0-9\s\-()]{7,25}$/;
    if (!phoneRegex.test(value.trim())) return `${field} is not a valid phone number format.`;
    return null;
  },

  password:
    (min = 8): ValidatorFn =>
    (value, field) => {
      if (typeof value !== "string" || value.length < min) {
        return `${field} must be at least ${min} characters long.`;
      }
      const hasLetter = /[a-zA-Z]/.test(value);
      const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);
      if (!hasLetter || !hasNumberOrSymbol) {
        return `${field} must contain at least one letter and one number or symbol.`;
      }
      return null;
    },

  enum:
    (allowedValues: readonly string[]): ValidatorFn =>
    (value, field) => {
      if (!allowedValues.includes(value)) {
        return `${field} must be one of: ${allowedValues.join(", ")}.`;
      }
      return null;
    },

  integer:
    (min = 0, max = Number.MAX_SAFE_INTEGER): ValidatorFn =>
    (value, field) => {
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) return `${field} must be an integer.`;
      if (num < min) return `${field} must be at least ${min}.`;
      if (num > max) return `${field} must not exceed ${max}.`;
      return null;
    },

  boolean: (): ValidatorFn => (value, field) => {
    if (typeof value !== "boolean" && value !== "true" && value !== "false") {
      return `${field} must be a boolean.`;
    }
    return null;
  },

  array:
    (itemValidator?: ValidatorFn, minLen = 0, maxLen = 100): ValidatorFn =>
    (value, field) => {
      if (!Array.isArray(value)) return `${field} must be an array.`;
      if (value.length < minLen) return `${field} must contain at least ${minLen} item(s).`;
      if (value.length > maxLen) return `${field} must not contain more than ${maxLen} items.`;
      if (itemValidator) {
        for (let i = 0; i < value.length; i++) {
          const err = itemValidator(value[i], `${field}[${i}]`);
          if (err) return err;
        }
      }
      return null;
    },

  number:
    (min = -Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): ValidatorFn =>
    (value, field) => {
      const num = Number(value);
      if (isNaN(num)) return `${field} must be a valid number.`;
      if (num < min) return `${field} must be at least ${min}.`;
      if (num > max) return `${field} must not exceed ${max}.`;
      return null;
    },

  object:
    (_schema?: Record<string, ValidatorFn>): ValidatorFn =>
    (value, field) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return `${field} must be an object.`;
      }
      return null;
    },

  optional:
    (validator: ValidatorFn): ValidatorFn =>
    (value, field) => {
      if (value === undefined || value === null || value === "") return null;
      return validator(value, field);
    },
};

export interface ValidationSchema {
  body?: Record<string, ValidatorFn>;
  query?: Record<string, ValidatorFn>;
  params?: Record<string, ValidatorFn>;
}

/**
 * Middleware that strictly validates body, query, and params against the provided schema.
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: { field: string; message: string; location: string }[] = [];

    if (schema.body && req.body) {
      for (const [field, validator] of Object.entries(schema.body)) {
        const error = validator(req.body[field], field);
        if (error) {
          errors.push({ field, message: error, location: "body" });
        }
      }
    }

    if (schema.query && req.query) {
      for (const [field, validator] of Object.entries(schema.query)) {
        const error = validator(req.query[field], field);
        if (error) {
          errors.push({ field, message: error, location: "query" });
        }
      }
    }

    if (schema.params && req.params) {
      for (const [field, validator] of Object.entries(schema.params)) {
        const error = validator(req.params[field], field);
        if (error) {
          errors.push({ field, message: error, location: "params" });
        }
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError("Request validation failed.", errors));
    }

    next();
  };
}

/**
 * Helper to validate and sanitize pagination parameters safely
 */
export function sanitizePagination(query: any, defaultLimit = 20, maxLimit = 50) {
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(query.limit || defaultLimit), 10) || defaultLimit),
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
