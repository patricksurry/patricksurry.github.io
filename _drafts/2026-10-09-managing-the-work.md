---
layout: post
title:  "Managing the work, not the working"
date:   2026-10-09
tags: llm ai work management
---

In the last post I argued for separating the work from the working: keep products as artifacts, run the process as a graph of task contracts, and give LLMs the linear pieces. That raises an obvious question. If agents are first-class workers in the graph, how should we manage them? We already have an answer, from more than a century of thinking about how to manage people.

Early management theory was obsessed with process. Frederick Taylor's scientific management timed every motion of the shovel and prescribed the one best way to do each job. That works for shoveling, but not for knowledge work. The manager can't know the one best way, and trying to supervise every step buries them. By the 1950s Peter Drucker was arguing for management by objectives: agree on the outcome a person owns, then judge the result, not the motions. Militaries got there earlier. The Prussian idea of *Auftragstaktik*, or mission command, gives subordinates the commander's intent and constraints and leaves the method to the people on the ground, because they can see what the commander can't.

Most of us manage agents like Taylor. We watch the transcript scroll, interrupt mid-step, and correct each move. That's understandable while agents are new and we're unsure what they'll do, but it doesn't scale, and it's the wrong job. A manager who reads every employee's email isn't managing; they're doing everyone's work twice, and badly.

A good team lead works differently. Trust the people and trust the process, and you can ignore the process and focus on the product. The lead's own work is strategy, planning, review, feedback and direction. They decide what to build, break it into tasks with clear contracts, judge what comes back, and say what to do differently. Workers, human or agent, are trusted to follow institutional procedure. And that procedure is itself a product: handbooks, playbooks and style guides distilled from past work. Trust is earned, not assumed. Andy Grove called this *task-relevant maturity*. Someone new to a kind of task needs close, structured supervision, while someone who has done it many times needs only the goal. Agents move along the same curve, one kind of task at a time.

Trust still needs checking. The answer isn't to read transcripts, it's core sampling. Geologists don't excavate a whole site; they drill a narrow core and read the layers. Every so often, pick a finished task and drill down. Why did you do it that way? Why that assumption? Why that source? Toyota's "five whys" is the same instinct: keep asking until you hit either solid ground or a cause worth fixing. Most cores come up clean, and that's the evidence that earns trust. When one doesn't, the fix usually belongs in the playbook the task was following rather than in the task itself, so the lesson reaches all future work.

Sampling only works if there's something to drill into, and that's where the graph earns its keep. Each task node carries a summary of what was done and why, and that's what the manager reads day to day. Below it sits the full transcript, which nobody reads unless they're drilling a core. For agent-worked tasks that record is complete, so a core can go all the way down.

Sampling is also a reminder that process is nested. The manager's process isn't the worker's. My graph has nodes like "decide what to build," "plan the release," and "review the draft." A worker's graph sits inside one of my nodes, and to me it's a single step with a contract and a result. The manager's product is the plan, the review, and the direction; the worker's product is the code or the report. Each level works its own graph and treats the level below as a set of contracts, not a stream of activity. Getting tangled in someone else's transcript is a sign you've slipped down a level and are doing their job instead of yours.

Management theory spent a century learning that you scale by delegating outcomes, not supervising motions. Agents don't change that lesson. They make it urgent, because they produce working faster than anyone can watch it. Manage the work, sample the working, and fix the playbooks rather than the people.
