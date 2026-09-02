# Optional AI key

Which services LibrAPP can use, what a key costs you, and how to work without one.

[← back to the README](../README.md)

---

#Optional AI key

LibrAPP works with no key. A key only lets it do two things itself instead of
preparing them for you: reading spines from a photograph, and answering
questions on the desk.

### Which service

You choose. The key box lists:

| Service | Get a key at | Notes |
|---|---|---|
| **Anthropic** — Claude | [console.anthropic.com](https://console.anthropic.com/settings/keys) | prices shown in dollars |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) | |
| **Google** — Gemini | [aistudio.google.com](https://aistudio.google.com/apikey) | both the older `AIza…` and the newer `AQ.…` keys work |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai/keys) | many models behind one key |
| **Anything else** | — | any address that speaks the OpenAI chat interface |

That last row covers Groq, Mistral, DeepSeek, Together, and a model running on
your own machine: give the address ending in `/v1` and the model name. A local
server has to be configured to accept requests from the page before a browser
is allowed to talk to it.

The model is a free text field with suggestions, so a model newer than this
README still works. **See what this key can use** asks the service itself and
replaces the suggestions with what it answers. Use it whenever a request comes
back saying the model is not available: services retire model names on their own
schedule, and the list they give back is the only one that cannot be out of
date.

Each service keeps its own key — trying a second one does not cost you the
first, and switching back needs no pasting.

LibrAPP checks the shape of a key before saving it, but only as a warning: if it
does not recognise what you pasted it says so and lets you save it on a second
press. A key is an opaque credential and services change their formats — Gemini
moved from `AIza…` to `AQ.…` keys — so a stale guess here must never be the
reason a working key is refused.

### The three states

The key box is in **Shelf picture** and on the **desk**, and always shows one of:

| | |
|---|---|
| **no key stored** | LibrAPP prepares requests for you to paste elsewhere |
| **key stored · in use** | LibrAPP may read spines and answer questions |
| **key stored · switched off** | the key is kept but not used |

Switching off keeps the key for later. Deleting removes it from the device.

**Cost.** Where a model's published rate has been checked, LibrAPP shows an
estimate in dollars before spending and the real cost afterwards — reading a
full 50-megapixel shelf with Claude Opus costs roughly 28 cents, a close-up of a
few books under three. Where the rate has not been checked, it shows the token
count instead and leaves the arithmetic to you, rather than printing a guessed
price with a dollar sign in front of it.

**Security.** A key stored in a browser can be read by anything running on the
page. Use a key scoped to its own project or workspace, with a spend limit. The
key is sent only to its own service, is never written into your catalog, and is
never included in an export.

**Review.** Books read from a photograph are shown for your approval before
they enter the catalog, with each entry's confidence beside it. A model reading
a spine can be wrong in ways nothing downstream can detect.
