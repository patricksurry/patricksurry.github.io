---
layout: post
title:  "Work and working with LLMs"
date:   2026-10-04
tags: llm ai work
---

"Building a building" is what linguists call *process–product ambiguity*. Words like "painting," "writing," and "work" itself mean both the activity and the thing produced. In Greek, Aristotle distinguished *energeia*, the being-at-work, from *ergon*, the work produced. In language the ambiguity is harmless and resolved by context.  But this distinction unlocks a key idea for working effectively with LLMs.

The two senses of *work* have different shapes. The work *product* is a state. It's a house, a document, a codebase. It has a history, a change log, but what matters is the end result. Two crews can build the same house in different orders with an identical result. The product is a lossy summary: the scaffolding, the site survey, and the argument about the paint color leave no trace. Mostly that's fine, but means we sometimes forget the how and why.

The work *process* is a graph. The foundation comes before the framing, the framing before the roof, but electrical and plumbing can go in either order or in parallel. Tasks depend on other tasks, with many valid orderings. The actual work follows one specific but largely arbitrary order, a mathematician's *topological sort* or *linearization* of the graph.

The graph is not just a list of steps. It records what depends on what, and who's needed for each step: wiring needs an electrician and an inspector must see it before the drywall goes up. One worker's product is another's input, so each step is really a contract: what it takes in, what it produces, and who approves it. Process can be viewed at different granularity: the graph is full of nested subgraphs. To the general contractor, "wire the house" is a single step, but to the electrician it's dozens.

But LLMs are inherently linear.  They generate a sequence of tokens conditioned on prior context: a transcript. This is fine when we're answering a single question, but it's the wrong shape to organize and manage complex work. You ask for a draft, notice a problem, start fixing it, get distracted by a formatting question, come back to the draft, then realize section three needs more research. Every detour is a fork, a branch in the graph, but the transcript sequentializes them arbitrarily. Twenty minutes later, neither you nor the LLM can easily say what's done, what's blocked, or what's next: the transcript is a jumbled mess.

It gets worse as we try to parallelize across multiple actors: subagents, collaborators, a reviewer who needs to sign off. We might try having one agent "orchestrate" others through its own chat.  But that only moves the problem up a level. The orchestrator's chat is just a linearization of the same graph seen from further out, and the forks still get flattened.

## Work a graph to build artifacts

We need an information architecture that separates three things: the artifacts we build (*product)*; the graph that builds them (*process)*; and the transcript of each step.  The graph has task nodes with dependency edges. A node is a task contract: what the task consumes, what it produces, how we know it's done, who can do the work and who approves the result. Connections express task relationships: this must be finished before that; this is an alternate to that; this is a similar task we worked before.   The graph lets us orchestrate work deteriminstically: which tasks are ready, who can work them, what's blocked on whom. The graph democratizes orchestration. We don't ask how humans should manage agents, we simply ask who holds which role, with what authority. Either agents or humans with permission can add, split, or block a task.

Product is persisted outside the graph as explicit artifacts: a code repository, a report or wiki, a set of drawings.  Product is produced by work process, but is separate from it.  We capture *provenance* by linking each product change to the task that produced it, and vice versa. For any aspect of the finished house, we can walk back to the decisions that put it there.

Within a task, the linear flow still works.  A carpenter framing a wall works in sequence, as does an LLM writing a subroutine. The right task grain is a chunk of work that can be done by one worker, with one context, with no forks that matter to anyone else.  Split a node when it needs branching or multiple actors:  parallel workstreams, need for approval or decision.  On completion each task gets a short summary of what was done and why, with the detailed linear transcript capturing how.

Grain is relative to zoom. Open up any node and it may turn out to be a subgraph of its own: to the client, "build the kitchen" is one task, while to the contractor it's a dozen. So the line between process and product depends on where you stand. The contractor's product is the schedule; the carpenter's is the frame.

## Building experience

A crew gets better with every house it builds. An LLM starts each session from scratch, with the same fixed prompt. Working through a graph not only lets us coordinate work now, but also accumulate experience from it.  Learning builds on an honest record of what happened, which argues for an immutable graph built as a sequence of change events.  The current state is the sum of the changes, but we preserve both successes and failures.  If we planned A, B and C but ended up with A and D we still see the false starts with a summary saying why.

Experience spans both process and product. Start from a product, such as a house we like, and walk back to the process that built it: what it took, how long, what went wrong. Or start from a process step, like "install plumbing," and look at what it produced each time we did it to see how long it took, or which failed inspection. Familiar management practices like post-mortems, playbooks, and style guides fit naturally. Each one is a product distilled from past process that future work can consume. Nobody rereads the whole record, just as nobody rereads every old job file. The history stays complete, but what we consult day to day is the distilled lesson, which keeps a link back to the history that taught it, so it can be checked or retired when circumstances change.

## Work smarter, not harder

With the proliferation of LLM chat interfaces, we're tempted to linearize our work process.  But that's a mistake: LLMs are "just" linear document generators.  Most complex work isn't shaped that way. It's a graph of tasks, worked by many hands with multiple roles, producing artifacts that outlast the process that made them. We should separate the work from the working. Keep products as artifacts, tracked and explicitly published. Manage process as a graph of task contracts shared by people and agents with roles and authority. Use LLMs to execute tasks that are naturally linear.  And treat the growing record of graphs and artifacts as experience,  a resource to draw on and distill that makes the system smarter over time.
