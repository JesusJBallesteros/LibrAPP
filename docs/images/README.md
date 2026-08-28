# Images for the README

| File | View | What should be in frame |
|---|---|---|
| `shelf.png` | Catalog, Spines | The wall of spines, several rows deep, with the sidebar and its counts down the left. Scroll so the demo banner is above the frame. |
| `desk.png` | LibrAPPrian's desk | *Bought, and never opened* drawn as a shelf with the waiting years above each spine, and the word cloud beside or below it. |
| `book.png` | Catalog, any book open | The detail card: the shelf mark, the fields, the sources line, the flags. Pick a book with several sources, so the merge is visible. |
| `photo.png` | Shelf picture | The whole page, scrolled: heading through to the transcription drop. The source the two crops are cut from. |
| `photo-steps.png` | Shelf picture | Cut from `photo.png`: heading, key box, the chosen photograph, the grid control. |
| `photo-tiles.png` | Shelf picture | Cut from `photo.png`: the tiles with at least one discarded, and the extras checklist. |

**Night, at 1500** The dark theme is the one the app was drawn for
and it reproduces better in both GitHub themes than the light one does.

## Crops

The two `photo-` files are cut out of `photo.png` rather than taken separately,
so they cannot come to disagree with each other. Recut them after replacing the
source:

```python
from PIL import Image
im = Image.open('docs/images/photo.png').convert('RGB')
W, _ = im.size
im.crop((270, 150, W, 900)).save('docs/images/photo-steps.png', optimize=True)
im.crop((270, 1055, W, 2530)).save('docs/images/photo-tiles.png', optimize=True)
```

The 270 takes the sidebar off. The vertical numbers are read off the source and
move when the page does.
