import "dotenv/config";
import { Pool } from "pg";
import { embedTextLocal } from "./localEmbeddings";
// later: import embedTextOpenAI from "./embeddings";

// console.log("DB URL >>>>", process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const provider = (process.env.EMBEDDINGS_PROVIDER || "hf").toLowerCase();

function toVectorLiteral(vec: number[]) {
  return `[${vec.join(",")}]`;
}

export async function retrievePatternsHF(query: string, k = 3) {
  const test = await pool.query("SELECT NOW()");
  console.log("DB Connected", test.rows[0]);

  console.log("Retrieving patterns...");
  const table =
    provider === "openai"
      ? "public.prompt_patterns"
      : "public.prompt_patterns_hf";

  // For now, only HF/local is implemented (no billing)
  const embedding = await embedTextLocal(query);
  console.log("Embedding is done.");

  const vectorLiteral = toVectorLiteral(embedding);

  const sql = `
    SELECT id, title, tags, content,
           1 - (embedding <=> $1::vector) AS score
    FROM ${table}
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $2;
  `;

  const { rows } = await pool.query(sql, [vectorLiteral, k]);
  console.log("Rows achieved.");

  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    tags: r.tags || [],
    content: r.content,
    score: Number(r.score ?? 0),
  }));
}
