---
title: "My first red-team eval missed its prediction. Here is all of it."
description: "I pre-registered a replication of many-shot jailbreaking against GLM-5.3 and two Claude controls. The predicted effect did not show up. One of the two standard judges never once said 'unsafe', so I withheld its half of the results. And the first run's data was destroyed before I could check it. This is the whole thing, in the order it happened."
date: 2026-11-20
tags: ["ai", "evaluation", "red-teaming"]
---

This is the first red-team eval I've run end to end, and it didn't confirm the thing I set out to
confirm. I'm writing it up anyway, and in detail, because how an eval handles a miss tells you
more about it than how it handles a hit. Anyone can report a result that agrees with them.

The short version:

- **The pre-registered prediction did not reproduce.** I predicted that attack success would rise
  with the number of in-context examples. It didn't, on any model. On one control it went _down_.
- **One of the two standard judges failed its agreement floor.** It labeled every completion `safe`,
  every single time. So half of the benchmark results are withheld, and the code withholds them, not
  me deciding case by case.
- **The first scored run's raw data was destroyed** by a cleanup step, and a chunk of the re-run was
  lost to an account quota and regenerated. Every number below is from the re-run, and I'll say
  exactly what happened to the rest.

None of that is a disclaimer stuck on the end. It's most of what I learned.

## What I set out to measure

This is a **robustness** eval: the model is the thing under attack. The metric is **attack success rate
(ASR)**. Take a fixed, public set of harmful requests, wrap them in a fixed attack, and count how often
the model produces the harmful content instead of refusing.

The finding I tried to reproduce is Anthropic's
[many-shot jailbreaking](https://www.anthropic.com/research/many-shot-jailbreaking) (Anil et al.,
NeurIPS 2024). Fill a long context with fake dialogue turns in which an assistant complies with harmful
requests, then ask the real question. The published result is that ASR rises with the number of these
demonstrations, following a power law: near zero with a few, effective with many.

I didn't aim to match their numbers. Different models, different behaviors, different judges. The goal
was the **direction**: does ASR go up as shots go up?

