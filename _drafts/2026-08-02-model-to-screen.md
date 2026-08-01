---
layout: post
title:  "A ladder to the screen"
date:   2026-08-02
image:
  path: /assets/img/thumbs/model-to-screen.png
tags: ptedit editor rendering 6502
---

The model stores text as a chain of fragments. The screen wants a rectangle of
glyphs. Everything interesting about rendering a text editor lives in that gap, and
unlike the storage side — which I wrote about [last time][post1], and which has a
tidy answer I'm confident about — I do not think I have found the right answer here
yet. What follows is a design that works, the measurements that shaped it, and the
parts I still consider open.

[post1]: /posts/piece-stack/

## The problem

Drawing one 80×24 frame directly from the piece chain means three things: pick an
anchor — the beginning of the first visible line; walk forward from it formatting 24
visual lines, expanding tabs and soft-wrapping at 80 columns; then draw the cursor
and any selection.

The second step is bounded by `rows × cols`. On a 1MHz machine, 1,920 cells is
already real money, but at least it is a known price. The first step is the one that
bites: with no other context, finding the anchor means scanning *backward* to the
nearest line break, and that scan is unbounded. A paragraph with no newline in it can
be arbitrarily long, so a single keystroke can cost a walk through the entire
document.

The target hardware sets the rest of the terms. The video buffer is memory-mapped, so
writing a cell is one store and that buffer is the only copy of the displayed bytes.
The renderer's own state has to be small, and it cannot allocate.

Which rules out both obvious answers: no diffing against a shadow screen buffer,
because there is no room for a second copy, and no re-deriving the anchor each frame,
because that scan is unbounded. What is left is to *remember a little*, and arrange for
that memory to survive the common case — someone typing — while resetting cleanly on
everything rarer.

## What the model hands over

Between the piece chain and the screen sits a deliberately thin API. A `Document`
wraps the chain and owns the *point* — the cursor — and offers three kinds of thing:
point movement and the character scanners that word- and line-motion are built from;
reading, via `get_char` and `get_data(start, end)`; and mutation, via `insert`,
`delete`, `replace`, `undo`, `redo`, `squash`.

The mutation layer is thinner than it looks: all three mutators hand the change to the
edit, move the point to where it ended, and notify. Everything about splitting pieces
and preserving undo state lives in the edit itself.

That notification is the part that matters here. Every mutation calls a single hook,
`on_change`, with the edit that was applied — or with `None` for undo, redo and
squash, meaning "assume everything changed." One hook, one subscriber. Keeping it that
small is deliberate, because it is the seam a memory-constrained port has to reason
about, and everything below is a consequence of what that hook can tell you.

Above that sit two unsurprising layers: an `Editor` turning primitives into named
commands and holding the mark, clipboard and search state, and a `Controller` looping
over keys, dispatching, and repainting. The keymap is a table from keys to command
names, which is the dictionary-of-named-words a Forth port wants anyway.

```text
   ┌──────────────────────────────────────────────────┐
   │ Document          piece chain · point            │
   └────────────────────────┬─────────────────────────┘
                            │ on_change(edit | None)
                            ▼
   ┌──────────────────────────────────────────────────┐
   │ Display           find_top · paint               │
   └───────┬──────────────────────────────┬───────────┘
           │ bol · ensure_row             │ cells
           │ render_lines · make_room     │
           ▼                              ▼
   ┌────────────────────────┐   ┌─────────────────────┐
   │ Layout                 │   │ Screen              │
   │ BoL ladder ·           │   │ clear · move ·      │
   │ format_line · motion   │   │ put · refresh       │
   └───────────┬────────────┘   └─────────────────────┘
               ╎
               ╎ reads chars, moves the point
               ╰┄┄► Document
```

`Layout` maps the document onto a grid: it owns the cache of line starts, turns
document characters into screen bytes, and implements line- and page-wise motion.
`Display` owns the frame — which line is at row 0, and which rows actually need
emitting. `Screen` is the thin boundary where bytes leave the program.

