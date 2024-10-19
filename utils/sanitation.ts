import Joi from "joi";

export const sanitize = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(error.message);
  }
  return value;
};