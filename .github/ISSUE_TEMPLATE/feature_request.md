---
name: Feature request
about: Suggest a capability or improvement
title: ""
labels: enhancement
assignees: ""
---

**The problem**
What are you trying to do that the inspector does not let you do today?

**Proposed solution**

**Scope**
The inspector is deliberately **read-only** — it fetches and decodes, and never
deploys, invokes, signs, or changes anything. Requests that keep it read-only are
in scope; anything that writes to the network is not.
