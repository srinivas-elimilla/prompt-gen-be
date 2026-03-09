import "dotenv/config";
import { Pool } from "pg";
import { embedTextLocal } from "../services/localEmbeddings";

type PatternSeed = {
  title: string;
  tags: string[];
  content: string;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Check backend/.env");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for embeddings during seeding");
  }

  const model = process.env.OPENAI_EMBEDDINGS_MODEL || "text-embedding-3-small";

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!res.ok) {
    throw new Error(`Embeddings failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

function toVectorLiteral(vec: number[]) {
  return `[${vec.join(",")}]`;
}

const seeds: PatternSeed[] = [
  {
    title: "Express error handler + consistent error shape",
    tags: ["express", "middleware", "errors"],
    content: `
Use centralized error handler middleware with a consistent JSON shape:
Error response:
{ error: { code: string, message: string, details?: any } }

Rules:
- Handle Zod validation errors with code="VALIDATION_ERROR"
- Handle Prisma known errors with code="DB_ERROR"
- Default: code="INTERNAL_ERROR"
- Never leak stack traces in production
`.trim(),
  },
  {
    title: "NotFound middleware",
    tags: ["express", "middleware"],
    content: `
Add a notFound middleware after routes:
- If no route matched, return 404 with:
{ error: { code: "NOT_FOUND", message: "Route not found" } }
`.trim(),
  },
  {
    title: "Pagination helper: page + limit + meta",
    tags: ["pagination", "api"],
    content: `
Pagination contract:
- Accept query params: page (>=1), limit (>=1, <=100)
- Convert to: skip=(page-1)*limit, take=limit
- Response shape:
{
  data: T[],
  meta: { page, limit, totalPages, totalCount }
}
- totalPages = ceil(totalCount/limit)
`.trim(),
  },
  {
    title: "Zod validation pattern for body + params",
    tags: ["zod", "validation"],
    content: `
Use Zod for:
- req.body validation (create/update)
- req.params validation (id)
Pattern:
const schema = z.object({ ... });
const parsed = schema.parse(req.body);

For params:
z.object({ id: z.string().uuid() }) or cuid() depending on DB IDs.
On error, throw and let error middleware format response.
`.trim(),
  },
  {
    title: "Prisma client singleton",
    tags: ["prisma", "db"],
    content: `
Create PrismaClient in src/db/prisma.ts.
Ensure singleton behavior in dev to avoid too many connections:
- globalThis.prisma pattern
Export prisma for use in controllers/services.
`.trim(),
  },
  {
    title: "CRUD controller conventions",
    tags: ["controller", "crud"],
    content: `
Controller rules:
- Use async handlers
- Validate input first (Zod)
- Use prisma.product.{create,findMany,findUnique,update,delete}
- For GET /products: apply pagination (skip/take) + optional search
- Return { data, meta? } success shape
`.trim(),
  },
  {
    title: "Routes conventions for /products",
    tags: ["routes", "express"],
    content: `
Routes:
POST   /products
GET    /products
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id

Keep router in src/routes/product.routes.ts and mount at /products.
`.trim(),
  },
  {
    title: "API success response envelope",
    tags: ["api", "response"],
    content: `
Success response shape:
- For single resource: { data: {...} }
- For list: { data: [...], meta: {...} }
Do not return raw arrays; always wrap in { data }.
`.trim(),
  },
  {
    title: "Prisma schema: Product model baseline",
    tags: ["prisma", "schema"],
    content: `
Product model baseline fields:
- id (cuid() or uuid())
- name (string)
- sku (string unique)
- price (decimal or int cents)
- stock (int)
- createdAt (DateTime default now)
- updatedAt (DateTime @updatedAt)
Also add @@index where useful (sku).
`.trim(),
  },
  {
    title: "HTTP status codes for CRUD",
    tags: ["http", "api"],
    content: `
HTTP status rules:
- POST create: 201
- GET success: 200
- PATCH success: 200
- DELETE success: 200 (or 204 with no body)
- Validation: 400
- Not found resource: 404
- Server errors: 500
`.trim(),
  },
];

async function main() {
  console.log("Seeding prompt_patterns...");
  const test = await pool.query("SELECT NOW()");
  console.log("DB connected:", test.rows[0]);

  // Optional: clear existing
  // await pool.query("TRUNCATE TABLE public.prompt_patterns RESTART IDENTITY;");

  for (const s of seeds) {
    const embedding = await embedTextLocal(`${s.title}\n\n${s.content}`); // for openAI vector(1536), embedText
    const vectorLiteral = `[${embedding.join(",")}]`;

    await pool.query(
      `INSERT INTO public.prompt_patterns_hf (title, tags, content, embedding)
   VALUES ($1, $2, $3, $4::vector)`,
      [s.title, s.tags, s.content, vectorLiteral],
    );

    console.log("Inserted:", s.title);
  }

  console.log("Done.");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
