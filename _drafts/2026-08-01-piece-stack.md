---
layout: post
title:  "Undo is just a stack pointer"
date:   2026-08-01
image:
  path: /assets/img/thumbs/piece-stack.png
tags: ptedit editor datastructures 6502
---

Here is an entire memory-management strategy for a text editor: never free anything,
never move anything, and let undo be a subtraction.

That sounds like a description of a memory leak. It is actually a real and rather
elegant design, and the thing that makes it work is refusing — completely — to store
the document as a string of characters you edit in place. Once the document is
instead a *list of references* into text that never changes, an edit stops being a
mutation and becomes an append. And once every edit is an append, the whole document
is a stack, undo is popping it, and redo is remembering where the top used to be.

I have been building [`ptedit`][ptedit], a small ASCII editor, as groundwork for a
port to a 6502 — 64KB of address space, one or two megahertz, and no `realloc` worth
the name. That target is what makes this design attractive rather than merely cute.
On a machine with a real allocator you can afford a gap buffer and a rope and a
compaction pass. On a 6502 you cannot, and the constraint turns out to produce
something clean.

[ptedit]: https://github.com/patricksurry/ptedit

## Why a piece table

The [piece table][piecetable] is the old idea underneath this. Rather than holding
the document's characters, you hold an *original* buffer — the file as loaded, never
written to — plus an append-only buffer of anything the user has typed. The document
proper is a sequence of **pieces**, each of which says "take this many characters
starting at this offset in that buffer."

Inserting in the middle of a piece does not shift any text. It splits the piece in
two and puts a third between them. Deleting does not shift text either; it trims or
drops pieces. Text is written exactly once, when it first arrives, and after that it
is only ever pointed at.

The payoffs are the reason the structure keeps getting reinvented:

- storage stays compact even after heavy editing, because nothing is ever copied;
- undo is nearly free, because the old arrangement of pieces is still lying around;
- pieces are immutable once linked, so reasoning about them is simple;
- and it suits primitive memory management, because the hot path never reallocates.

The implementation below follows Brown's [piece chains][piecechain] rather than the
classic table, and then pushes on the last point harder than either — until the
allocator disappears entirely.

[piecetable]: https://en.wikipedia.org/wiki/Piece_table
[piecechain]: https://www.catch22.net/tuts/neatpad/piece-chains/

## The chain

The core representation is a doubly linked chain of pieces, terminated by two empty
sentinels:

```text
[start] ◄──► [ "the quick fox" ] ◄──► [end]
```

Editing never modifies existing text. It re-links pieces, and appends new ones that
either *shadow* text that already exists or *own* text that has just been typed. So
there are two kinds:

```python
class Piece:
    prev: Piece | None = None
    next: Piece | None = None

class OwnerPiece(Piece):
    data: str               # data of its own

class ShadowPiece(Piece):
    owner: OwnerPiece       # whose data we borrow
    start: int              # ... and which span of it
    length: int
```

Two invariants pay for themselves repeatedly.

**Only sentinels are empty.** Every other piece has length at least one. This is what
lets a cursor position test whether it is at the start of the document by looking at
a length, without needing a reference to the document's sentinels, and it lets edits
simply omit the pieces they do not need instead of materialising empty ones.

**Shadows are always direct.** Splitting a shadow piece produces another shadow of
the *same* underlying owner, never a shadow of a shadow. Reading a character is
therefore always one dereference, no matter how many times a region has been split
and re-split.

A position in the document — the cursor, or the mark at the other end of a selection
— is a `(piece, offset)` pair, sitting to the *left* of its character, with the spot
just past the end of a piece expressed as offset zero in the next one rather than
offset *length* in this one. That convention removes an entire family of
off-by-one-at-the-boundary bugs, at the cost of a little care when you construct one.

## Every edit is three pieces

Now the interesting part. Every change to the document is an `Edit`, and an edit
replaces a fragment of the chain with a new fragment of at most three pieces: `pre`
and `post` shadow the untouched text on either side of the change, and `ins` owns
whatever was newly typed.

Insert `" brown"` into `"the quick fox"` and the single original piece is replaced by
three:

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

The original piece — the *ur-piece*, loaded whole from the file — is not freed. Its
own `prev` and `next` still point at the sentinels, exactly as they did before the
edit. It has simply been routed around.

**That orphaned fragment is the undo record.** Undo does not reconstruct anything or
copy any text; it points `before.next` and `after.prev` back at the unlinked
fragment. Two pointer writes. Redo writes them forward again. No text moves in either
direction, ever.

The edit does not even need to store much to do this. It keeps pointers to the two
ends of the unlinked fragment, and everything else is derived: the piece before the
change is the unlinked fragment's `prev`, the piece after it is the unlinked
fragment's `next`. There is one wrinkle — a pure insertion removes nothing, so there
is no fragment between the neighbours to point at. Materialising an empty `pre` and
`post` would make the shape uniform, but it would break "only sentinels are empty," so
instead the edit flags the case and the two neighbours bracket the gap directly.

### Side chains, and where "before" stops meaning anything

Once undo records exist, the chain is no longer a simple line, and one of the
comfortable assumptions quietly stops holding. The *active* chain is always properly
doubly linked — for any piece `A`, `A.prev.next == A.next.prev == A`. But the
unlinked fragments hang off it, and they link back in:

```text
    start ── A ── D ── E ── C ── end    (current document chain)
             ▲              ▲
             ╰───── B ──────╯           (unlinked side chain)
```

