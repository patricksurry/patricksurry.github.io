# ptedit Blog Series Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-cut the four-chapter `ptedit` mdbook into two standalone, static blog posts on Abracadata plus a deferred placeholder for the 6502 port post.

**Architecture:** Prose is re-framed, not rewritten from scratch — the source chapters are finished and good. Every diagram becomes ASCII (no mermaid). A throwaway spike runs first to settle whether post 1's future animation should be an interactive JS piece-model or a fixed frame sequence, because that answer changes how post 1 is structured around the widget. Animation itself is a later phase and out of scope here.

**Tech Stack:** Jekyll 4.4.1 + Chirpy 7.6.0, Ruby 3.3, html-proofer 5.2.2. Spike in plain ES-module JavaScript (no D3, no libraries), Node v24 with built-in `node --test`.

## Global Constraints

- **Zero mermaid in the series.** No `mermaid: true` in any front matter. All diagrams are ASCII inside fenced blocks.
- **Static first.** No post may depend on JavaScript to be complete and correct. Animation is a later phase.
- **No D3** for these diagrams. ASCII rendering is string building.
- **No generated artifacts, no cross-repo sync.** `regen.sh` and `book/src/generated/` are not carried over.
- **Posts open on an idea**, never on a definition or a back-reference to another post.
- Front matter follows site convention exactly:
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
- Source chapters are read-only inputs at `~/ptedit/book/src/`. Do not edit them during this project.
- Do not change the ptedit implementation. Bugs or unclear design found while writing go in `~/ptedit/TODO.md`.
- Word targets: post 1 ~2,000 words of prose; post 2 1,800–2,000 words of prose.
  **Measure prose only** — plain `wc -w` counts the ASCII diagrams, which add ~300
  apparent words per post and will make a correctly-sized draft look bloated:
  ```bash
  python3 -c "import re,sys; b=open(sys.argv[1]).read().split('---',2)[2]; \
    print(len(re.sub(r'\`\`\`.*?\`\`\`','',b,flags=re.S).split()))" <file>
  ```

---

### Task 1: Spike the chain/stack widget (throwaway)

Settles the open question in the spec: interactive JS piece-model **(a)** versus fixed ASCII frames **(b)**. This code is deliberately disposable — it lives in the scratchpad, never in the site repo, and is not committed.

**Files:**
- Create: `/private/tmp/claude-501/-Users-psurry-abracadata/b023637d-c974-4c46-8bfe-e43a525bb25d/scratchpad/spike/piecemodel.js`
- Create: `/private/tmp/claude-501/-Users-psurry-abracadata/b023637d-c974-4c46-8bfe-e43a525bb25d/scratchpad/spike/index.html`
- Modify: `docs/superpowers/specs/2026-08-01-ptedit-blog-series-design.md` (record the decision)

**Interfaces:**
- Consumes: nothing.
- Produces: a recorded decision (a) or (b) in the spec, which Task 2 reads. No code that later tasks import.

- [ ] **Step 1: Port the minimum model**

Read `~/ptedit/src/ptedit/piece.py` and `~/ptedit/src/ptedit/edit.py` first. Implement in `piecemodel.js` only: `OwnerPiece`, `ShadowPiece`, a doubly-linked chain with `start`/`end` sentinels, `insert(pos, text)`, `del(pos, n)`, `undo()`, `redo()`. No layout, no wrap, no search, no keymap, no coalescing beyond what falls out naturally.

Mirror the Python's naming (`pre`, `ins`, `post`, `unlinked_first`, `unlinked_last`) so the spike stays legible next to the source.

Hard budget: **if this exceeds ~150 lines, that is itself the answer — stop and record (b).**

- [ ] **Step 2: Render two ASCII views**

Two functions, both returning a plain string:

```js
export function renderChain(doc)  // [start] <-> ["the quick"] <-> ... <-> [end]
export function renderStack(doc)  // the base..top cell diagram from pieces.md
```

Use the diagram shapes already in `~/ptedit/book/src/pieces.md` (the chain line at its top, and the stack diagram under "The piece stack") as the target output.

- [ ] **Step 3: Wire a minimal page**

