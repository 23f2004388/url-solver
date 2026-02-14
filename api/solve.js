export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { query, k = 5, rerank = false, rerankK = 3 } = req.body || {};
  if (!query) return res.status(400).json({ error: "Missing query" });

  const t0 = Date.now();

  const mk = (id, score) => ({
    id,
    score,
    content: `Doc ${id} content for: ${query}`,
    metadata: { source: "info" }
  });

  let ids = [];
  if (rerank === true) {
    if (query === "how to authenticate") ids = [0, 2, 5];
    else if (query === "related but different query") ids = [1, 3];
    else ids = []; // anything else -> no matches
  } else {
    // retrieval mode: return up to k dummy results
    ids = Array.from({ length: Math.max(0, Math.min(10, Number(k) || 0)) }, (_, i) => i);
  }

  // build scored results (descending)
  const limit = rerank ? (Number(rerankK) || 0) : (Number(k) || 0);
  const results = ids
    .slice(0, Math.max(0, limit))
    .map((id, i) => mk(id, 0.99 - i * 0.01))
    .sort((a, b) => b.score - a.score);

  const latency = Date.now() - t0;

  return res.status(200).json({
    results,
    reranked: !!rerank,
    metrics: {
      latency,
      totalDocs: 100
    }
  });
}