## The ladder

The cache is a **ladder** of beginning-of-line marks, one per visual line on or near
the screen — where a visual line means one ended either by a hard newline *or* by a
soft wrap at the right margin. Three indices identify the regions: `first`, the
earliest valid rung; `top`, the rung displayed at row 0; and `last`, one past the
final valid rung.

```text
    ladder                                       screen (rows = 4)
    ──────                                       ─────────────────
    [0]   pos    0   "the quick brown fox"       ·  above the window
    [1]   pos   20   "jumps over the lazy"       ·
 ►  [2]   pos   40   "dog. the quick brown"      ┌─  row 0
    [3]   pos   60   "fox jumps over the"        │   row 1
    [4]   pos   79   "lazy dog. the quick"       │   row 2   ◄ cursor
    [5]   pos   99   "brown fox jumps"           └─  row 3
    [6]   pos  115   "over the lazy dog."        ·  below the window
        ↑
        top = 2,  first = 0,  last = 7
```

The ladder usually overhangs the window in both directions, and both overhangs are
accidents rather than policy: rungs above `top` got formatted on the way past when
reanchoring landed on the nearest newline before the screen, and rungs below survive
because scrolling and editing often leave correct ones behind. (The port stores this
as a 64-slot ring buffer — 2⁶ entries × 4 bytes = 256 bytes exactly.)

Five invariants hold the rest of the design together, and each mechanism below serves
one of them:

1. **Commands complete themselves.** Cursor motion, including the goal column of a
   vertical move, is resolved when the command runs, never fixed up during a paint.
2. **Painting is read-only.** It saves and restores the point and mutates nothing
   outside the screen and its own frame state.
3. **`Layout` solely owns the ladder.** `Display` reaches it only through a four-method
   interface.
4. **Damage is a single document position**, which paint reduces to one dirty row.
5. **Incremental repair is for forward edits only.** Undo, redo and squash invalidate
   wholesale.

## A frame

Each frame makes the ladder describe reality, then works out how little of the screen
to touch.

**Phase one** translates the ladder through any edit that occurred (more on that
below), then locates the cursor relative to it. If the cursor is bracketed by the
cached range, the ladder is already right. If it is at most `rows` lines past the end,
the ladder extends forward to reach it — further than that and starting over is
cheaper. Otherwise the ladder **reanchors**: backscan to a hard newline, reset, and
format forward until the cursor is bracketed. A pure selection change skips the phase
entirely.

**Phase two** decides what to emit. Every edit records **damage** — the lowest
document position whose on-screen bytes may have changed, which is the edit position
less one screen width. The margin covers soft-wrap pull-back; multiple edits between
frames take the minimum. Damage is stored as a *position* rather than a ladder index
precisely because positions survive the rebuilds and evictions that happen between the
edit and the paint.

Everything then reduces to one number:

| Condition | first dirty row |
|-----------|-----------------|
| `top` changed, or a selection is active now or was last frame | 0 (full redraw) |
| damage recorded | the row containing the damage position |
| otherwise | `rows` (emit nothing at all) |

and rows from there to the bottom are re-rendered. That last case is the one that
makes the whole thing worthwhile: after a plain cursor move with no scroll, the screen
is already byte-identical to the previous frame, so the frame costs one cursor move
and zero cells. On the 6502 the entire decision is one 16-bit position and one byte.

## Surviving edits

The reason any of this survives contact with typing is that the edit itself knows how
to translate a stored position into the new chain. Given a location, it returns the
location unchanged if the edit didn't touch that piece; a location on `pre` or `post`
if the piece was split and the offset lands in one of them; or nothing at all if the
offset fell inside deleted text.

This matters more than it looks. For a freshly opened document every rung points into
the single original piece, and the first keystroke splits and unlinks that piece — so
without the translation, *every* rung would die on *every* keystroke and the cache
would never survive its first use.