`index.html`: a `<textarea>` or contenteditable, two `<pre>` elements bound to `renderChain` / `renderStack`, and undo/redo buttons. No styling beyond a monospace font. This is a feel test, not a design.

- [ ] **Step 4: Run it and judge against the spec's criteria**

```bash
cd <scratchpad>/spike && python3 -m http.server 8123
```

Open `http://localhost:8123/`. Type, delete, undo, redo. Judge against the criteria recorded in the spec:

- **(a) wins** if typing arbitrary text produces chain and stack views that teach the idea better than a curated sequence would, *and* the model stayed near ~150 lines.
- **(b) wins** if the model crept toward the editor, or if free-form input mostly produces states less illustrative than hand-picked ones.

- [ ] **Step 5: Record the decision in the spec**

Edit the "Open question, resolved by spike" section: change the heading to "Animation approach (resolved)", state the outcome, and give the two-or-three sentence reason. Delete the criteria list — it has served its purpose.

- [ ] **Step 6: Commit the spec update**

```bash
cd ~/abracadata
git add docs/superpowers/specs/2026-08-01-ptedit-blog-series-design.md
git commit -m "docs: record animation approach decision from spike"
```

The spike code itself is **not** committed.

---

### Task 2: Draft post 1 — the piece stack

**Files:**
- Create: `_drafts/2026-08-01-piece-stack.md`
- Read: `~/ptedit/book/src/pieces.md`, `~/ptedit/book/src/introduction.md`

**Interfaces:**
- Consumes: the animation decision from Task 1 (determines whether the post leaves a placeholder `<div id="piece-stack-demo">` anchor for phase 2, and where).
- Produces: a published-shape draft that Task 5 verifies and Task 6 publishes.

- [ ] **Step 1: Write the front matter**

```yaml
---
layout: post
title:  "Undo is just a stack pointer"
date:   2026-08-01
image:
  path: /assets/img/thumbs/piece-stack.png
tags: ptedit editor datastructures 6502
---
```

Title is a candidate, not settled — flag alternatives to the user at review rather than silently picking a different one.

- [ ] **Step 2: Write the opening**

The chapter opens on a definition ("The piece table is an efficient data structure…"). The post must not. Open on the payoff, which is already in the source text under "The piece stack": nothing is ever freed, nothing ever moves, and undo is subtracting from a pointer. Earn the data structure afterward.

Then fold in the motivation from `introduction.md`: why a piece table at all, and the 64KB / 1–2MHz 6502 target that motivates the design choices.

Constraint: a reader who has never heard of `ptedit` must know what this post is about by the end of the third paragraph.

- [ ] **Step 3: Port the body sections in order**

Follow the chapter: chain → locations → edits and undo → coalescing → **the piece stack** → why the 6502 likes it.

Drop while porting:
- The `{{#include generated/chain-trace.txt}}` block and the paragraph introducing it, *unless* Task 1 chose (a), in which case leave the anchor from Step 5.
- Per-file "see [`piece.py`]" scaffolding. Keep one repo link near the top and inline links only where a named file is genuinely the point.

Keep in full: the "only sentinels are empty" and "shadows are direct references" invariants, the before/after asymmetry, and the coalescing rules — these are the parts that make the design legible.

- [ ] **Step 4: Convert both mermaid diagrams to ASCII**

`pieces.md` has two ```mermaid blocks. Replace with fenced plain blocks. The chain split (start / pre / ins / post / end, with the unlinked ur-piece):

```text
  ┌───────┐   ┌─────────────┐   ┌────────────┐   ┌────────────┐   ┌─────┐
  │ start │◄─►│ "the quick" │◄─►│  " brown"  │◄─►│   " fox"   │◄─►│ end │
  └───┬───┘   │ pre  shadow │   │ ins  owner │   │ post shadow│   └──┬──┘
      ╎       └─────────────┘   └────────────┘   └────────────┘      ╎
      ╎                                                              ╎
      ╎      ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐               ╎
      └ ─ ─ ─►     "the quick fox"   ur-piece         ◄ ─ ─ ─ ─ ─ ─ ─┘
             └ ─ ─ ─ ─ ─ ─ ─ unlinked ─ ─ ─ ─ ─ ─ ─ ─┘