Here `B` is after `A`, in the sense that walking `B.prev` reaches `A`. But `A` is not
before `B`, because walking `A.next` never gets there. And `B` and `D` have no
relationship in either direction. "Before" and "after" have come apart, and any code
that wants to compare two positions has to walk forwards and backwards separately and
accept that both walks may fail. This is the price of keeping the old state around,
and it is worth paying, but it is the sort of thing that is much easier to design for
than to retrofit.

### The undo history

Edits form their own doubly linked list — the undo stack — and the live document is
whichever arrangement of the chain the *current* edit describes. Undo steps the
current pointer back and reroutes; redo steps it forward. Making a new edit after an
undo truncates the forward history first.

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

Loading the file is itself an edit — a pure insertion of the whole file into an empty
chain. There is no special "initial state" to case on anywhere in the code, and, as
we are about to see, it means the source text is simply the bottom of the stack.

### Coalescing

Typing `a`, `b`, `c` should not cost three edits and three undo steps. Compatible
consecutive changes merge in place: the second keystroke extends the `ins` of the
current edit rather than pushing a new one. Deletion does the same — a forward delete
trims `post` from the left, a backspace trims `ins` or `pre` from the right.

The conditions for merging are strict, and each one earns its keep. The cursor must
be exactly where the last change ended, or the extension would not be contiguous.
Only the *current* edit merges, so the initial load edit is sealed and typing can
never grow the ur-piece. And a coalesced delete must leave at least one character
behind, because of the empty-piece invariant.

Extending an owner piece's data sounds like it violates immutability. It doesn't,
because the mutation is strictly *append-only*: every shadow refers to a bounded span
`owner[start:start + length]`, so characters added past the end are invisible to every
reference that already exists. What the model actually needs is that anything already
read stays valid — and that is precisely what a stack gives you for free.

## The stack

Everything so far describes objects linked by references, which is how the Python
reads. But look at what the model never does. It never frees a piece. It never moves
one. Every piece, every edit, and every byte of owned text is only ever *appended*.

So lay them out in memory in creation order, and the document is a stack:

```text
   base                                                                        top
    │                                                                           │
    ▼                                                                           ▼
  ┌───────┬───────┬────┬─────┬─────────────────┬────┬─────┬──────┬─────┬──────────┐
  │ start │  end  │ E0 │ ins │ "the quick fox" │ E1 │ pre │ post │ ins │ " brown" │
  └───────┴───────┴────┴─────┴─────────────────┴────┴─────┴──────┴─────┴──────────┘
    Piece   Piece  Edit Piece       bytes       Edit Piece  Piece Piece    bytes
   ╰─ sentinels ─╯ ╰─── E0: load the file ────╯ ╰───── E1: insert " brown" ──────╯
```

Every cell but the two marked `bytes` is a fixed-size struct. A piece is a pair of
links, a source pointer and a length; an edit is a flag byte, two links, and slots for
whichever of `pre`/`ins`/`post` it uses. The only variable-length thing in the whole
design is the text an `ins` owns, and it sits immediately after that `ins`, so a piece
and its bytes form one contiguous blob.

Which makes the three operations almost embarrassingly cheap:

- **Edit** — push. Allocation is `here += size`. No free list, no fragmentation, no
  compaction pass, no allocator at all.
- **Undo** — move the current-edit pointer down. Nothing is freed, which is exactly
  why redo can move it back up.
- **Redo, then type** — truncate to the current edit, which discards the entire
  forward history in a single assignment, and push again.

Coalescing falls out of the same picture, and this is my favourite part. The `ins`
text of the current edit is *at the top of the stack*, so appending a typed character
is literally bumping the stack pointer. The merge rule I described earlier — only the
current edit, only if the cursor hasn't moved — turns out not to be an arbitrary
optimisation guard at all. It is the precise condition under which the bytes you want
to extend are the ones on top. A Forth port can enforce the whole rule as *modify only
at TOS*.

This is where the design diverges from the classic piece table, which keeps one
append-only add buffer for inserted text, held separately from the pieces. The stack
view intermingles edits, pieces and text in a single append-only region. A real 6502
port will probably reintroduce half of that split — a read-only source buffer loaded
from disk, plus the growing add stack — at which point the source is just another
owner piece that happens to live outside the stack.

## Why the 6502 likes this

The regularity buys more than trivial allocation. Because records are pushed in
creation order, related records land near each other, and locality can be spent on
smaller pointers.

The pieces belonging to one edit are contiguous. A piece is usually close to the data
it shadows — and shadowed data is always *below* the shadowing piece, since the source
sits at the bottom and you can only shadow what already exists. Inserted blobs are
typically a few characters. So most links fit in a single byte of relative offset,
with a flag bit selecting the full 16-bit form when they don't.

There is an asymmetry worth noticing. The links inside a piece are mutable — that is
what re-linking the chain means — so they need a fixed width, because there is no room
to grow a short link into a long one in place. An edit's links, by contrast, are
written once and never changed, so they can use the short form freely.

One consequence of the same logic: capping an owner piece at 256 bytes keeps every
length one byte, at the cost of splitting very long coalesced runs across several
pieces. That is a modest limit on coalescing rather than a correctness problem.

What the Python emphatically does *not* model is the address arithmetic. Owner pieces
own Python strings, edits are objects linked by reference, and the runtime cheerfully
frees whatever falls out of scope. The ordering discipline is real and the layout is
implied by it — but the allocator is imaginary, and finding out how imaginary is the
next job.

The rendering side is a harder problem and a much less settled design, and it is the
subject of the next post: getting a chain of fragments onto a screen without doing
`rows × cols` of work on every keystroke.
