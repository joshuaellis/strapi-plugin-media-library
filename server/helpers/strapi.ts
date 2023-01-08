import { PLUGIN_NAME } from "../constants";

export const getService = (name: string) =>
  strapi.plugin(PLUGIN_NAME).service(name);

export const validateValueIsStrapiId = (value: unknown) => {
  if (typeof value === "string") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0;
  }

  return false;
};
