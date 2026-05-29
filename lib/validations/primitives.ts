import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";

export const uuidSchema = z.uuid();

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();

export const yearSchema = z.coerce
  .number()
  .int()
  .min(-4000)
  .max(2100)
  .nullable()
  .optional();

export const sortOrderSchema = z.coerce.number().int().min(0).default(0);

export const latitudeSchema = z.coerce.number().min(-90).max(90);
export const longitudeSchema = z.coerce.number().min(-180).max(180);

export const jsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const geoJsonSchema = z
  .object({
    type: z.string().min(1),
  })
  .passthrough();

export const mapCenterSchema = z.object({
  lat: latitudeSchema.default(39),
  lng: longitudeSchema.default(35),
  zoom: z.coerce.number().min(1).max(18).default(5),
});
