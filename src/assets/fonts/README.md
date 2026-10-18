# Bundled fonts

Both families are self-hosted rather than loaded from Google Fonts, so the app
makes no third-party network request. See `src/assets/fonts.css`.

| Family         | Version            | Licence                               | Upstream                                |
| -------------- | ------------------ | ------------------------------------- | --------------------------------------- |
| Archivo        | v5 (Fontsource)    | SIL OFL 1.1 — `Archivo-OFL.txt`       | https://github.com/Omnibus-Type/Archivo |
| JetBrains Mono | v24 (Google Fonts) | SIL OFL 1.1 — `JetBrainsMono-OFL.txt` | https://www.jetbrains.com/lp/mono/      |

Only the `latin` and `latin-ext` subsets are bundled. Both are variable
fonts. Archivo's files carry the weight (100–900) and width (62–125%) axes,
so one file per subset covers the whole range.

The SIL Open Font License permits bundling and redistribution with the
application; it does not require the application itself to be OFL-licensed.
