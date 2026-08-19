# Recommendations

Suggest books, given a catalog and the shape of how it was built.

## How to use it

```bash
python tools/librapp/query.py context > profile.md
```

Hand a model `profile.md` and this file. Add the occasion if there is one
("something for a long flight", "I want to understand X properly").

## What to produce

**Two or three books. Never more.** A list of nine is a way of avoiding the
decision; it moves the work of choosing back onto the reader, which is the work
they wanted done. Two well-chosen books with a reason each is the deliverable.

For each:

- Title and author.
- **Two sentences** on why this one, naming the book on the shelf it follows
  from or argues with.
- One sentence on what makes it hard going, if it is.

Then one closing line: which of the two to start with, and why.

## Rules

**Read the trajectory, not the pile.** The profile shows what was bought early
and what is being bought now, and they differ. Recommend into where the reading
is going, not into where it has been. A collection that has moved from genre
fiction to philosophy over ten years does not want more of what it read in
year one — unless it asks for exactly that.

**Check it is not already owned.** The catalog is right there. Recommending a
book from the shelf is the fastest way to prove the context went unread. Search
before answering:

```bash
python tools/librapp/query.py search <title or author>
```

**Consider the unread pile first.** A book already owned and never read is a
better answer than a new purchase, when one fits. `query.py forgotten` lists
them, oldest and most-wanted first. Say plainly that this is what you are
doing: "you already own this and have not read it" is a recommendation.

**Do not recommend by resemblance.** "You liked A, so here is more like A" is
what a shop does. Recommend a book that does something the shelf does not
already do — answers a question it keeps asking, or puts the strongest case
against something it keeps assuming.

**Earn the second one.** If the two suggestions are interchangeable, one of
them is wasted. Make them do different jobs: one that goes deeper into
something already being pursued, one that comes at it from outside.

**Say when you are unsure.** A recommendation you are not confident in is worth
making if you say so. One presented as certain and merely plausible is not.

**Match the language of the question.**
