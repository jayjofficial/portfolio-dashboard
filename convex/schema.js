import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  portfolio: defineTable({
    data: v.any(),
    updatedAt: v.number(),
  }),
});
