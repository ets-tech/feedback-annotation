# feedback-annotation

[Agentation](https://www.npmjs.com/package/agentation) plus a **Send All n Feedbacks** tab on the right edge of the page. Testers annotate any page with Agentation; the tab collects the notes from every page into one report and shares it by Copy, WhatsApp, Telegram or Email.

For internal dev and staging sites only. Don't ship the tag to production.

**Demo:** https://ets-tech.github.io/feedback-annotation/

## Use

Add one tag to the page. It must be `type="module"`.

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js?app=MyApp"></script>
```

`@1` gets every 1.x release automatically and never a breaking 2.0.

For the minified file, ask for `feedback-annotation.min.js` instead; jsDelivr minifies it on the fly, and the parameters work the same:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.min.js?app=MyApp"></script>
```

## Parameters

Add them to the script URL.

| Parameter | Effect | Default |
|---|---|---|
| `app` | Name in the report header, the email subject and Agentation's app name | `TestApp` |
| `hide` | Comma list of share channels to remove: `whatsapp`, `telegram`, `email`. Copy and Clear all always show. | nothing hidden |
| `hide_all_feedback_button` | `true` removes the tab and drawer; Agentation's own toolbar stays | `false` |
| `post_url` | Adds **Post to server** to the drawer, which POSTs every note as JSON to this URL. URL-encode it. | not set |
| `post_token` | Sent as `Authorization: Bearer <token>` with each post | not set |
| `post_label` | Label of the post button in the drawer and the Clear all dialog | `Post to server` |

```html
<!-- Email and Copy only -->
<script type="module" src="https://cdn.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js?app=MyApp&hide=whatsapp,telegram"></script>

<!-- Agentation only, no tab -->
<script type="module" src="https://cdn.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js?app=MyApp&hide_all_feedback_button=true"></script>
```

## Post to server

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js?app=MyApp&post_url=https%3A%2F%2Fapi.example.com%2Ffeedback&post_token=abc123"></script>
```

**Post to server** sends one `POST` with a JSON array: every note on every page, plus the notes deleted since the last successful post. Notes stay in the browser after posting, so posting again re-sends them.

```json
[
  {
    "hash": "3b7aad47…",
    "deleted": false,
    "app": "MyApp",
    "deviceId": "e8c79f40-0b4e-4847-b5b7-f09ef45e5732",
    "origin": "https://staging.example.com",
    "url": "https://staging.example.com/orders?date=2026-10-01#tab=2",
    "path": "/orders",
    "query": "?date=2026-10-01",
    "fragment": "#tab=2",
    "userAgent": "Mozilla/5.0 …",
    "viewport": "1440×900",
    "devicePixelRatio": 2,
    "sentAt": "2026-10-26T10:00:00.000Z",
    "agentation": {
      "id": "1793012632233",
      "comment": "Make the heading bigger",
      "element": "h1",
      "elementPath": "body > h1",
      "timestamp": 1793012632233,
      "…": "the other Agentation fields below"
    }
  },
  { "hash": "9c1e…", "deleted": true, "app": "MyApp", "deviceId": "e8c79f40-…", "deletedAt": "2026-10-26T09:58:12.000Z", "agentation": { "id": "1793000000000" } }
]
```

- `hash` is the SHA-256 of `app + origin + deviceId + agentation.id`. It stays the same when the note is edited, so **upsert by `hash`**. `deviceId` is a random id kept per browser, so two testers' notes never share a hash.
- `deleted: true` items are notes the tester deleted. What to do with them is up to the server; a hash it has never seen can be ignored.
- **Clear all** first posts every note as deleted and clears nothing unless the server answers 2xx. If some notes were never posted, or were edited since, the dialog says so and offers **Post to server**.
- Any 2xx is success; the response body is ignored. A failure shows "Failed (status)" and logs the status and response body to the console.

### Fields

Headers: `Content-Type: application/json`, plus `Authorization: Bearer <token>` when `post_token` is set.

Top level, added by this script:

| Field | Type | Meaning |
|---|---|---|
| `hash` | string | SHA-256 hex of `app + origin + deviceId + agentation.id`; the upsert key |
| `deleted` | `false` | A live note |
| `app` | string | The `app` parameter |
| `deviceId` | string | Random id kept per browser |
| `origin` | string | The site's origin, e.g. `https://staging.example.com` |
| `url` | string | Full address of the page the note was made on, with query and fragment |
| `path` | string | Its path, e.g. `/orders` |
| `query` | string | Its query string with the `?`, or empty |
| `fragment` | string | Its `#` part, e.g. `#/orders/42` on hash-routed apps, or empty |
| `userAgent` | string | Captured at send time |
| `viewport` | string | `width×height`, at send time |
| `devicePixelRatio` | number | At send time |
| `sentAt` | string | ISO time of the post |
| `agentation` | object | The note exactly as Agentation stores it, below |

Inside `agentation`, from Agentation 3.1.2. Optional fields are left out when empty, never sent as `null`.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Creation time in ms; unique only per browser, hence `hash` |
| `comment` | string | The tester's feedback |
| `element` | string | Readable name of the clicked element |
| `elementPath` | string | Short CSS path |
| `timestamp` | number | Creation time in ms |
| `x`, `y` | number | Marker position: % from left, px from top |
| `selectedText`, `nearbyText` | string | Text selected, or text near the element |
| `boundingBox` | object | `{x, y, width, height}` of the element |
| `fullPath` | string | Full DOM path |
| `cssClasses`, `computedStyles`, `accessibility`, `nearbyElements` | string | Element details |
| `reactComponents`, `sourceFile` | string | React component tree and source file, when detectable |
| `attributes` | object | The element's attributes |
| `isMultiSelect`, `isFixed` | boolean | Several elements selected; element is position-fixed |
| `elementBoundingBoxes` | array | Boxes of each element in a multi-select |
| `frame` | object | Iframe path and position, for notes inside an iframe |
| `kind` | string | `feedback`, `placement` or `rearrange` |
| `placement`, `rearrange`, `drawingIndex` | object / number | Details for layout notes and drawings |
| `intent`, `severity`, `status` | string | `fix`/`change`/`question`/`approve`; `blocking`/`important`/`suggestion`; `pending`/`acknowledged`/`resolved`/`dismissed` |
| `thread` | array | `{id, role, content, timestamp}` replies |
| `url`, `createdAt`, `updatedAt`, `resolvedAt`, `resolvedBy`, `authorId`, `sessionId` | string | Agentation's sync metadata, when present. For the page, use the top-level `url`. |

A deleted note carries only `hash`, `deleted: true`, `app`, `deviceId`, `deletedAt` and `agentation: { id }` (ISO time it was deleted, or of the Clear all).

The server must:

- Answer the CORS preflight: `OPTIONS` returning `Access-Control-Allow-Origin: <the site's origin>` and `Access-Control-Allow-Headers: Authorization, Content-Type`. No cookies are sent.
- Check the `Origin` header against the sites it expects.
- Treat the token as public. It sits in the page's HTML, so anyone who can open the page can read it. Make it write-only and good for this endpoint alone.

## How it works

- Loads React 19.3.0 and Agentation 3.1.2 from [esm.sh](https://esm.sh), with one React shared by both. Both are exact versions; upgrading Agentation means changing its version in `feedback-annotation.js`, testing, and releasing.
- Notes stay in each tester's browser (`localStorage`); nothing is sent anywhere until the tester shares, copies or posts the report.
- The tab and drawer follow Agentation's light/dark theme toggle.
- Run the demo locally with any static server, e.g. `python3 -m http.server`, then open `index.html`.

## Release

1. Commit, then tag with the next version and push the tag:
   ```sh
   git tag v1.0.1
   git push origin v1.0.1
   ```
   Use a patch or minor bump for fixes and new options. Only bump to `v2.0.0` for a breaking change; apps on `@1` won't get it.
2. jsDelivr caches what `@1` points to. Open both once so apps get the new version straight away:
   - https://purge.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js
   - https://purge.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.min.js
