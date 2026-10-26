# feedback-annotation

[Agentation](https://www.npmjs.com/package/agentation) plus a **Send All n Feedbacks** tab on the right edge of the page. Testers annotate any page with Agentation; the tab collects the notes from every page into one report and shares it by Copy, WhatsApp, Telegram or Email.

For internal dev and staging sites only. Don't ship the tag to production.

## Use

Add one tag to the page. It must be `type="module"`.

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js?app=MyApp"></script>
```

`@1` gets every 1.x release automatically and never a breaking 2.0.

## Parameters

Add them to the script URL.

| Parameter | Effect | Default |
|---|---|---|
| `app` | Name in the report header, the email subject and Agentation's app name | `TestApp` |
| `hide` | Comma list of share channels to remove: `whatsapp`, `telegram`, `email`. Copy and Clear all always show. | nothing hidden |
| `hide_all_feedback_button` | `true` removes the tab and drawer; Agentation's own toolbar stays | `false` |

```html
<!-- Email and Copy only -->
<script type="module" src="https://cdn.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js?app=MyApp&hide=whatsapp,telegram"></script>

<!-- Agentation only, no tab -->
<script type="module" src="https://cdn.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js?app=MyApp&hide_all_feedback_button=true"></script>
```

## How it works

- Loads React 19.3.0 and Agentation 3.x from [esm.sh](https://esm.sh), with one React shared by both. Agentation updates within 3.x automatically.
- Notes stay in each tester's browser (`localStorage`); nothing is sent anywhere until the tester shares or copies the report.
- The tab and drawer follow Agentation's light/dark theme toggle.
- Run the demo locally with any static server, e.g. `python3 -m http.server`, then open `index.html`.

## Release

1. Commit, then tag with the next version and push the tag:
   ```sh
   git tag v1.0.1
   git push origin v1.0.1
   ```
   Use a patch or minor bump for fixes and new options. Only bump to `v2.0.0` for a breaking change; apps on `@1` won't get it.
2. jsDelivr caches what `@1` points to. Open this once so apps get the new version straight away:
   https://purge.jsdelivr.net/gh/ets-tech/feedback-annotation@1/feedback-annotation.js
