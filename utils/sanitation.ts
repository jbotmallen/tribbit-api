import Joi from "joi";

export function isJwtError(error: any): error is { name: string } {
  return error && typeof error.name === 'string';
}

export const sanitize = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(error.message);
  }
  return value;
};