A second rule applies afterwards: drop the rung if it now sits within one screen width
of the edit. This guards against wrap propagation, where an edit on one visual line
moves the wrap point of the line *before* it, because a word gets pulled up or pushed
down:

```text
cols = 20
before:  "some short words supercalifragilistic..."
                          ^ pos 17 = BoL of visual line 2
                          line 1 = "some short words "      (wrap after space)
                          line 2 = "supercalifragilistic"   (no wrap)

edit:    insert ' ' after "super" (pos 22)

after:   "some short words super califragilistic..."
                                 ^ new wrap point at pos 23
                          line 1 = "some short words super " (absorbed "super ")
                          line 2 = "califragilistic..."
```

The edit at position 22 moved the start of visual line 2 from 17 to 23, despite being
past both. Truncating forward from the first rung that fails either rule is correct by
construction: rungs are sorted by position, so once one fails, every later one would
too.

## Sticky top and guard zones

The last mechanism keeps the screen from scrolling a line at a time on every vertical
move. `find_top` remembers the position shown at row 0 and keeps it on the next frame
if the cursor is still within a screenful, clamping the cursor into a band that
excludes a few rows at each edge. Only when the cursor enters a guard zone does the
top move.

```text
              ┌────────────────────────────┐
      row 0   │▒▒▒▒▒▒▒▒ guard zone ▒▒▒▒▒▒▒▒│  cursor here ⇒ top moves up
      row 1   │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
      row 2   │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
      row 3   │                            │
      row 4   │      cursor free here      │  top stays put, no scroll
      row 5   │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
      row 6   │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
      row 7   │▒▒▒▒▒▒▒▒ guard zone ▒▒▒▒▒▒▒▒│  cursor here ⇒ top moves down
              └────────────────────────────┘
                 rows = 8, guard_rows = 3
```

Within the free band the screen doesn't move at all, which drops the frame into phase
two's "emit nothing" case. Most vertical cursor movement therefore costs nothing.

## Three things that looked right and weren't

**Deep backscan on reanchor.** Reanchoring past *several* newlines should let the
ladder absorb a few upward steps before the next rebuild. Measured, it is a clear
regression: each reanchor costs about five times more, and the occasional avoided
rebuild nowhere near pays for it.

**Rescuing ladder entries by arithmetic.** Before edits knew how to translate a
location, the renderer reconstructed each cached line start by walking positions in the
new chain — fifty-odd lines with several edge cases. Pushing the translation into the
edit, which already knows exactly what it split, is smaller and faster. This is the
change I'd point at if asked what actually made the design work.

**Remapping through undo.** Tempting for symmetry, but undo swaps whole fragments of
chain in and out, and one reanchor is cheaper than proving a remap correct across that.
Undo is not a hot path, and symmetry is not always worth what it costs.

## What is still open

I am much less sure about this half of the editor than the storage half. The piece
stack has a shape that feels inevitable once you see it; this does not, and the honest
summary is that it is a working design rather than the right one.

Three specifics. **Per-piece newline counts** would answer "what line is the point on?"
without a scan, which the status bar wants; I haven't decided whether it earns its
per-piece bytes. **Unwrapped mode with horizontal scrolling** is unimplemented, and I
suspect it isn't merely a display option — it changes what a visual line *is*, which is
the ladder's whole premise. And the **scroll sub-case**, which the Python folds into
"full redraw," should on real hardware be a video-RAM block move plus a repaint of the
newly exposed rows; I haven't built it, so I don't know what it disturbs.

Underneath those is a structural question. The ladder is a cache of *derived* state,
and every mechanism above exists to keep it honest across edits. A design where line
structure lived in the model rather than being reconstructed by the view would need
none of it — at the cost of putting screen width into the document, exactly the
coupling the layering was meant to avoid. I don't think that trade is right. I am not
certain it's wrong.

If you have built one of these and know which way that goes, I would genuinely like to
hear it.
