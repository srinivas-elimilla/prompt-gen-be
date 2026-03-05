import type { Intent } from "../schemas/intent.schema";

function bullet(list: string[]) {
  return list.length ? list.map((x) => `- ${x}`).join("\n") : "- (none)";
}

function renderPatterns(
  patterns: { title: string; content: string; score?: number }[],
) {
  if (!patterns.length) return "";

  return `
Reference patterns (adapt if useful):
${patterns
  .map((p, i) => {
    const score =
      typeof p.score === "number" ? ` (score: ${p.score.toFixed(3)})` : "";
    return `Pattern ${i + 1}: ${p.title}${score}\n${p.content}`;
  })
  .join("\n\n---\n\n")}
`.trim();
}

export function composeCodingPrompts(
  intent: Intent,
  patterns: { title: string; content: string; score?: number }[] = [],
) {
  const tech = intent.constraints.techStack.join(", ");
  const mustInclude = intent.constraints.mustInclude;
  const mustAvoid = intent.constraints.mustAvoid;
  const success = intent.successCriteria;

  const patternBlock = renderPatterns(patterns);

  // Strong defaults for backend API tasks (adjust anytime)
  const fileSet = [
    "package.json",
    "tsconfig.json",
    ".env.example",
    "prisma/schema.prisma",
    "src/server.ts",
    "src/app.ts",
    "src/db/prisma.ts",
    "src/middleware/errorHandler.ts",
    "src/middleware/notFound.ts",
    "src/utils/apiResponse.ts",
    "src/utils/pagination.ts",
    "src/routes/product.routes.ts",
    "src/controllers/product.controller.ts",
    "src/validators/product.schema.ts",
  ];

  const strictOutputRules = `
OUTPUT RULES (must follow exactly):
1) First print a folder tree.
2) Then print each file in this exact format:

<<<FILE: path/to/file.ext>>>
<FENCE:ts|js|json|prisma>
...content...
</FENCE>

Where:
- Use <FENCE:ts> for TypeScript files
- Use <FENCE:json> for JSON files
- Use <FENCE:prisma> for prisma/schema.prisma
3) Include ALL files listed in "Files to include".
4) No extra commentary outside the file blocks.
`.trim();

  const requirements = `
Implementation requirements:
- Endpoints: POST /products, GET /products, GET /products/:id, PATCH /products/:id, DELETE /products/:id
- Validation: Zod schema for create/update body + :id param
- Pagination: GET /products supports ?page=1&limit=20 and returns { data, meta: { page, limit, totalPages, totalCount } }
- Response shape:
  - Success: { data, meta? }
  - Error: { error: { code, message, details? } }
`.trim();

  const common = `
You are a senior backend engineer.

Goal:
${intent.goal}

Tech stack:
${tech}

Must include:
${bullet(mustInclude)}

Must avoid:
${bullet(mustAvoid)}

Definition of done:
${bullet(success)}

Assumptions:
- Use Node.js + Express + TypeScript
- Prisma with PostgreSQL
- Zod validation for request bodies and params
- Pagination on GET /products using query params: page, limit
- Central error middleware + notFound middleware
- Use async/await with proper error propagation
`.trim();

  const filesToInclude = `
Files to include:
${fileSet.map((f) => `- ${f}`).join("\n")}
`.trim();

  const fast = `
${common}

${patternBlock}

Task:
Implement the API with minimal explanation. Prioritize correct, runnable code.

${filesToInclude}

${strictOutputRules}
`.trim();

  const detailed = `
${common}

${requirements}

${patternBlock}

Task (step-by-step):
1) Show folder structure
2) Provide code per file (all required)
3) Ensure pagination + validation + error handling work
4) Add minimal setup steps (ONLY inside README-style notes at the end, max 10 bullets)

${filesToInclude}

${strictOutputRules}
`.trim();

  const strict = `
${common}

${requirements}

${patternBlock}

Task:
Generate production-quality code. Follow naming conventions and best practices.

${filesToInclude}

${strictOutputRules}

Additional strictness:
- All endpoints must be implemented: POST/GET/GET:id/PATCH/DELETE for /products
- Zod schemas must validate create/update payloads and id params
- Pagination must return { data, meta: { page, limit, totalPages, totalCount } }
- Error handler must normalize errors into consistent JSON
- Prisma schema must include Product model (id, name, sku, price, stock, createdAt, updatedAt)
- Include npm scripts and Prisma commands in package.json
`.trim();

  const finalPrompt = detailed;

  return {
    finalPrompt,
    variants: { fast, detailed, strict },
  };
}
