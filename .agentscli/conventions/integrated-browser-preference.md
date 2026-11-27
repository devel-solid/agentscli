---
trigger: Read when choosing a browser to open or interact with a web page, including fallback to a host browser.
---

# Integrated browser preference

When a task requires opening or interacting with a web page in a browser, prefer the browser integrated into the agent's execution environment. An integrated browser is a browsing surface the environment itself provides for the agent to inspect and control. Identify that capability through available tools and environment instructions, independently of vendor, product, or tool names. Its integration can provide richer inspection, control, and task continuity.

Choose according to the environment's capabilities and their availability in the current session:

- If an integrated browser is provided and available, use it.
- If the environment provides no integrated browser, use the host browser.
- If the environment provides an integrated browser but it is unavailable in this session, pause the browser-dependent step, explain the impediment, and obtain the user's explicit authorization before switching to the host browser.
- If the environment's browser capabilities are uncertain, inspect the available tools and instructions. If uncertainty remains, clarify it with the user before assuming host fallback is authorized. A missing session tool alone does not establish that the environment provides no integrated browser.

A failure or capability limitation of the integrated browser also requires explaining the impediment and obtaining authorization before moving to the host browser. Continue independent work while the browser-dependent step is paused. An explicit user choice of browser takes precedence over this default; reuse an existing authorization for host fallback within its granted scope.

For example, an environment documents an integrated browser, but the current session exposes only host browser controls. Explain that the integrated browser is unavailable and ask whether to continue in the host browser. Opening the host browser silently would treat a session limitation as permission to switch. In an environment documented to offer only host browser controls, use those controls directly; there is no integrated browser to prefer.

This preference applies when browser interaction is needed. If a dedicated tool can complete the task directly, it does not require opening a browser merely to follow this preference.