```

and the edit list after an undo:

```text
  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
  │      E0      │◄─►│      E1      │◄─►│        E2        │
  │ initial load │   │    insert    │   │  insert · undone │
  └──────────────┘   └──────────────┘   └──────────────────┘
                       ▲ current                 ╎
                                                 ╎ the next edit
                                                 ╎ truncates here
                                                 ▼
                                          ┌ ─ ─ ─ ─ ─ ┐
                                                E3
                                          └ ─ ─ ─ ─ ─ ┘
```

The four existing ```text blocks (chain one-liner, side-chain, the stack diagram, the layout cells) carry over unchanged — they are already ASCII and already good.

- [ ] **Step 5: Leave the phase-2 anchor (only if Task 1 chose (a))**

Immediately after the stack diagram, add:

```html
<div id="piece-stack-demo"></div>
```

with an HTML comment noting it is inert until the phase-2 animation lands. If Task 1 chose (b), skip this step entirely — a frame player wraps the existing `<pre>` rather than needing its own mount point.

- [ ] **Step 6: Check the word count**

```bash
wc -w _drafts/2026-08-01-piece-stack.md
```

Expected: 2,100–2,500. Outside that range, cut or expand before proceeding — do not defer it to review.

- [ ] **Step 7: Verify no mermaid survived**

```bash
grep -c "mermaid" _drafts/2026-08-01-piece-stack.md
```

Expected: `0`.

- [ ] **Step 8: Commit**

```bash
git add _drafts/2026-08-01-piece-stack.md
git commit -m "draft: post 1, the piece stack"
```

---

### Task 3: Draft post 2 — from model to screen

**Files:**
- Create: `_drafts/2026-08-02-model-to-screen.md`
- Read: `~/ptedit/book/src/rendering.md`, `~/ptedit/book/src/document.md`, `~/ptedit/book/src/introduction.md`

**Interfaces:**
- Consumes: post 1's published slug, for the one back-link (see Step 3).
- Produces: a draft that Task 5 verifies and Task 6 publishes.

- [ ] **Step 1: Write the front matter**

```yaml
---
layout: post
title:  "A ladder to the screen"
date:   2026-08-02
image:
  path: /assets/img/thumbs/model-to-screen.png
tags: ptedit editor rendering 6502
---
```

- [ ] **Step 2: Frame it as an open problem, not a solved design**

This is the defining constraint of this post and the easiest one to lose while editing. The piece stack has clarity, elegance, and historical precedent; this design does not, and the post says so plainly.

Shape: here is the problem → here is the constraint that kills the obvious answers → here is where I have got to → here is what I measured and rejected → here is what is still open.

Concretely: the chapter's "What we chose not to do" section moves **up** into the body rather than sitting at the end as an appendix, and the post ends on open questions rather than a summary. The unimplemented per-piece newline counts, and the wrap/non-wrap mode in `~/ptedit/TODO.md`, are legitimate material for that ending.

- [ ] **Step 3: Compress the document-model material to ~350 words**

From `document.md` (684 words), keep only: what `Document` exposes (point movement, reading, mutation), and the `on_change(edit | None)` hook. That hook is the only part the rendering material actually depends on.

Cut entirely: the "Reading the traces" section and both `{{#include ...}}` source blocks — that is code-tour material.

Compress `Editor` and `Controller` to a single paragraph noting that commands compose `Document` primitives and the keymap is a table, which is what a Forth port wants.

One back-link to post 1 here, phrased so a reader who skipped it still follows.

- [ ] **Step 4: Port the rendering body, condensing to the core idea**

The spine is: the problem → the ladder → a frame (two phases) → surviving edits → sticky top and guard zones → what we chose not to do → the screen boundary.

The core idea to protect is **the ladder as the bridge to a memory-mapped display**. Condense or cut anything that does not serve it. Specific candidates for cutting, given the 1,800–2,000 target:

- The Python-vs-Forth storage divergence paragraph (ring buffer vs `list` subclass) — compress to one sentence.
- The `stats.py` block quote — cut.
- The `Layout`/`Display`/`Screen` file-by-file paragraph — compress into the ASCII diagram's caption.

