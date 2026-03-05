import { z } from "zod";

export const TaskType = z.enum([
  "code_generation",
  "bug_fixing",
  "refactor",
  "system_design",
  "api_design",
  "db_schema",
  "testing",
  "devops",
  "code_review",
]);

export const OutputFormat = z.enum([
  "code_only",
  "explain_then_code",
  "steps_then_code",
  "markdown",
]);

export const Verbosity = z.enum(["low", "medium", "high"]);

export const IntentSchema = z.object({
  taskType: TaskType,
  goal: z.string().min(10),

  language: z.enum(["ts", "js", "python", "sql", "unknown"]).default("unknown"),
  framework: z.array(z.string()).default([]),
  runtime: z.array(z.string()).default([]),

  constraints: z.object({
    techStack: z.array(z.string()).default([]),

    // IMPORTANT: encourage filling these
    mustInclude: z.array(z.string()).min(2).default([]),
    mustAvoid: z.array(z.string()).default([]),

    outputFormat: OutputFormat.default("steps_then_code"),
    verbosity: Verbosity.default("medium"),
  }),

  inputsProvided: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),

  clarifyingQuestions: z.array(z.string()).max(3).default([]),

  // IMPORTANT: encourage filling
  successCriteria: z.array(z.string()).min(2).default([]),
});

export type Intent = z.infer<typeof IntentSchema>;