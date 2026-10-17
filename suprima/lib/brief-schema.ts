import { z } from "zod";

export const briefSchema = z.object({
  title: z.string().min(1).max(200),
  overview: z.string().min(1).max(1000),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1).max(150),
        text: z.string().min(1).max(30_000),
        sourceSentences: z
          .array(z.number().int().nonnegative())
          .min(1)
          .max(1000),
      }),
    )
    .min(1)
    .max(15),
  takeaways: z.array(z.string().min(1).max(500)).min(1).max(5),
});

export const briefJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          text: { type: "string" },
          sourceSentences: { type: "array", items: { type: "integer" } },
        },
        required: ["heading", "text", "sourceSentences"],
      },
    },
    takeaways: { type: "array", items: { type: "string" } },
  },
  required: ["title", "overview", "sections", "takeaways"],
};