Keep in full: the five invariants, the damage/first-dirty-row table, and the soft-wrap propagation example — that example is the clearest thing in the chapter.

- [ ] **Step 5: Convert the mermaid diagram to ASCII**

`rendering.md` has one ```mermaid block ("the cast"). `introduction.md`'s MVC layering diagram merges into it rather than appearing separately:

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

The three existing ```text blocks (the ladder, the wrap propagation example, the guard zones) carry over unchanged.

- [ ] **Step 6: Check the word count**

```bash
wc -w _drafts/2026-08-02-model-to-screen.md
```

Expected: 1,800–2,000. This post is condensed *from* 3,083 source words, so overshooting is the likely failure — cut before proceeding.

- [ ] **Step 7: Verify no mermaid survived**

```bash
grep -c "mermaid" _drafts/2026-08-02-model-to-screen.md
```

Expected: `0`.

- [ ] **Step 8: Commit**

```bash
git add _drafts/2026-08-02-model-to-screen.md
git commit -m "draft: post 2, from model to screen"
```

---

### Task 4: Post 3 placeholder

A deliberately minimal stub so the series has a visible shape and the material gathered while writing posts 1 and 2 has somewhere to go. It stays in `_drafts/` — Task 6 does **not** publish it.

**Files:**
- Create: `_drafts/2026-08-03-ptedit-6502-port.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the stub**

```markdown
---
layout: post
title:  "ptedit on the 6502"
date:   2026-08-03
image:
  path: /assets/img/thumbs/ptedit-6502.png
tags: ptedit editor forth 6502
---

<!--
  PLACEHOLDER — do not publish.

  Gated on the port actually running. Current state of ~/ptedit/forth:
    piece.fs   173 lines
    edit.fs    148 lines
    doc.fs      66 lines
    ptedit.fs   63 lines
    render.fs    7 lines   <- the blocker
    ptedit.asm 351 lines

  Planned shape:
  - What the piece-stack design bought once memory was actually 64KB:
    short relative links, the 256-byte owner-piece cap, modify-only-at-TOS.
  - Where the Python model turned out to be lying about the allocator.
  - The ladder as a 64-slot ring buffer (2^6 x 4-byte Locations = 256 bytes).
  - Minimum shipping artifact: an asciinema recording of the port running.
  - Stretch: a JS 65C02 emulator in the page, serving the real editor.

  Source notes: ~/ptedit/docs/6502-notes.md
-->
```

- [ ] **Step 2: Verify it does not build into the site**

```bash
cd ~/abracadata && JEKYLL_ENV=production bundle exec jekyll build
grep -rc "ptedit-6502" _site/ | grep -v ":0" || echo "correctly absent from build"
```

Expected: `correctly absent from build`. Drafts are excluded unless `--drafts` is passed.

- [ ] **Step 3: Commit**

```bash
git add _drafts/2026-08-03-ptedit-6502-port.md
git commit -m "draft: placeholder for post 3, the 6502 port"
```

---

### Task 5: Thumbnails and full-site verification

**Files:**
- Create: `assets/img/thumbs/piece-stack.png`
- Create: `assets/img/thumbs/model-to-screen.png`

**Interfaces:**
- Consumes: the two drafts from Tasks 2 and 3.
- Produces: a site that builds and passes html-proofer with both drafts included.

- [ ] **Step 1: Produce the two thumbnails**

Both are ASCII renders, matching the series aesthetic: post 1's is the stack cell diagram, post 2's is the ladder-and-screen diagram. Existing thumbs are roughly square and 350–770px on a side (`flowsnake.png` 768×768, `hexcubes.png` 713×722, `ds-tenets.png` 549×422), so target ~700×700.

Concrete method: build the draft, serve it with `bundle exec jekyll s --drafts`, and screenshot the rendered `<pre>` diagram from the browser at 2× zoom — this inherits the site's own code styling and dark/light treatment, so the thumbnail matches the post. Crop with `sips -c <h> <w>` and resize with `sips -Z 700`.

This step needs a human eye — produce a candidate, then **show it to the user and get approval before continuing**. Do not ship a placeholder image.

- [ ] **Step 2: Build with drafts included**

```bash
cd ~/abracadata && JEKYLL_ENV=production bundle exec jekyll build --drafts --future
```

`--future` is required: the drafts carry authoring dates that may be later than today,
and Jekyll silently skips future-dated posts, reporting only
`Skipping: <file> has a future date`. Without it a draft looks built but is absent.

Expected: `done in N seconds`, no Liquid warnings, no "Conflict:" lines.

- [ ] **Step 3: Run html-proofer over the built site**

```bash
bundle exec htmlproofer _site --disable-external \
  --ignore-urls "/^http:\/\/127.0.0.1/,/^http:\/\/0.0.0.0/,/^http:\/\/localhost/"
