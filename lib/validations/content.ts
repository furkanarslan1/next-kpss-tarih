import { z } from "zod";
import {
  contentStatusSchema,
  entityTypeSchema,
  mapLayerKindSchema,
  timelineEventTypeSchema,
} from "@/lib/validations/enums";
import {
  geoJsonSchema,
  jsonValueSchema,
  latitudeSchema,
  longitudeSchema,
  mapCenterSchema,
  optionalTextSchema,
  slugSchema,
  sortOrderSchema,
  uuidSchema,
  yearSchema,
} from "@/lib/validations/primitives";

export const historicalPeriodSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(2).max(160),
    description: optionalTextSchema,
    startsAtYear: yearSchema,
    endsAtYear: yearSchema,
    displayOrder: sortOrderSchema,
    status: contentStatusSchema.default("draft"),
  })
  .refine(
    (value) =>
      value.startsAtYear == null ||
      value.endsAtYear == null ||
      value.startsAtYear <= value.endsAtYear,
    "Start year must be before end year.",
  );

export const topicSchema = z.object({
  periodId: uuidSchema,
  slug: slugSchema,
  title: z.string().trim().min(2).max(160),
  summary: optionalTextSchema,
  mapCenter: mapCenterSchema.default({ lat: 39, lng: 35, zoom: 5 }),
  displayOrder: sortOrderSchema,
  status: contentStatusSchema.default("draft"),
});

export const historicalEntitySchema = z
  .object({
    topicId: uuidSchema,
    entityType: entityTypeSchema,
    slug: slugSchema,
    name: z.string().trim().min(2).max(160),
    summary: optionalTextSchema,
    body: optionalTextSchema,
    startsAtYear: yearSchema,
    endsAtYear: yearSchema,
    color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
    metadata: z.record(z.string(), jsonValueSchema).default({}),
    status: contentStatusSchema.default("draft"),
  })
  .refine(
    (value) =>
      value.startsAtYear == null ||
      value.endsAtYear == null ||
      value.startsAtYear <= value.endsAtYear,
    "Start year must be before end year.",
  );

export const mapLayerSchema = z
  .object({
    topicId: uuidSchema,
    title: z.string().trim().min(2).max(160),
    layerKind: mapLayerKindSchema,
    geojson: geoJsonSchema,
    validFromYear: yearSchema,
    validToYear: yearSchema,
    style: z.record(z.string(), jsonValueSchema).default({}),
    status: contentStatusSchema.default("draft"),
  })
  .refine(
    (value) =>
      value.validFromYear == null ||
      value.validToYear == null ||
      value.validFromYear <= value.validToYear,
    "Start year must be before end year.",
  );

export const timelineEventSchema = z
  .object({
    topicId: uuidSchema,
    entityId: uuidSchema.nullable().optional(),
    eventType: timelineEventTypeSchema.default("other"),
    title: z.string().trim().min(2).max(180),
    summary: optionalTextSchema,
    body: optionalTextSchema,
    occurredOn: z.iso.date().nullable().optional(),
    startsAtYear: yearSchema,
    endsAtYear: yearSchema,
    importance: z.coerce.number().int().min(1).max(5).default(3),
    status: contentStatusSchema.default("draft"),
  })
  .refine(
    (value) =>
      value.startsAtYear == null ||
      value.endsAtYear == null ||
      value.startsAtYear <= value.endsAtYear,
    "Start year must be before end year.",
  );

export const eventLocationSchema = z
  .object({
    eventId: uuidSchema,
    title: z.string().trim().min(2).max(160),
    placeName: optionalTextSchema,
    lat: latitudeSchema.nullable().optional(),
    lng: longitudeSchema.nullable().optional(),
    geojson: geoJsonSchema.nullable().optional(),
    modalTitle: optionalTextSchema,
    modalBody: optionalTextSchema,
    sortOrder: sortOrderSchema,
  })
  .refine(
    (value) =>
      (value.lat != null && value.lng != null) || value.geojson != null,
    "A location needs either lat/lng or GeoJSON.",
  );

export type HistoricalPeriodInput = z.infer<typeof historicalPeriodSchema>;
export type TopicInput = z.infer<typeof topicSchema>;
export type HistoricalEntityInput = z.infer<typeof historicalEntitySchema>;
export type MapLayerInput = z.infer<typeof mapLayerSchema>;
export type TimelineEventInput = z.infer<typeof timelineEventSchema>;
export type EventLocationInput = z.infer<typeof eventLocationSchema>;
