# From Vector Search to Semantic Understanding

Search is one of the oldest problems in computer science, and one of the most transformed by modern AI. In this post, I'll trace the evolution from keyword matching to semantic understanding, and share practical lessons from building production search systems.

## The Keyword Era: TF-IDF and BM25

For decades, the state of the art was **TF-IDF** (Term Frequency-Inverse Document Frequency) and its successor **BM25**. These algorithms treat documents as bags of words and rank them by statistical relevance.

BM25 works remarkably well for many tasks. It's fast, interpretable, and requires no training data. But it has a fatal flaw: it matches *words*, not *meaning*. A query for "car" won't match documents about "automobiles" unless the word "car" literally appears.

## The Embedding Revolution

Word2Vec (2013) showed that words could be mapped to dense vectors where semantic similarity corresponded to geometric proximity. The famous example:

```
king - man + woman ≈ queen
```

This was the seed of an idea that would eventually transform search: what if we could embed entire documents and queries into the same vector space?

The breakthrough came with transformer-based embedding models like Sentence-BERT (2019) and later models like OpenAI's `text-embedding-ada-002` and `text-embedding-3-large`. These models produce embeddings that capture semantic meaning across entire paragraphs, not just individual words.

## Approximate Nearest Neighbor Search

Once you have embeddings, you need to find the closest ones fast. Brute-force cosine similarity against millions of documents is too slow. Enter ANN (Approximate Nearest Neighbor) algorithms:

- **FAISS** (Facebook/Meta): CPU and GPU-accelerated, supports multiple index types (IVF, HNSW, PQ). The gold standard for research and offline indexing.
- **ScaNN** (Google): Optimized for maximum inner product search, claims 2x speedup over FAISS for equivalent recall.
- **pgvector**: Postgres extension for vector search. Not the fastest, but the simplest if you're already on Postgres.
- **Pinecone / Weaviate / Qdrant**: Managed vector databases. Pay a premium for not having to manage infrastructure.

## Hybrid Search: Best of Both Worlds

In practice, pure vector search often underperforms BM25 for exact-match queries (product codes, names, IDs). The solution is **hybrid search**: run both BM25 and vector search, then merge results.

The merge strategy matters. Reciprocal Rank Fusion (RRF) is the most common:

```
RRF_score(d) = Σ 1 / (k + rank_i(d))
```

Where `k` is a constant (typically 60) and `rank_i(d)` is the rank of document `d` in the i-th ranked list. RRF consistently outperforms linear combination of scores without requiring score calibration.

## Re-ranking: The Quality Multiplier

The biggest quality improvement in modern search pipelines comes from **re-ranking**: use a fast retriever (BM25 + vector) to get 100-200 candidates, then use a slower, more accurate model to re-rank them down to the top 10-20.

Cross-encoder models like Cohere's Rerank and mixedbread's `mxbai-rerank` are purpose-built for this. They take *both* the query and the candidate document as input and output a relevance score — much more accurate than comparing independently-computed embeddings.

## RAG: Search Meets Generation

Retrieval-Augmented Generation (RAG) closes the loop: search finds relevant documents, and an LLM synthesizes them into a coherent answer with citations. This is now the standard architecture for knowledge-base Q&A.

Key RAG design decisions:

- **Chunking strategy.** How you split documents dramatically affects retrieval quality. Semantic chunking (splitting at natural boundaries) beats fixed-size chunks.
- **Query rewriting.** Use an LLM to expand or decompose the user's query before searching. Especially important for complex multi-hop questions.
- **Citation grounding.** Require the LLM to cite specific passages. Without this, RAG systems tend to hallucinate with false confidence.

## What's Next

Search is being redefined in real time. The next frontier includes multi-modal search (finding images by describing them), agentic search (where an agent iteratively refines its query), and personalized search that adapts ranking to individual users. It's an exciting time to work in this space.
