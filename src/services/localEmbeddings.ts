import { pipeline } from "@xenova/transformers";

let extractor: any;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

export async function embedTextLocal(text: string): Promise<number[]> {
  const model = await getExtractor();

  const out = await model(text, { pooling: "mean", normalize: true });
  return Array.from(out.data) as number[];
}