```

Expected: `HTML-Proofer finished successfully.` Internal link count should exceed the current 73.

- [ ] **Step 4: Confirm both posts are complete with JavaScript disabled**

Serve locally and read both posts start to finish with JS off in the browser:

```bash
bundle exec jekyll s --drafts
```

Checklist, per post: every idea is carried by prose and ASCII; no empty gap where a widget will later mount; no sentence refers to something the reader cannot see.

- [ ] **Step 5: Commit**

```bash
git add assets/img/thumbs/piece-stack.png assets/img/thumbs/model-to-screen.png
git commit -m "feat: thumbnails for the ptedit series"
```

---

### Task 6: Publish posts 1 and 2, retire the book

Gated on user approval of both drafts. Do not run this task on your own initiative.

**Files:**
- Move: `_drafts/2026-08-01-piece-stack.md` → `_posts/`
- Move: `_drafts/2026-08-02-model-to-screen.md` → `_posts/`
- Modify: `~/ptedit/README.md`
- Delete: `~/ptedit/book/`, `~/ptedit/tests/test_book_examples.py`

- [ ] **Step 1: Publish, with real dates**

Jekyll takes the publication date from the filename, so both the filename and the
front-matter `date:` must be updated to the actual publish date (call it `YYYY-MM-DD`
below — the drafts' `2026-08-01` / `2026-08-02` are authoring dates, not publish dates):

```bash
cd ~/abracadata
git mv _drafts/2026-08-01-piece-stack.md     _posts/YYYY-MM-DD-piece-stack.md
git mv _drafts/2026-08-02-model-to-screen.md _posts/YYYY-MM-DD-model-to-screen.md
```

Then set `date:` in each file's front matter to the same `YYYY-MM-DD`. Publishing both
on one day is fine; if they are staggered, post 2's back-link to post 1 still resolves
because post 1 goes first.

- [ ] **Step 2: Verify the published build**

```bash
bash tools/test.sh
```

Expected: build succeeds, `HTML-Proofer finished successfully.`

- [ ] **Step 3: Commit and push**

```bash
git add -A && git commit -m "feat: publish the ptedit series, posts 1 and 2"
git push
```

Then confirm the Pages deploy succeeded before touching the ptedit repo — the book must not be retired while the posts are unreachable.

```bash
gh run list --limit 1
```

- [ ] **Step 4: Retire the book**

Only after the deploy is green:

```bash
cd ~/ptedit
git rm -r book/ tests/test_book_examples.py
```

- [ ] **Step 5: Point the README at the posts**

Edit `~/ptedit/README.md`, replacing the book reference with links to the two published posts. Keep the existing `piecechain` / `craft` / `tali` reference links.

- [ ] **Step 6: Verify the ptedit test suite still passes**

```bash
cd ~/ptedit && uv run pytest
```

Expected: pass. `test_book_examples.py` is gone; nothing else should reference `book/`.

```bash
grep -rn "book/" --include="*.py" --include="*.md" --include="*.toml" . | grep -v "^./.git"
```

Expected: no hits outside git history.

- [ ] **Step 7: Commit**

```bash
git commit -m "docs: retire the mdbook in favour of the published series"
```

---

## Out of scope for this plan

- **Phase 2 animation.** The frame player or interactive widget, the asciinema recordings, and the termynal CSS chrome all belong to a later plan, written once Task 1's decision is recorded.
- **Post 3's content.** Gated on `render.fs` and the port running.
- Any change to the ptedit implementation itself.
