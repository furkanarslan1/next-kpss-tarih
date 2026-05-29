import { z } from "zod";

export const appRoleSchema = z.enum(["admin", "editor", "member"]);
export const contentStatusSchema = z.enum(["draft", "published", "archived"]);
export const entityTypeSchema = z.enum([
  "state",
  "empire",
  "tribe",
  "person",
  "place",
  "army",
  "treaty",
  "other",
]);
export const mapLayerKindSchema = z.enum([
  "points",
  "regions",
  "routes",
  "battlefronts",
]);
export const questionDifficultySchema = z.enum(["easy", "medium", "hard"]);
export const timelineEventTypeSchema = z.enum([
  "battle",
  "migration",
  "treaty",
  "capital",
  "political",
  "cultural",
  "religious",
  "economic",
  "other",
]);
