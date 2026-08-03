# ptedit book → blog series

**Date:** 2026-08-01
**Status:** design approved, ready for planning

## Context

`~/ptedit` is a Python reference implementation of a piece-table text editor, built
as groundwork for a 6502 Forth/assembly port. `~/ptedit/book` is an mdbook "reading
tour" of it — four chapters, ~5,600 words of finished prose:

| chapter | words |
|---------|-------|
| `introduction.md` | 445 |
| `pieces.md` | 2,097 |
| `document.md` | 684 |
| `rendering.md` | 2,399 |

The book is a file-by-file tour written for someone reading the source. This project
re-cuts that material into standalone, idea-first blog posts on Abracadata
(Jekyll + Chirpy, `~/abracadata`).

This is a re-cutting job, not a writing-from-scratch job. The prose exists and is
good; the work is reframing, condensing, and building the visual layer.

## Decisions

1. **The posts replace the book.** The blog becomes canonical. `book/` is retired
   after post 2 ships (see [Retiring the book](#retiring-the-book)).
2. **Static prose first.** Animation is a later, additive phase. No post blocks on JS.
3. **Retro ASCII aesthetic throughout.** Zero mermaid in the series.
4. **Post 3 is deferred**, gated on the Forth/6502 port actually running.

## Series shape

### Post 1 — the piece stack

Source: `pieces.md`, plus the motivation lifted from `introduction.md` ("why a piece
table", the 64KB / 1–2MHz target).

Working title: *"Undo is just a stack pointer"* (not settled).

Structure follows the existing chapter: chain → locations → edits and undo →
coalescing → **the piece stack** → why the 6502 likes it.

The substantive rewrite is the opening. The chapter opens on definitions ("The piece
table is an efficient data structure…"). The post opens on the payoff, which is
already in the text: *nothing is ever freed, nothing ever moves, and undo is
subtracting from a pointer.* The data structure is earned afterward.

Target: ~2,300 words.

### Post 2 — from model to screen

Source: `rendering.md` as the spine, with `document.md` compressed from 684 words to
~350 — just the `Document` API surface and the `on_change` hook, since that hook is
what the rendering material depends on. `Editor` and `Controller` get a paragraph,
not sections. The MVC layering diagram from `introduction.md` moves here, where
`Layout` / `Display` / `Screen` are actually in play.

**Framing:** not a solved design. The piece stack has clarity, elegance, and
historical precedent; the rendering design does not, and the post should say so.
Written as: here is the problem, here is the constraint that kills the obvious
answers, here is where I have got to, here is what I measured and rejected, here is
what is still open. The existing "What we chose not to do" section stops being an
appendix and becomes the point.

Focus is the core idea — **the ladder as the bridge to a memory-mapped display**.
Resist the weeds and the history; those are what condensing removes.

Target: ~1,800–2,000 words. Expect iteration to get there.

### Post 3 — the port (deferred)

Not drafted in this project. Gated on the port running: `forth/` currently has
`piece.fs` (173 lines), `edit.fs` (148), `ptedit.asm` (351), but `render.fs` is a
7-line stub.

Recorded here so posts 1 and 2 can build toward it:

- Minimum: asciinema recording of the port running.
- Stretch: a JS 65C02 emulator in the page, serving the real editor in the browser.

## Diagrams and animation

### Static layer (phase 1)

Current inventory across the four chapters: 4 mermaid blocks, 8 ASCII blocks, 1
generated text trace. No raster images anywhere.

**All 4 mermaid blocks convert to ASCII.** Two are module box-diagrams (intro MVC
layers, rendering "the cast") where mermaid earns nothing. The other two are chain
graphs with dashed side-links, where mermaid's rendering does real work — but those
are exactly the diagrams targeted for animation, and ASCII is the better substrate
for that (see below). Converting all four means no `mermaid: true`, no external
mermaid.js fetch, and one consistent look.

Prior art worth respecting: commit `d7fa828` in `ptedit` built model-generated
Graphviz diagrams (`gen_diagrams.py` → `.dot` → committed SVG, drift-guarded) and it
was subsequently backed out in favour of hand-written mermaid. Do not rebuild that
machinery.

### Animation layer (phase 2)

Three needs, three answers:

| what | tool |
|------|------|
| Real editor sessions — scrolling, soft wrap, guard zones; later the port running | [asciinema-player](https://github.com/asciinema/asciinema-player), self-hosted (`asciinema-player.min.js` + `.css`, Apache-2.0). ptedit is a curses app, so record the real thing. |
| Schematic model diagrams — chain rewiring, stack push/truncate, ladder rungs | asciinema as well. `ptedit/tools/render_frames.py --play` animates model-derived frames in the terminal, so recording it needs no bespoke player. See [Animation approach](#animation-approach-resolved). |
| Command-typing demos | None. This is termynal's niche and the series has no such need. |

**One mechanism covers both rows.** The schematic diagrams were originally going to
need a custom in-page frame player; making the frame generator animate in the terminal
means asciinema records those too. No custom player, no frame JSON shipped to the
browser, one embed mechanism for the series.

**Termynal** ([MIT](https://github.com/ines/termynal), used in the FastAPI/Typer
docs) is the right *look* and the wrong *mechanism* — it animates a typewriter
appending lines, while every diagram here is a region redrawn in a new state. Borrow
its CSS window chrome; do not use its player.

**No D3.** D3 earns its keep binding data to DOM/SVG; ASCII rendering is string
building, where plain JS is less code and less to load. (D3 remains the right tool
for other posts on this site — just not for these diagrams.)

**Progressive enhancement is what makes the phasing safe.** The static diagram is
frame zero of the animation. With JS off, or before phase 2 exists, the post shows a
correct static ASCII diagram. Animation is purely additive — no rewrite of a shipped
post.

### Animation approach (resolved)

The two candidates were **(a)** an interactive JS piece-model the reader types into,
and **(b)** a curated sequence of fixed ASCII frames with play/step/scrub.

**Resolved in favour of (b), fixed frames.** The spike (~125 lines, ported from
`piece.py` and `edit.py`) worked correctly — insert, delete, undo, redo, and chain and
stack renderings that closely match the book's hand-drawn diagrams. It failed on both
of the recorded criteria anyway:

- **Width.** The teaching diagram needs to fit a blog code block, ~80 characters. The
  book's hand-drawn stack diagram is 82. Typing a single six-letter word into a
  thirteen-character document produced **25 stack cells and a 204-character diagram**.
  Even assuming perfect coalescing, one insert measured 92 characters and two edits on
  a 43-character document measured 118 — and the width only ever grows as the reader
  types.
- **Model creep.** Getting anywhere near legible requires coalescing, which is the most
  intricate part of `edit.py`: the compatibility rules, trimming the correct piece from
  the correct side, and the sealed load edit. The spike reached 125 lines *without* it,
  so implementing it would clearly breach the budget.

The underlying reason is more useful than either measurement. The diagram teaches *one
transition* — ur-piece splitting into pre/ins/post, then undo rerouting around it.
Free-form input hands the reader arbitrary states, nearly all of which are wider and
less pointed than the curated one. Interactivity actively competes with the teaching
goal here, which is not what it does on the flowsnake or hexcubes posts, where the
whole subject *is* the space of states.

So a curated frame sequence is the better teaching tool, not a fallback. Post 2's
ladder animation was never a candidate for (a) — a JS ladder means reimplementing soft
wrap and layout — and it likewise uses fixed frames, or asciinema of the real editor.

**How the frames are produced and delivered.** `ptedit/tools/render_frames.py` drives a
real `Document` through a scripted session and renders each step as text, chain and
stack, so the frames cannot disagree with what the editor actually does. `--play`
animates them in the terminal; `asciinema rec` captures that, and the post embeds the
`.cast`. The stack keeps the write-up's horizontal boxed form, wrapped to a column
width, with colour carrying the three cell kinds (Edit, Piece, string) so the boxes
stay narrow and redoable cells can be dimmed.

The static fallback for a JS-disabled reader is the hand-drawn stack diagram already in
post 1's prose — the recording is an enhancement beside it, not a replacement, which is
what satisfies success criterion 3.

Writing the session script surfaced a real bug in the model (coalescing after an undo
left a stale redo that discarded the typing, `ptedit` commit `bcb3366`). That is the
argument for model-derived frames in one line: a hand-drawn animation would have
confidently shown a truncation that wasn't happening.

### Consequence: no generated artifacts

Nothing in the posts is pre-generated at build time:

- `regen.sh` is not carried over to the blog.
- `book/src/generated/chain-trace.txt` is not carried over. Post 1 as drafted omits the
  trace entirely rather than inlining it as a snapshot — it is a debug-repr dump, which
  is code-tour material, and the post reads fine without it.
- No cross-repo sync between `ptedit` and `abracadata`, and no drift guard on the blog
  side.

`tests/test_book_examples.py` stays in `ptedit` as long as `book/` does, and retires
with it.

One option worth keeping for phase 2: the spike model renders correct chain and stack
diagrams, so it could *emit* the curated frame sequence offline, once, guaranteeing the
frames are model-accurate rather than hand-drawn. That is a one-time authoring aid, not
a build dependency, and it does not resurrect any sync obligation.

## Jekyll mechanics

Posts land in `~/abracadata/_posts/YYYY-MM-DD-<slug>.md`, following existing site
conventions:

```yaml
---
layout: post
title:  "..."
date:   YYYY-MM-DD
image:
  path: /assets/img/thumbs/<slug>.png
tags: <space separated, lowercase>
---
```

- Site runs Chirpy 7.6.0 / Jekyll 4.4.1. Custom JS lives in `assets/js/`, matching
  `flowsnake.js`, `colorlegend.js`, etc.
- No `mermaid: true` on any post in this series.
- Each post needs a thumbnail in `assets/img/thumbs/`.
- Existing longform posts run 2,500–4,700 words, so both targets sit comfortably
  inside the site's established range.
- Tags: `ptedit` plus existing site vocabulary as appropriate (e.g. `6502`, `forth`).

## Retiring the book

After post 2 ships — not before, so there is never a gap with neither artifact live:

1. Delete `book/` from `ptedit` on `main`. It remains in git history.
2. Point `ptedit/README.md` at the published posts.
3. `tests/test_book_examples.py` and `book/regen.sh` go with it.

## Out of scope

- Reimplementing the editor in JavaScript. The spike's model, if built, covers
  pieces and edits only.
- Rebuilding generated-vector-diagram machinery (already tried and backed out).
- Cross-repo build automation or submodules.
- Post 3, until the port runs.
- Changes to the ptedit implementation itself. If writing exposes a bug or an
  unclear design, note it in `ptedit/TODO.md`; do not fix it inside this project.

## Success criteria

1. Posts 1 and 2 are published, standalone, and readable by someone who has never
   seen the repo — each opens on an idea, not a definition or a back-reference.
2. Every diagram in both posts is ASCII. No mermaid, no raster images.
3. Both posts are complete and correct with JavaScript disabled — every idea is
   carried by the prose and the static ASCII diagrams. Animation only ever adds
   motion to something already legible, and each asciinema embed sits alongside (not
   instead of) the static diagram or transcript it animates.
4. Post 2 states its open questions as open rather than implying a settled design.
5. `ptedit/README.md` points at the posts, and `book/` is retired.
