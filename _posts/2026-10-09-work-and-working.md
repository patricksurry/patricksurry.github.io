---
layout: post
title:  "Work and working with LLMs"
date:   2026-10-09
image:
  path: /assets/img/thumbs/agricola-washing.jpg
  alt: Washing ore, from Agricola's De re metallica (1556)
tags: llm ai work
---

"Building a building" is what linguists call *process–product ambiguity*: words like "painting," "writing," and "work" itself name both the activity and the thing it produces. Aristotle separated *energeia*, the being-at-work, from *ergon*, the work produced. In everyday speech, context sorts this out. But in working with LLMs it's a trap. A chat collapses process and product into a single transcript, and complex work doesn't fit that shape.

The two senses of *work* have different shapes. The product is a state: a house, a document, a codebase. Two crews can build the same house in different orders and get an identical result, so the product can't tell you how it was made. The scaffolding, the site survey, and the argument about the paint color leave no trace. The relationship only runs one way: the process, replayed, gives you the product back, but the product gives you nothing of the process.

The process is a graph. The foundation comes before the framing and the framing before the roof, but electrical and plumbing can go in either order or in parallel. Each step is really a contract: what it takes in, what it produces, who can do it, and who approves it. Wiring needs an electrician, and an inspector has to sign off before the drywall goes up. Steps nest, too. To the general contractor, "wire the house" is one step; to the electrician it's dozens. The actual work follows just one of many valid orderings.

LLMs work in transcripts, sequences of tokens conditioned on everything that came before. That's fine for answering a question but the wrong shape for managing complex work. You ask for a draft spec, notice a problem, start fixing it, get distracted by a formatting question, come back to the spec, then realize section three needs more research. Each detour is a branch in the graph, but the transcript interleaves them in whatever order they happened, losing track of how the pieces relate. Half-finished branches are tangled together with no record of what depends on what. Twenty minutes later, neither you nor the LLM can say what's done, what's blocked, or what's next.

More actors make it worse: subagents, collaborators, a reviewer who has to sign off. The obvious answer is a supervisor agent managing others in its own chat, but that only moves the problem up a level. The supervisor's transcript is a flattening of the same graph seen from further out, and the branches still get lost. Agent todo lists are a symptom of the same gap: a flat checklist kept inside a single transcript, with no dependencies or owners, gone when the session ends.

None of this needs new technology. We've managed work-as-graphs for decades with issue trackers, build systems, and version control. Make is literally a graph of tasks with declared inputs and outputs. What's missing is the framing. The chat window has become so compelling that we've let it define the shape of the work, rather than using it as a tool for one part of it.

The fix is to separate three ideas: the product we build, the process graph that builds it, and the transcript recording each step. "Write the spec" is a node with a contract: it consumes an outline, produces a draft, and is done when the editor approves. The formatting question becomes its own small task. "Research section three" splits off as a node that blocks the revision. Each task is worked in its own linear session, which is what LLMs are good at. It ends with a short summary of what was done and why, with the full transcript recording how. The right grain is a task with no forks that matter to anyone besides its owner. When a task needs to branch, wait on an approval, or bring in another actor, split it.

With the graph explicit, orchestration becomes deterministic rather than conversational: which tasks are ready, who can work them, and what's blocked on whom. Agents become first-class participants. The graph doesn't care whether a person or a model works a node; it asks who holds which role, with what authority. Anyone with permission, human or agent, can add a task, split one, or block it pending review.

Product lives as durable artifacts outside the graph: a house, a codebase, a research report. Each change to the product links to the task that made it, and each task links to the changes it made, so for any part of the finished house we can reconstruct the decisions that put it there.

Those links represent *experience*. A crew gets better with every house it builds, but a typical LLM starts each session with no memory of the last job. The process graph documents our decisions both good and bad, so it should be append-only to preserve an honest record. If we planned to tile the bathroom but switched to vinyl after the subfloor failed, we remember why. For agent-worked tasks the record is complete: the transcript holds everything the agent saw and produced. We can start from an outcome we like and walk back to what it took. Or we can start from a recurring step like "install plumbing" and see what it produced each time, how long it took, and what caused failed inspections. Post-mortems, playbooks, and style guides are simply internal work products distilled from past process.

Chat makes it easy to forget the difference between the work and the working. Keep product artifacts separate from process. Run the process as a graph of task contracts, with agents as first-class actors. Give LLMs the linear pieces they're good at. Treat the growing record as experience and learn from it. The *ergon* is what we ship; the *energeia* makes us better at it.
