# Where your library lives

Storage, backups, and moving a catalog to another device.

[← back to the README](../README.md)

---

#Where your library lives

LibrAPP asks once, the first time you open it.

**A folder you choose** (desktop). Plain JSON files you can read, back up, or
keep in a private repository:

```
sources/       one file per import, exactly as it was read
catalog.json   rebuilt from all of them
overrides.json your corrections
```

**Browser storage** (phone, or if you prefer). Managed by the browser and
private to LibrAPP. Not visible to other apps, so export is how a copy leaves
the device.

After you pick a folder LibrAPP shows which one and waits: **Use this folder**
or **Choose a different one**. Nothing is written until you say.

Either can be changed later from **The stacks**.

**Set up so far** on the opening page lists the three things that decide what
the app can do: where the catalog is kept, how many books are in it, and whether
a key is stored. It appears once you have a library, with a way on beside
anything missing.

### Moving between devices

**The stacks → Export** writes one file holding your sources and corrections.
Import it on the other device and the catalog is rebuilt there.

This is a copy, not a sync. Changes on one device do not appear on the other.

### Backups

**The stacks** keeps copies of the whole library: every source and every
correction, which is everything that cannot be derived again. One is made
before the catalog is reset, and one before a recovery replaces what is there,
so neither of those is a one-way door. **Make a backup now** takes one at any
time.

Each copy is listed with when it was made, what it was made for, how many books
and sources it holds and how large it is. Every button that destroys something
asks first and names what goes.

**Reset the catalog** forgets every book, every source and every correction. It
copies all of that first, and the copy appears in the list underneath, so the
reset can be undone by recovering it. The copies themselves are never touched
by a reset, which is the one thing that would make it unrecoverable.

**Recover** puts a copy back. What is in the catalog at that moment is copied
first and stays in the list, so choosing the wrong one costs nothing but a
second choice. Recovering **replaces**: the books in the copy become the
catalog and the corrections in it become the corrections. That is the
difference between recovering a backup and importing an export, which adds to
what is already there.

**A backup is the same file Export writes.** Download one from its row and it
goes into LibrAPP on another device through the ordinary import, or through
*Bring a catalog over* on the opening page. There is no separate backup format:
there is the export bundle, written into the library instead of downloaded,
with a note of when and why it was made carried alongside and ignored by
anything reading it as an export.

To move a catalog between devices without resetting anything, use **Export** in
**The stacks** and bring the file over the same way. The file is judged by what
is in it rather than by what your file picker calls it, so a phone that labels
a downloaded `.json` as something else does not hide it from you.

If you chose a folder, back it up like any other folder. If you use browser
storage, export or take a backup periodically. Browsers can clear their own
storage when a device runs short of space, and LibrAPP warns you if your
storage is not marked persistent.
