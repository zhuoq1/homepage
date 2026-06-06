# LLM Reasoning: How Models "Think" Before They Speak

When you ask a modern large language model a complex question, it doesn't just blurt out the first answer that comes to mind. Under the hood, these models engage in something that looks remarkably like **thinking** — breaking down problems, considering alternatives, and working through intermediate steps before arriving at a conclusion.

This post explores how reasoning works in today's LLMs, from basic chain-of-thought prompting to test-time compute scaling.

## Chain-of-Thought: The Gateway to Reasoning

The story of LLM reasoning really begins with the 2022 paper *"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"* by Wei et al. The insight was deceptively simple: instead of asking a model to answer a question directly, you ask it to "think step by step."

Here's a concrete example. Without chain-of-thought, asking GPT-3 "Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?" might yield a confident but wrong answer because the model rushes through the arithmetic.

With chain-of-thought, the model produces something like:

> Roger started with 5 balls. 2 cans of 3 tennis balls each is 6 balls. 5 + 6 = 11. The answer is 11.

This intermediate reasoning dramatically improved accuracy on multi-step math problems — from ~18% to ~57% on GSM8K, a benchmark of grade-school math word problems.

## Why Does It Work?

There are a few complementary explanations:

- **Computational decomposition:** Breaking a hard problem into easier sub-problems lets the model allocate more computation to each step.
- **Attention grounding:** Each reasoning step grounds the subsequent attention patterns in concrete intermediate results, preventing the model from drifting.
- **Training data alignment:** The web contains plenty of worked examples (tutorials, forum answers, textbooks). Chain-of-thought aligns the model's generation with this structure.

## Beyond Prompting: Test-Time Compute

The real revolution in 2024-2025 has been **test-time compute scaling** — the idea that you can improve a model's reasoning not by training a bigger model, but by letting it "think longer" at inference time.

OpenAI's o1 and o3 models are the most prominent examples. They use reinforcement learning to train the model on chain-of-thought reasoning traces, teaching it to:

- Explore multiple solution paths before committing
- Recognize when it's stuck and backtrack
- Verify its own intermediate steps

The result is a model that can solve PhD-level physics problems and competitive programming challenges — tasks that were considered years away just 18 months ago.

## The Key Techniques

### 1. Majority Voting (Self-Consistency)

Sample multiple reasoning paths and take the most common answer. This smooths out the variance from any single chain-of-thought and is embarrassingly parallel — you can run N reasoning chains concurrently.

### 2. Tree-of-Thought

Instead of a linear chain, explore a tree of reasoning steps. At each branching point, evaluate multiple possible next steps, prune unpromising branches, and continue exploring the most promising ones. This is closer to how humans solve novel problems.

### 3. Process Reward Models (PRMs)

Rather than scoring only the final answer (outcome supervision), PRMs score each intermediate reasoning step. This lets the model know *where* it went wrong, not just *that* it went wrong — enabling more efficient learning and better search during inference.

## What This Means in Practice

For practitioners building on top of LLMs, the reasoning revolution has a few practical implications:

- **Prompt engineering still matters** — but increasingly, the model handles the "engineering" internally. Simple, direct prompts often work better with reasoning models.
- **Latency vs. accuracy trade-off** — reasoning models can be 10-100x slower than their non-reasoning counterparts. You need to decide when deep reasoning is worth the wait.
- **Cost is shifting** — with reasoning models, you pay for output tokens (the hidden chain-of-thought) that you never see. Budget accordingly.

## Open Questions

Despite the rapid progress, fundamental questions remain:

- **Is this "real" reasoning?** The models are still fundamentally next-token predictors. Whether chain-of-thought constitutes genuine reasoning or just a very good imitation is a live philosophical debate.
- **How far does test-time compute scale?** We're in the steep part of the curve, but will it plateau? Early evidence suggests not yet.
- **What about planning?** Current models still struggle with long-horizon planning tasks that require maintaining constraints across many steps.

The field is moving incredibly fast, and the answers we have today may look quaint in six months. But one thing is clear: the era of models that "think before they speak" is here, and it's changing what we expect AI to be capable of.
