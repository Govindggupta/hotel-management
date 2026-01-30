import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

type Source = "body" | "query" | "params";

const validatedKey: Record<Source, keyof Pick<Request, "validatedBody" | "validatedQuery" | "validatedParams">> = {
  body: "validatedBody",
  query: "validatedQuery",
  params: "validatedParams",
};

/**
 * Validates request data against a Zod schema and attaches parsed result to req.validatedBody/validatedQuery/validatedParams.
 * Returns 400 with validation errors if invalid. Controllers should read from the validated* property, not req.body/query/params.
 */
export function validate<T>(schema: ZodSchema<T>, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const raw = req[source];
    const result = schema.safeParse(raw);

    if (!result.success) {
      const errors = result.error.flatten();
      return res.status(400).json({
        success: false,
        data: null,
        error: "VALIDATION_ERROR",
        details: errors.fieldErrors,
      });
    }

    req[validatedKey[source]] = result.data;
    next();
  };
}
