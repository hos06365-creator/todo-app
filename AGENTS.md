# AGENTS.md

## Project Overview

This folder contains a simple Todo List web app built with only HTML, CSS, and JavaScript.

Files:

- `index.html`: page structure and links to CSS/JS
- `style.css`: Material-style responsive UI
- `script.js`: Todo behavior, drag and drop, priority handling, and localStorage

No framework, bundler, package manager, or build step is used.

## Current Features

- Add a todo with the add button
- Add a todo with the Enter key
- Prevent empty or whitespace-only todos
- Mark todos as completed
- Delete todos
- Save and load todos with `localStorage`
- Preserve data after refresh
- Set priority when adding a todo: high, medium, low
- Change priority on existing todos
- Drag and drop todos to reorder them
- Drag a todo into another vertical priority section to change its priority

Todo data uses this shape:

```js
{
  id: Number,
  text: String,
  priority: "high" | "medium" | "low",
  completed: Boolean
}
```

Older saved todos may not have `priority`; treat missing priority as `"medium"`.

## UI Direction

Keep the interface narrow and mobile-friendly. The user explicitly disliked wide, desktop-like layouts on mobile.

Important UI decisions:

- Do not use side-by-side priority columns.
- Priorities should be separated vertically: high, medium, low.
- Use color to reinforce priority:
  - high: red
  - medium: yellow
  - low: green
- Keep the main app card narrow, around mobile width.
- Maintain a Material-style look: cards, soft shadows, rounded controls, clear touch targets.
- Keep the purple/white theme for the overall app.
- The title should keep the rounded/neon style.

Mobile behavior:

- The app should feel like a phone-width layout, not a stretched desktop layout.
- Input, priority selector, and add button stack vertically on small screens.
- Todo rows should be compact.
- Priority controls and delete buttons should not stretch across the full width unless necessary.

## Implementation Notes

- Keep code beginner-friendly.
- Use plain DOM APIs only.
- Include short comments for important logic.
- Do not introduce libraries unless explicitly requested.
- Keep `index.html`, `style.css`, and `script.js` separated.
- Preserve `localStorage` compatibility when changing the todo data shape.

Drag and drop behavior:

- Same priority section: reorder todos.
- Different priority section: update the dragged todo's priority and move it.
- Dropping into empty section space should move the todo to the bottom of that section.

## Running

The app can be opened through `index.html`, but WSL `file://` paths may trigger browser security warnings.

Preferred local run method:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

If port `5500` is already in use, choose another port.

