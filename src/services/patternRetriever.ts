import "dotenv/config";
import { Pool } from "pg";
import { embedTextLocal } from "./localEmbeddings";
// later: import embedTextOpenAI from "./embeddings";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const provider = (process.env.EMBEDDINGS_PROVIDER || "hf").toLowerCase();

function toVectorLiteral(vec: number[]) {
  return `[${vec.join(",")}]`;
}

export async function retrievePatternsHF(query: string, k = 3) {
  const table =
    provider === "openai"
      ? "public.prompt_patterns"
      : "public.prompt_patterns_hf";

  // For now, only HF/local is implemented (no billing)
  const embedding = await embedTextLocal(query);
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
  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    tags: r.tags || [],
    content: r.content,
    score: Number(r.score ?? 0),
  }));
}
