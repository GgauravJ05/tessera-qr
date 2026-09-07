# Bundled fonts

Both families are self-hosted rather than loaded from Google Fonts, so the app
makes no third-party network request. See `src/assets/fonts.css`.

| Family         | Version            | Licence                               | Upstream                           |
| -------------- | ------------------ | ------------------------------------- | ---------------------------------- |
| Inter          | v20 (Google Fonts) | SIL OFL 1.1 — `Inter-OFL.txt`         | https://rsms.me/inter/             |
| JetBrains Mono | v24 (Google Fonts) | SIL OFL 1.1 — `JetBrainsMono-OFL.txt` | https://www.jetbrains.com/lp/mono/ |

Only the `latin` and `latin-ext` subsets are bundled. Both files are variable
fonts, so one file per subset covers the whole weight range.

The SIL Open Font License permits bundling and redistribution with the
application; it does not require the application itself to be OFL-licensed.