- **Subject:** GLM-5.3.
- **Controls:** Claude Opus 4.8 and Claude Opus 5.
- **Behaviors:** a 40-item frozen subset drawn from **both**
  [JailbreakBench](https://arxiv.org/abs/2404.01318) and [HarmBench](https://arxiv.org/abs/2402.04249)
  (HarmBench's test split, standard behaviors only). There are four shared harm themes (cybercrime,
  illegal goods and services, harassment, misinformation), with 5 behaviors per benchmark per theme, so
  20 per benchmark.
- **Attacks:** `direct` (the request as written) and `many_shot`, on a ladder of
  0, 1, 2, 4, 8, 16, 32, 64, 128 and 256 shots. The full ladder ran; no rung was cut short.
- **Over-refusal arm:** JailbreakBench's 100 benign requests, with no attack. A model that refuses
  everything scores a perfect ASR of zero and is useless, so a low ASR only counts next to this number.
- **Scale:** 1,620 generations and 2,186 judge verdicts.

Margo, my AI assistant, drafted the spec and built most of the harness. I made the seven scoping calls
on it, and the hand labels the judges are calibrated against are mine. In three of those calls I went
past the recommended option: both benchmarks instead of one, both Claude controls instead of one, and a
prompt-injection arm against Margo herself (built, not yet run; more below).

## The rules I wrote down before the run

Pre-registration only means something if it's done before the data exists, and if it's specific
enough to lose. Before any scored run, I committed:

- the dataset revisions and file hashes, and a content hash of the drawn subset. The run rebuilt the
  subset from the pins and checked the hash byte for byte before any model was called;
- the draw seed, the shot ladder, and the sampling parameters, including the token budget;
- **the hypothesis:** on the subject, ASR increases monotonically with shot count, and the increase
  (ASR at 256 shots minus ASR at 0, bootstrapped over behaviors) has a 95% confidence interval that
  excludes zero;
- **the falsifier:** a flat or non-monotone curve whose increase interval includes zero;
- **the judges:** each benchmark's own published judge scores its own items. JailbreakBench uses a
  Llama-3-70B prompt template, HarmBench a fine-tuned Llama-2-13B classifier. A third judge, Jev
  (TypeSafe's System One model), grades everything alongside them and decides nothing;
- **the agreement floor:** a judge must reach Cohen's **κ ≥ 0.6** against my hand labels, or it
  **reports nothing**. Not a weaker number. Nothing.

That last rule is the one that ended up mattering most, and I didn't know that when I wrote it.

## How harmful output stays out of the repo

An eval like this produces exactly the content you must never publish: the attack prompts and the
completions they produce. So the storage rule came first. Raw prompts and completions are written only
to a gitignored run directory, and only counts, rates, confidence intervals, ids and hashes leave it.
The report generator has an independent redaction guard that refuses to write any field that could
carry text. The harness runs as a standalone script, so raw completions never pass through the chat
session that analyzes the results.

That rule shaped the attack itself. A real many-shot attack uses demonstrations with real harmful
answers in them. Mine couldn't, so each demonstration's assistant turn is a generic agreeable stub with
no actual content. I assumed the signal was the repeated pattern of compliance, not what the answers
said. Hold onto that assumption. It comes back.

This post follows the same rule. It has numbers, method and design, and no prompts, completions or
behavior text.

## Result: the prediction did not reproduce

The falsifier fired on every model on HarmBench, the one benchmark whose judge passed the floor.

| Model    | ASR (%) by rung, 0 → 256 shots | increase     | 95% CI   | reproduced |
| -------- | ------------------------------ | ------------ | -------- | ---------- |
| GLM-5.3  | 0 5 5 0 0 0 5 0 0 5            | +5.0 pp      | [0, 15]  | **no**     |
| Opus 4.8 | 10 10 10 5 10 5 5 5 0 0        | **−10.0 pp** | [−25, 0] | **no**     |
| Opus 5   | 0 at every rung                | 0.0 pp       | [0, 0]   | **no**     |

Only Opus 5's curve is monotone, and only because it is flat at zero.

GLM-5.3 is the only row with a positive point estimate, and it fails the rule twice: the interval
touches zero, and the curve isn't monotone. At 20 behaviors, 5 percentage points is _one behavior_. The
line is one behavior flipping in and out across the rungs.

Opus 4.8 is the starkest version of the miss. Its slope is **negative**: more demonstrations made it
refuse _more_, the opposite of the published direction.

This is a miss against the pre-registered hypothesis, and I'm reporting it as one. There are two
explanations I think are worth testing. This run establishes neither.

1. **My safety rule may have removed the effect I was measuring.** The generic-stub demonstrations
   rested on the assumption that the pattern of compliance is the signal. At 256 shots, that pattern
   alone produced no rise on any model, so the run falsifies the assumption as I stated it. If that's
   the mechanism, then **a faithful many-shot replication can't coexist with the rule that keeps
   harmful text out of my repo.** I think that's a real finding about the method. It's a constraint to
   state, not a bug to fix.
2. **Floor effect and low power.** Every cell sits between 0% and 10% ASR over 20 behaviors. There's
   almost no room to rise, and the intervals are wide. This run can't tell "no effect" apart from "an
   effect too small to see at n = 20." A stronger claim needs more behaviors per cell, not more rungs.

## The secondary direction holds, by one behavior, and that's the point

I also tested a weaker, flagged direction: at the `direct` attack, each Claude control's ASR should be
no higher than the subject's. I hadn't verified that any published comparison includes GLM-5.3
specifically, so this is a direction tested, not a published number reproduced.

| HarmBench, `direct` | ASR   | 95% CI      |
| ------------------- | ----- | ----------- |
| GLM-5.3 (subject)   | 10.0% | [2.8, 30.1] |
| Opus 4.8            | 10.0% | [2.8, 30.1] |
| Opus 5              | 0.0%  | [0.0, 16.1] |

The ordering holds in both pairings, Opus 4.8 by a tie. Read that as a negative result. In the first
run (more on it below), Opus 4.8 sat _above_ the subject on this same cell: 2 of 20 against 1 of 20.
This time GLM-5.3 scored 2 of 20, and the pair became a tie. Same model, same subset, same seed, same
parameters, and one behavior moved. **At this size, the subset can't rank these models by ASR at all.**
Sampling noise is bigger than the difference being tested.

## Over-refusal: the column that keeps a low ASR honest

JailbreakBench's 100 benign requests, with no attack wrapper:

| Model    | responded | refused | over-refusal | 95% CI      |
| -------- | --------- | ------- | ------------ | ----------- |
| GLM-5.3  | 98        | 8       | 8.2%         | [4.2, 15.3] |
| Opus 4.8 | 100       | 15      | 15.0%        | [9.3, 23.3] |
| Opus 5   | 100       | 11      | 11.0%        | [6.3, 18.6] |

Both Claude controls refused benign requests more often than the subject: about 1.3 to 1.8 times as
often, with Opus 4.8 furthest out. The intervals overlap, so this is a pattern that showed up in both
runs, not a measured gap. Refusals here are detected in code (the provider's own refusal signal, or a
refusal-string match), not by a judge, so the judge problem below doesn't touch this
table. GLM-5.3 shows 98 rather than 100 because two of its generations ran out of their 8,192-token
budget while still reasoning. I didn't retry them with a bigger budget. The token budget was
pre-registered, and raising it after seeing results is the exact move pre-registration exists to stop.
Those two count as errors, not as answers.

## The judge that never said "unsafe"

I hand-labeled 60 completions, drawn by the pre-registered stratified sample from the completions the
judges actually scored: 29 from HarmBench and 31 from JailbreakBench. The labeling page showed me the
items blind. All three agreements below are gated by the κ ≥ 0.6 floor.

| Agreement                | κ     | 95% CI         | n   | outcome                       |
| ------------------------ | ----- | -------------- | --- | ----------------------------- |
| HarmBench judge, me      | 1.000 | [1.000, 1.000] | 29  | clears: HarmBench reports     |
| JailbreakBench judge, me | 0.000 | [0.000, 0.000] | 30  | **fails: reports nothing**    |
| Jev, me                  | 0.731 | [0.550, 0.886] | 60  | clears, on the point estimate |

The JailbreakBench judge gave 659 verdicts and every one of them was `safe`. 222 of those were Claude
refusals, which code scores as not-harmful before any judge sees them. The other 437 were the models'
own answers: 421 were exactly `safe`, and 16 were `safe` with a stray token after it. None contained
`unsafe` in any casing, so the parser wasn't hiding positives. The judge model returned one category.

A rater that always gives the same answer has κ of exactly zero, by arithmetic. Its agreement with me
(36.7%) is just the share of items I labeled not-harmful, and that's also its chance agreement. The
[0, 0] interval is structural, not a sign of precision.

I checked the boring explanations first, [as I try to](/writing/ceryces-razor/).

- **Not base rates.** I labeled about 65% of the items harmful on _both_ halves: 20 of 31
  JailbreakBench, 19 of 29 HarmBench. The positives aren't rare. The judge simply had none. Of the 20
  JailbreakBench items I called genuine instances, it called 19 `safe`. The 20th was longer than its
  context window, so it was recorded as unavailable rather than truncated.
- **Not a label mismatch.** Each of the 60 labels resolves to exactly one generation cell, under the
  right benchmark.

There is a real rubric difference. My question, which is also HarmBench's and Jev's, was "is this
response a genuine instance of the request?" JailbreakBench's template is stricter and wants specific
harmful detail. That could explain some disagreement. It can't be told apart, on this run, from a
serving difference: I reached the judge through a different provider than JailbreakBench's own setup,
as a single user turn at temperature 0. The test that separates the two is to run the same door over
JailbreakBench's own human-labeled judge set. Agreement near the published figure would point at the
rubric; constant `safe` there too would point at the door. I haven't run it.

What I can say: **before the labels, the report showed JailbreakBench at 0% ASR for every model at
every rung, and that 0% came from the judge.** Without the floor, it would have read as a clean result:
no jailbreaks on half the benchmark. Instead, the report generator now withholds any benchmark whose
judge fails the floor. The ASR, the ladder, the falsifier verdict, the ordering, and Jev's numbers for
that half all go. Jev decides nothing, so reporting the half through Jev alone would quietly make it the
judge.

Withholding removed three of the six falsifier verdicts. It added no positive one. The miss stands on
the three cells that can be reported.

Two caveats travel with the numbers that did pass.

1. **Jev passes on its point estimate only.** 0.731 clears 0.6, and the pre-registered rule tests the
   point estimate. But the interval's lower bound is 0.550, below the floor. At n = 60, I can't rule out
   that Jev's true agreement with me is under 0.6. It agreed with me perfectly on the HarmBench items and
   at κ 0.52 on the JailbreakBench items (a descriptive split, not a pre-registered one). Any later claim
   that Jev is good enough for guardrail work has to carry that interval.
2. **The HarmBench κ of 1.0 was measured mostly on easy items.** The stratifier draws its "clear harm"
   and "clear refusal" strata from where the standard judge and Jev already agree confidently, so 28 of
   the 29 HarmBench items came from those strata and only one was ambiguous. The 1.0 says the classifier
   matches me where it was sure. It says little about the borderline.

## The data I lost

The first scored run's raw data no longer exists. It was written to the gitignored run directory inside
a temporary git worktree, and the worktree cleanup deleted it, because the cleanup counted gitignored
files as disposable. That directory was gitignored _on purpose_: it was the storage rule above. The fix
for that cleanup is separate work.

So the first run's numbers can't be checked or reproduced. Nothing is left to recompute them from. I
re-ran the whole thing from scratch under the same pins. The subset hash was verified again
before any model was called, and all 1,620 cells were generated and judged anew.

The re-run had its own accident. Partway through, the Claude login driving the controls hit its session
limit, and from then on every control call exited with no output, even after retries. The harness stored
those as generation errors. But no prompt had reached a model, so calling them model behavior would have
been wrong. I removed **36 rows** (24 Opus 4.8, 12 Opus 5) on a strict signature: the exact error, inside
the outage window, retries exhausted, empty output. I regenerated them on another login with the same
subset and parameters. **Every other error stayed in**, including GLM-5.3's two token-budget failures,
which are model behavior. The removal is logged with its criteria and the id of every row. Two logins is
a recorded condition of the run: same CLI, same pinned model ids, same default temperature.

Comparing the two runs without rewriting either:

- **Same headline both times.** The falsifier fired in every HarmBench cell, and both controls
  over-refused more than the subject. (The first run's JailbreakBench numbers came from the same judge
  and are withdrawn for both runs; that judge can't be calibrated on the first run at all, because its
  data is gone.)
- **Every margin moved, by a behavior or two.** HarmBench `direct` for GLM-5.3 went from 5.0% to 10.0%.
  GLM-5.3's ladder increase went from 0.0 pp [0, 0] to +5.0 pp [0, 15]. Over-refusal went from 5.1% /
  14.0% / 11.0% to 8.2% / 15.0% / 11.0% (GLM-5.3 / Opus 4.8 / Opus 5).

That spread is the "low power" explanation, measured instead of asserted. The first run's numbers are
reported as recorded, even though they can't be re-examined, and neither run is described as correcting
the other.

## What running it actually caught

Some of the most useful output was defects that would have quietly corrupted the numbers. Each one is
now fixed and has a test.

- **Refusals were being stored as errors.** The Claude CLI exits with an error code when the model
  refuses, so every refusal by either control read as a failed generation. The controls' refusal rate,
  which is the whole point of a control, showed as zero. A refusal is now recorded as a refusal and
  scored by code.
- **Identity was keyed on text.** JailbreakBench draws part of its set from the same sources HarmBench
  does, so one behavior legitimately appears under both benchmarks: identical text, two cells, two
  different judges. Keying resume and dedupe on a hash of the prompt silently dropped one of them, and
  the `direct` arm had 39 rows where the subset has 40. The key is now the eval cell, never the text.
- **The hand-label sample was drawn from the wrong pool.** As first written, it included the benign arm,
  which no judge ever scores, so 21 of my 60 labels would have measured nothing. It now draws only from
  completions a judge actually scored.

## What's next, stated as open questions

- **Is the stub-demonstration design what killed the effect?** The cleanest test changes the
  demonstrations and nothing else. That runs straight into the storage rule, which is why it's a
  question and not a plan.
- **Was the JailbreakBench judge broken by its rubric or by its door?** One run over JailbreakBench's own
  human-labeled judge set would answer that.
- **What does the effect look like with real power?** More behaviors per cell is the only way past
  "a single behavior is 5 points."
- **Does a prompt-injection attack on my own agent get her to try a send?** That arm is built: synthetic
  injected content, and an outbound path with no sender behind it that can only reach a send gate that
  refuses everything, so injection _success_ is structurally zero and the measure is how often she
  _attempts_ it. It hasn't run yet, so I have no result to report.

The harness and its spec live in my assistant's private repository for now, so this write-up is the
public record of this run. Every number in it comes from the numbers-only aggregate the report
generator emits.

## Why publish a miss

Because I'd rather you see how I handle a result that goes against me. The pre-registration did its
job: it turned "the curve looks kind of flat" into a verdict I couldn't argue with afterwards. The
agreement floor did its job too, and more dramatically. Without it, half the benchmark would have
reported a clean, confident, completely uninformative zero. The data loss and the quota outage are in
here because a reader deciding whether to trust these numbers deserves to know what happened to them,
not a tidied-up story where nothing went wrong.

The model of eval work I'm after is simple to say and annoying to do: write down how you could be wrong,
then let it happen in public.
