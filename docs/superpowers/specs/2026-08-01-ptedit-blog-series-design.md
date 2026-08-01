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
| Schematic model diagrams — chain rewiring, stack push/truncate, ladder rungs | Custom, in-page. See [the open question](#open-question-resolved-by-spike). |
| Command-typing demos | None. This is termynal's niche and the series has no such need. |

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

### Open question, resolved by spike

Post 1's animation could be either:

- **(a) Interactive JS piece-model** — ~150 lines implementing pieces, edits,
  insert/delete, undo/redo (no layout, wrap, curses, keymap, or search). The reader
  types their own text and watches their own chain rewire and stack truncate. It can
  also render the chain trace live, which is what removes the need for any
  pre-generated artifact.
- **(b) Fixed ASCII frames** — a frame array with play/step/scrub, no model.

(a) is materially better if it feels good, and matches what the flowsnake and
hexcubes posts already do. (b) is cheaper and carries no reimplementation risk.

**This is resolved by building a throwaway mock first, before either post is
drafted** — the answer may change how post 1 is structured around the widget.

(a) wins if typing arbitrary text into it produces chain and stack views that teach
the idea better than a curated sequence would, and the model stays near ~150 lines.
(a) loses if the model creeps toward the editor, or if free-form input mostly
produces states that are less illustrative than hand-picked ones — in which case a
curated frame sequence is not a compromise but the better teaching tool.

Post 2's ladder animation does **not** use (a) under any outcome: a JS ladder means
reimplementing soft wrap and layout, which is where "small model" stops being true.
It uses fixed frames or asciinema of the real editor.

### Consequence: no generated artifacts

If the spike lands on (a), nothing in the posts is pre-generated, and so:

- `regen.sh` is not carried over to the blog.
- `book/src/generated/chain-trace.txt` is not carried over.
- No cross-repo sync between `ptedit` and `abracadata`, and no drift guard is needed
  on the blog side.

If the spike lands on (b), post 1 inlines the trace as a static snapshot with a
"generated by `examples/trace_chain.py`" note. Even then, do not automate cross-repo
generation — it is two artifacts and three posts.

`tests/test_book_examples.py` stays in `ptedit` as long as `book/` does, and retires
with it.

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
