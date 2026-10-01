---
title: 'Coryphaeus: the conductor loses, and the pool is most of the reason'
description: "I'm reproducing a published recipe — a small model that routes work to other models instead of answering — and adding a world model over worker competence. The first honest number is negative: 11.3 points below the best single worker. Most of that deficit isn't the routing."
date: 2026-08-09
tags: ['ai', 'research', 'reinforcement-learning']
---

I have a research project called **Coryphaeus** — κορυφαῖος, the leader of the Greek chorus: the one
who directs it and speaks for it without being the chorus. It is a small language model that never
answers a question.

It reads the question and emits a _workflow_: up to five steps, each one a natural-language subtask
assigned to a named worker model, each declaring which earlier results it is allowed to see. Other
models do the answering. The conductor learns only how to route.

The first real measurement came back negative. The prompted conductor scored **11.3 points below the
best single worker in its pool**, and when I decomposed the loss, only a small part of it was about
routing being hard. I want to write that down properly, because a negative result reported cleanly is
worth more than a promising one reported loosely — and because the decomposition turned out to be
more interesting than the verdict.

Everything here comes out of a public repo:
[github.com/kumouri/ai-dev](https://github.com/kumouri/ai-dev), under `coryphaeus/`. Every number
below is in `runs/`.

## The work I'm reproducing

The recipe is from **"Learning to Orchestrate Agents in Natural Language with the Conductor"** —
Stefan Nielsen, Edoardo Cetin, Peter Schwendeman, Qi Sun, Jinglue Xu and Yujin Tang, at Sakana AI, to
appear at ICLR 2026 ([arXiv:2512.04388](https://arxiv.org/abs/2512.04388)). A 7B policy trained with
reinforcement learning to coordinate other models rather than answer itself: it learns the
communication topology _and_ the instructions it writes for each worker, reports gains "beyond any
individual worker" with state-of-the-art results on LiveCodeBench and GPQA, trains over randomised
agent pools so it generalises to worker sets it hasn't seen, and — the part I find most interesting —
can assign work to _itself_, which produces recursive topologies.

**An honesty note about that paragraph, because it constrains everything downstream.** I have
verified that description against the paper's **abstract**, and no further. Reading the full text is
still an open item on my own roadmap, deliberately placed before I freeze my reward function. So I
describe their method only as deeply as I have actually checked it, and where a sharper comparison
would need details of how they did it, I don't make one. Go read their paper; this is not a substitute
for it, and it isn't trying to be. No weights or code from that work are used here — the weights
aren't published. I'm re-implementing the described recipe from scratch, in the open, and then
departing from it.

## The departure: a world model over workers

In the paper as I understand it, the conductor learns which-worker-for-what _implicitly_, as a side
effect of the policy gradient. Nothing in it predicts, in advance, whether a given worker will succeed
at a given subtask.

The contribution I'm after is making that explicit:

> **W(subtask, worker) → P(success), expected cost, expected latency**

A predictor trained on routing telemetry, used three ways: **in-context**, so the conductor sees
predicted success next to the static catalogue and routes informed rather than only reinforced;
**to prune rollouts**, skipping the ones the model is confident are dead so the concurrency budget
goes where the gradient actually is; and eventually — carefully, and last — **in the reward**, because
a routing decision that beats the world model's expectation is more interesting than one that got
lucky.

The design consequence showed up on day one. Every step of every rollout is logged as
`(subtask, worker, outcome, cost, latency)` from the very first run, so the dataset is a **by-product
of the harness** rather than a data-collection project I'd have to fund later. That is why I have
oracle ceilings and per-worker pass rates to show you at all — they fell out of telemetry I was
already writing.

It also has to clear a low bar honestly: a learned W must beat the trivial baseline of per-worker
marginal accuracy, or it isn't worth the code.

## Phase 0: don't aim a GPU-hour at an unvalidated target

A reinforcement-learning run optimises whatever the reward says, very effectively, whether or not the
reward measures anything you want. So I gave myself a rule before writing any training code: **until a
merely _prompted_ conductor beats the best single worker in its pool on a real evaluation slice, a
GPU-hour is aimed at an unvalidated target.**

That's the whole spine of phase 0. Build every component the trainer will reuse — strict parser,
worker registry, concurrency governor, orchestrator, verified-math reward, telemetry — and then
produce one number: does routing pay at all, before training?

The hypothesis, written down in advance: _a prompted small conductor over a heterogeneous worker pool
beats the best single worker in that pool on a fixed slice._ If true, training has a validated target.
If false, that's cheaper to learn now than after a night of gradient descent, and it tells you where to
look.

## The number came back negative

The slice: the first 400 questions of **MATH500**, four arms — three workers solo, plus the prompted
conductor. The pool was three local Qwen models on one 4090 (2B / 4B / 9B, called `q2` / `q4` / `q9`);
the conductor was the 4B, prompted, one sample per question, temperature 0.8. Answers are scored by
symbolic math equivalence, not string match. A workflow that doesn't parse scores zero, on purpose —
more on that below.

The run was **stopped at 150–175 questions per arm** to free the GPU for training, so all four arms are
scored on the 150 questions every arm reached:

| arm                       | accuracy  | unparsed | accuracy on parsed | latency/question |
| ------------------------- | --------- | -------- | ------------------ | ---------------- |
| `q9` (9B)                 | **58.7%** | —        | 58.7%              | 32.4 s           |
| `q4` (4B)                 | 55.3%     | —        | 55.3%              | 25.2 s           |
| `q2` (2B)                 | 38.0%     | —        | 38.0%              | 22.9 s           |
| **conductor** (prompted, `q4`) | 47.3% | 14.7%    | **55.5%**          | **19.0 s**       |

**−11.3 points against the best single worker.** Recomputed at every 25-question boundary from n=50
onward, the gap ranged from −8.8 to −12.0 — so it isn't an artefact of where the run stopped.

On stopping early: that's only corrupting when it's _favourable_ — when you stop because you like what
you see. Here the constraint was hardware and the result runs against my hypothesis, so there's no
selection pressure in the number's favour. The pre-registered n was 400. This is n=150, and I'd rather
say so in the table than in a footnote.

## Three failures wearing one number

Because every worker was scored on every question, I can compute an **oracle ceiling**: what a perfect
router would have scored on this pool.

- **51 of the 150 questions (34%) were solved by no worker in the pool.** Ceiling = 99/150 = **66.0%**.
- `q9` alone gets **58.7%**. So the _entire_ prize available to perfect routing is **+7.3 points**.
- Of the 99 solvable questions, the conductor got **70 right**. Looking at where it actually sent them:
  71 of the 99 reached at least one worker that solves that question solo, 12 went only to workers that
  don't, and **16 never produced a parseable workflow at all**.

So the −11.3 decomposes into three separate problems, and only one of them is "routing is hard".

**1. Formatting (14.7%).** A malformed workflow scores zero. On the rollouts that _did_ parse, the
conductor scored 55.5% — level with the 4B doing it alone. I don't repair malformed output with a
model, and I won't: under RL the policy only learns to emit parseable workflows if unparseable ones
cost it reward, and a repair step launders exactly the error the policy needs to feel. Every failure
gets a named reason code (`json_decode`, `too_many_steps`, `unknown_worker`, `forward_dep`…) and those
codes are first-class training metrics.

**2. Routing (worth at most +7.3 points here).** It used `q4` on 63 of the 150 questions and `q9` on 63
— an almost even split, when `q9` is plainly the better worker. That's shuffling, not choosing. It also
barely decomposed anything: 116 of its 128 parseable workflows were a single step. Real, and learnable
— this is what training is _for_.

**3. The pool (worth far more).** A ceiling only 7.3 points above the best single worker means these
three same-family models are **too correlated for routing to pay**. No conductor, trained or not, wins
much here. A routing experiment on a pool with no headroom cannot succeed, and it fails looking exactly
like a conductor failure.

One thing did land on the positive side: the conductor was the **fastest** arm — 19.0 s per question
against `q9`'s 32.4 s — by pushing work onto cheaper models. The cost-efficiency half of the paper's
claim shows up even where the accuracy half doesn't.

## A bigger pool moves the ceiling. Not much.

If pool correlation is the binding constraint, the obvious next move is a pool that isn't correlated.
So I built two, both measured on the same first-400 slice of MATH500.

**Six pinned per-token seats (8B–70B, four model lineages, one provider each):**

| worker                    | solo accuracy | cost for 400 questions |
| ------------------------- | ------------- | ---------------------- |
| phi-4 (14B)               | **70.5%**     | $0.033                 |
| Llama 3.3 (70B)           | 64.8%         | $0.086                 |
| Mistral Small (24B)       | 50.0%         | $0.061                 |
| Qwen3 (14B)               | 41.8%         | $0.168                 |
| Qwen3 (32B)               | 37.3%         | $0.203                 |
| Llama 3.1 (8B)            | 35.0%         | $0.008                 |

Oracle ceiling: **78.5%** — 86 of 400 questions solved by nobody. Best single worker: 70.5%. Headroom
for perfect routing: **+8.0 points**. The 14B is also the flagship _and_ 2.6× cheaper than the 70B it
beats, which is its own small lesson about parameter count.

**A separate flat-rate pool (five Qwen seats, 7B–72B), same 400 questions:** best single worker 73.0%
(the 32B), oracle ceiling **80.75%**, headroom **+7.8 points**.

Three pools now — 2B to 72B, four lineages, two providers, one local card and two clouds — and the
entire prize for _perfect_ routing keeps coming out at **7 to 8 points**. That is the most durable
finding I have so far, and it's a constraint on the whole research direction, not a detail of one run.

Two configuration lessons from that work, both of which look like model quality if you don't check:

- **A token cap can manufacture incompetence.** Both Qwen3 seats burn reasoning tokens that can't be
  disabled on that host. Under a generic 1024-token cap they scored **4.8% and 12.2%** — they were being
  guillotined mid-thought. A per-seat floor of 2048 recovered them to **37.3% and 41.8%**, and they're
  still truncating their hardest chains. An easy smoke test cannot catch this; only a hard corpus can.
- **A worker is a served system, not a model name.** The same Qwen3-32B scored **72.3%** on the
  flat-rate provider, where all 400 calls returned an answer averaging ~492 output tokens, and
  **37.3%** on a pinned fp8 seat elsewhere, where **191 of 400 calls returned nothing but reasoning
  tokens** despite the disable flag being sent. I'm not calling that a quantization result — the two
  systems differ in more than weights, and the honest description is that one of them answered and one
  of them mostly didn't.

And the conductor arm on the big pool? A prompted Llama-3.1-8B conductor scored **34.0%** against
phi-4's 70.5% — while correctly identifying the flagship: it put phi-4 in the workflow on **289 of the
400 questions**, from the catalogue text alone. It lost anyway, because a quarter of its workflows
didn't parse, and it spent **$0.26 to phi-4-solo's $0.033** — eight times the money to route work to a
worker you could simply have called.

## Then what were the GPU-hours for?

Fair question, given a repo whose README says "deliberately before any training" and whose `runs/`
directory contains a stack of GRPO runs. Here's the honest accounting.

None of those runs was an attempt to claim a trained conductor beats anything. Every one of them was
aimed at the two things that have to be true _before_ a training result would mean anything — does the
pipeline work, and does the data carry a gradient — and each died of a specific, named cause that is
now a pinned test:

- **Run 1** died at step 3 of 1000, with steps stretching 9 → 22 → 35 minutes. The card looked idle
  while holding memory: Windows had let CUDA oversubscribe into shared system memory instead of
  failing, so the model loaded into a silent 10–30× slowdown. It was born spilled, not degraded later.
- **Run 2** was born into the same squeeze and stopped by hand. **Run 3** ran healthy for 17 steps and
  then died on an illegal memory access inside generation with no checkpoint written — which is why
  checkpointing every 10 steps is now load-bearing rather than tidy.
- **Run 3's more valuable finding: 40% of its steps taught nothing.** The advantage in group-relative
  RL comes from _disagreement_ within a group of rollouts on the same question. On 4 of 10 surviving
  steps, every rollout scored identically, so the advantage was exactly zero. The reward wasn't broken;
  the **questions** were. A question every worker solves — or none solves — contains no routing
  decision.

That sent me to the data layer, where the real result of this phase lives. I built a calibration pass
that probes each candidate question with a weak and a strong worker and keeps the disagreements, then
gated training on it: run a 20-step probe first, and ship the full run only if fewer than 20% of its
groups come back with zero variance. **GSM8K failed that gate four times** — 33%, then 20%, then 22%,
and finally 30% measured on rented hardware. (The bar is strict-less-than, so a tie goes to not
shipping. I wrote that rule before I needed it, which is the only time you can.) The refilters between
attempts were free, because the probe rates are cached to disk — but none of them could clear the bar,
for a reason no filter can fix: the genuinely contested middle of GSM8K, for a pool of 14B+ workers, is
roughly **7% of the corpus**. No band drawn over measured pass rates manufactures contest that isn't
there. Verdict: stop filtering, change corpus.

The same filter over the same 500 MATH questions then split my two remote pools cleanly — **115
questions kept and a 15% PASS** for one, versus only **33** genuinely contested questions for the
other, which I did not train on, because 200 steps over 33 questions is memorisation with extra steps.
Same questions, same filter, opposite verdicts: how contested a corpus is turns out to be a property of
the corpus _and_ the pool together, which is not how I'd been thinking about training data.

There's a smaller lesson buried in that work that I enjoyed rather more than I should have. My first
filter probed each question **once** and kept the disagreements. Later I re-probed six times and found
that of the too-easy questions that wasted training steps, **22 out of 22** were questions where the
weak worker had simply got unlucky on a single sample. The whole filter was a coin flipped once per
question. My first hypothesis had been an elegant one about probe/training configuration mismatch; the
[dumber explanation](/writing/ceryces-razor/) was right, as usual.

So: one checkpoint exists, trained for 200 steps on the calibrated set. **Its evaluation against the
phase-0 table hasn't run yet** — what I have is the pre-training line, the untrained 1.5B policy
scoring **28.75%** as a conductor on that pool's 400 questions with half its workflows unparseable.
Until the trained checkpoint is scored on the same slice, I have no trained-conductor result, and I'm
not going to imply one. The negative number at the top of this post is still the headline, and it is
still the only accuracy verdict this project has produced.

One encouraging sign, though, from a run that died for other reasons: within a single training run the
parse-failure rate fell from 32% to 20% between the first and second halves of its rollouts. That's the
first direct evidence the training bends the thing it should bend first — and formatting was, per phase
0, the conductor's largest single deficit.

## What would change the answer

Stated as open questions, because they are open:

- **Is there a pool with real headroom?** Every pool I've measured offers 7–8 points to a perfect
  router. The routing hypothesis needs workers whose competence is genuinely _asymmetric_ — a
  specialist that's the best available on its niche and mediocre elsewhere. Same-family models scaled up
  and down don't provide that. Whether such a pool exists cheaply, on math, is not yet answered. It may
  be that the domain is wrong rather than the pool: verifiable math is convenient for the reward and
  might be exactly where worker competence is least differentiated.
- **Can the world model beat the trivial baseline?** _Know when phi-4 fails_ is the concrete version of
  this project's question on the current pool. If W can't beat per-worker marginal accuracy, it isn't
  worth building, and I'd rather find that out with a small predictor over existing telemetry than after
  wiring it into a reward.
- **How much of the reward is infrastructure noise?** A failed rollout scores zero, and zero is how the
  policy learns "routing there was a bad choice" — so a provider hiccup is indistinguishable, to the
  gradient, from a genuinely poor decision. Transient failures are retried rather than scored, which
  handles the common case, but I've deliberately not chosen between raising retries, resampling the
  question, and simply measuring the rate first. Measure first is the only defensible answer while the
  size of the problem is unknown.
- **Does the cost story survive contact with accuracy?** The conductor is consistently the _fastest_
  arm and, on the local pool, free. On the per-token pool it cost 8× the best single worker. Those want
  reconciling, and the reward doesn't price cost at all yet — deliberately, because a cost term added
  before accuracy works cannot be debugged.

## Why I'm publishing the loss

Because the alternative is worse. A hedged negative result is the least credible thing I could put my
name on; a clean one is among the most. And the decomposition is the actual product here: "the
conductor lost by 11.3 points" is a headline, but "34% of the questions were solved by nobody, the
entire routing prize was 7.3 points, and 14.7% of the deficit was JSON" is a research direction.

The thing I keep circling back to is that I only know any of this because the harness was built to
record it before there was anything to record. The oracle ceiling wasn't a planned experiment; it was
one query away because every worker was scored on every question and the telemetry kept it. The
cheapest measurement in this whole project turned out to be the one that reframed it.

Code, docs, roadmap and every run above: [github.com/kumouri/ai-dev](https://github.com/kumouri/ai-dev)
(`coryphaeus/`). The three runs the numbers come from are
`20260729T215428Z-math500-400` (phase-0 local baseline), `20260731T075237Z-or-solo-floored` (the
per-token pool) and `20260801T033102Z-fl-solo` (the flat-rate pool), and the running argument with
myself is in `docs/ROADMAP.md`.
