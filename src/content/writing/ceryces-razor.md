---
title: "Ceryce's Razor"
description: "Occam's Razor says take the simplest explanation. Mine says take the dumbest — and the two come apart precisely where it matters."
date: 2026-08-09
tags: ['thinking', 'debugging', 'ai']
---

Occam's Razor says that of the competing explanations, you take the simplest one. I have an
amendment.

> The real reason is almost ALWAYS dumber. That's Occam's Razor for ya.

That's what I said at the moment I noticed I'd been leaning on it for years. So: **Ceryce's Razor.**
Occam says pick the simplest. Mine says pick the _dumbest_.

Those sound like the same rule. They aren't, and they come apart exactly where it matters.

## Simplicity doesn't separate the candidates. Flattery does.

When you sit down to explain your own mistake, you usually end up holding two stories.

One casts you as the victim of something subtle: an edge case, a misleading interface, two reasonable
behaviors interacting in an unreasonable way. The other casts you as someone who didn't look in the
obvious place.

Both can be perfectly simple. Occam has nothing to say about which to take, because simplicity isn't
the axis they differ on. What they differ on is how they make you look — and ego is a thumb on a
scale Occam never budgeted for.

So the razor has to cut somewhere else. When two explanations survive on simplicity, **take the
dumber one.** Not out of self-flagellation — out of base rates. Elaborate failures happen. Not
looking happens constantly.

## The one that named it

An AI assistant and I had built a small tool together, a thing I'd wanted for a while. A few days
later, in a fresh session, it told me three times that the tool didn't exist. It was sitting right
there in the repository we were working in — tracked, committed, unremarkably named.

Asked to explain the miss, it produced a mechanism, and the mechanism was _good_: the search tool
skips files that are gitignored, so that directory had been structurally invisible to it. Clean.
Explains everything. Blames nobody in particular — just two sensible behaviors interacting badly.

It was also wrong. Nothing was ignored. The code was tracked, committed, ordinary, in plain sight.
The actual reason is that it never searched the repository it was sitting in.

Here's the part that made me name the principle instead of just laughing about it: within the hour,
the elegant wrong explanation had already been written down as a lesson learned. That's what a tidy
mechanism does. It doesn't just answer the question, it _closes_ it — and then it gets filed as fact,
and everything downstream stands on top of it.

## Three corollaries

**Generate the unflattering hypothesis explicitly, and test it first.** It will not show up on its
own; nothing in you is working to surface it. Write it down as a real candidate, in words, next to
the flattering one. It's usually the cheaper check, too — _did I actually look?_ takes a minute.
_Is there a subtle interaction between two subsystems?_ takes an afternoon, and by the end of that
afternoon you're invested in the answer being yes.

**Hold a diagnosis to the same evidence bar as the original claim.** This is the one everybody skips,
me included. We're careful about the first assertion and credulous about the explanation for why it
was wrong, as though the post-mortem were the lower-stakes document. It's the opposite: the
post-mortem is the one that gets written down and carried forward.

**"I don't know why yet" beats a clean wrong story.** An open question stays open, and anybody can
still come along and solve it. A closed wrong one is a landmine with a friendly label on it.
Unresolved is a perfectly respectable place to leave something. Confidently mislabeled is not.

## Why it's the whole ethos

The thing I keep doing, across every project I've ever cared about, is
[finding a cost I keep paying by hand and building the thing that absorbs it](/about/). Believing my
own flattering diagnoses is one of those costs. This is the cheapest tool I've found for it: one
sentence, applied before the ego finishes loading.

It isn't cynicism about people. Most of the dumb reasons are nobody's fault — attention is finite,
defaults are invisible, and the obvious place is only obvious afterward. It's just where the
probability mass sits. Cut toward the least flattering explanation and you'll be right more often,
and you'll find out sooner when you're not.
