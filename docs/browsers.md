# Browser support

Which browsers run LibrAPP, and what is missing where.

[← back to the README](../README.md)

---

#Browser support

| Engine | Browsers | Everything works? | Checked |
|---|---|---|---|
| **Chromium** | Chrome, Edge, Brave, Opera, Vivaldi, Arc, Comet, Samsung Internet | Yes | Chrome on Windows 11 and Android |
| **Gecko** | Firefox 113+ | Should, except saving to a folder and installing as an app | Not yet |
| **WebKit** | Safari 16.4+, all iOS browsers | Should, except saving to a folder; install via Add to Home Screen | Not yet |

The last column is the honest one. Firefox and Safari meet every requirement
listed below, so there is no known reason for them to fail, but *meets the
requirements* is a reading of the documentation and not a test result. If you
use one of them, the next section is the answer that does not depend on this
table.

Only Chromium browsers on a desktop can save your library to a folder you
choose; everywhere else it goes into browser storage, which works identically
from inside the app but is not visible to other programs. See [where your
library lives](your-library.md).

**Not sure about yours?** Open LibrAPP and go to **The stacks → Your browser**. It
tests each feature and tells you what works, which is more reliable than any
table — including this one.

![The browser check: nine features listed by what they are for, each answered yes, under a badge reading everything supported](images/browser-support.png)

### If you use strict privacy settings

Brave's Shields, Firefox's strict mode and similar features do not stop LibrAPP
working. But **anything set to clear site data when you close the browser will
delete a library kept in browser storage.** If you use those settings:

- prefer saving to a folder (Chromium desktop), or
- allow LibrAPP's storage as an exception, or
- keep an export — **The stacks → Export**.

LibrAPP warns you when its storage is not marked persistent.

### Tested on

Chrome on W11 and Android. Firefox and Safari meet the
requirements below but are untested. If something breaks in yours, please
open an issue.

Internet Explorer and browsers older than the versions above are not supported.

<details>
<summary>What LibrAPP needs from a browser</summary>

| Feature | Used for | Without it |
|---|---|---|
| Secure context (HTTPS) | everything | nothing works |
| IndexedDB | settings and where your library is | nothing works |
| Origin Private File System | keeping the catalog | nothing works |
| Regex lookbehind and Unicode escapes | matching titles and names | nothing works |
| File System Access API | saving to a folder you choose | browser storage is used instead |
| `DecompressionStream` | reading `.xlsx` spreadsheets | CSV still imports |
| `OffscreenCanvas`, `createImageBitmap` | tiling a photograph | import from a list instead |
| Service workers | installing, and offline use | runs online only |

</details>
