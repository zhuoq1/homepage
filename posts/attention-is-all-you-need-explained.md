# Attention Is All You Need — Explained Visually

The 2017 paper *"Attention Is All You Need"* by Vaswani et al. introduced the Transformer architecture and fundamentally changed the direction of AI research. Every major LLM — GPT, Claude, Gemini, Llama — descends from this architecture. But the paper is dense, and the concepts take time to internalize.

This post is my attempt to explain the Transformer from first principles, building intuition step by step. No PhD required — just basic linear algebra.

## Why Attention? The Problem with RNNs

Before Transformers, sequence models were dominated by RNNs and LSTMs. These models process tokens one at a time, maintaining a hidden state that carries information forward:

```
h_t = f(x_t, h_{t-1})
```

RNNs have two fundamental problems:

1. **Sequential bottleneck:** You can't process token N+1 until you've finished token N. This makes training on long sequences painfully slow — no parallelism.
2. **Vanishing gradients:** Information from early tokens gets diluted as it passes through many recurrent steps. LSTMs mitigate but don't solve this.

The Transformer's key insight: **what if every token could directly attend to every other token, in parallel?**

## Self-Attention: The Core Mechanism

Self-attention answers the question: "For each word in the input, which other words should it pay attention to?"

Here's how it works, step by step:

### Step 1: Create Queries, Keys, and Values

Each input token is embedded into a vector. We then create three vectors from each embedding by multiplying with learned weight matrices:

- **Query (Q):** "What am I looking for?"
- **Key (K):** "What do I contain?"
- **Value (V):** "What information do I contribute?"

```
Q = X · W_Q
K = X · W_K
V = X · W_V
```

### Step 2: Compute Attention Scores

For each query, we compute its compatibility with every key using dot products, then scale by `1/√d_k` (where d_k is the key dimension) to prevent the softmax from saturating:

```
Attention(Q, K, V) = softmax(QK^T / √d_k) · V
```

The result: each token's output is a weighted sum of all values, where the weights are determined by query-key similarity.

### Step 3: Intuition

Imagine the sentence "The cat sat on the mat because it was tired." When processing "it," the attention mechanism should assign high weight to "cat" (the referent) and low weight to "mat." This happens naturally because the query for "it" will have high dot-product similarity with the key for "cat."

## Multi-Head Attention

Instead of having one set of Q/K/V matrices, the Transformer uses multiple "heads" — each head learns a different attention pattern:

- **Head 1** might learn syntactic relations (subject-verb agreement)
- **Head 2** might learn coreference resolution (pronouns → nouns)
- **Head 3** might learn semantic similarity

The outputs of all heads are concatenated and projected back to the model dimension:

```
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) · W_O
```

## Positional Encoding

There's a problem: self-attention is permutation-invariant. It doesn't know the order of tokens. "The cat sat" and "sat cat The" would produce the same attention patterns.

The solution: **positional encodings** — fixed (or learned) vectors added to the input embeddings that encode position information. The original paper uses sinusoidal functions:

```
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

These have the nice property that `PE(pos+k)` can be expressed as a linear function of `PE(pos)`, which helps the model learn relative positions.

## The Full Architecture

The Transformer consists of an encoder and a decoder:

- **Encoder:** N identical layers, each with multi-head self-attention followed by a feed-forward network. Residual connections and layer normalization around each sub-layer.
- **Decoder:** N identical layers, each with three sub-layers: masked self-attention (can't look at future tokens), cross-attention to the encoder output, and a feed-forward network.

Modern LLMs (GPT, Claude, etc.) use **decoder-only** architectures — they drop the encoder and only keep the decoder stack with masked self-attention. This turns out to be simpler and scale better for generative tasks.

## Why It Works So Well

The Transformer's success comes down to a few properties:

- **Parallelism:** All tokens in a sequence can be processed simultaneously during training. This is what enables training on trillion-token corpora.
- **Long-range dependencies:** Every token can directly attend to every other token. The path length between any two positions is O(1), compared to O(N) for RNNs.
- **Scalability:** The architecture scales well with more layers, wider dimensions, and more data. We haven't found the ceiling yet.

## From Transformer to ChatGPT

The journey from the 2017 paper to today's chatbots involved several key innovations beyond the core architecture:

- **GPT (2018):** OpenAI showed that a decoder-only Transformer pre-trained on a large text corpus could be fine-tuned for specific tasks.
- **GPT-2 (2019):** Scale it up and it starts doing zero-shot transfer — no fine-tuning needed.
- **GPT-3 (2020):** Scale it more and few-shot prompting emerges as a viable paradigm.
- **InstructGPT / ChatGPT (2022):** Add RLHF (Reinforcement Learning from Human Feedback) to align the model with user intent.
- **GPT-4 / Claude (2023-2024):** Multi-modal input, longer context windows, better reasoning.

The core architecture hasn't changed that much since 2017. What's changed is scale, training data, and alignment techniques. The Transformer was the right architecture at the right time — simple enough to implement, expressive enough to scale.
