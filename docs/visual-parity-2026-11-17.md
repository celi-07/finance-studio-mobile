# Website/mobile visual parity - 17 November 2026

- Add finance sheet is available only in Settings > Finance sheets > Add. The common sheet selector switches between existing sheets.
- Navigation uses a 66-point capsule, clipped rounded background layers, rounded 54-point selection, route-specific colors, and a spring-driven selection lens. Tab icons respond subtly to selection and press.
- Page changes reveal the incoming content with a 13-point lift and fade over 380ms, borrowing the website reveal curve while keeping native tab state. Reduce Motion removes both travel and selection animation, and changing tabs cancels the previous animation immediately.
- Shared text excludes Android font padding; headings use tighter leading. Screen heading/action rows are centered with a common minimum height. Summary rows reserve space for monetary amounts and let their labels wrap. Large balance headings fit their full amounts onto one line on narrow phones.
- src/ui/website-palette.json records the source web commit and all 37 color tokens for each appearance, 13 category colors and effect colors. Native SVG paints reproduce the website linear/radial layers, color mixes and route mappings for canvas, panels, cash header, summary rows, navigation, selection, primary actions and glyphs. Background dimensions adapt to the native viewport; no screenshot or WebView is used.
- The website uses the same identical Regular and Bold Plus Jakarta Sans font files already bundled in mobile. Body and secondary copy use real 400; headings, amounts, primary labels and selected navigation use real 700. Browser font synthesis is disabled. Supporting copy stays visually lighter through size and the existing muted color, without introducing an unavailable thin font.

## Verification

Strict TypeScript, all 49 existing tests, formatting and Expo Doctor (20/20) passed. Production export passed on iOS, Android and web. Verified all 37 palette tokens per appearance against current website CSS and verified identical font bytes.

Browser checks covered all six native-rendered web screens at 320, 390 and 768 pixels in both appearances: no page overflow and zero screen-heading/action center offset. Settings retained working sheet creation; no shared Add sheet action remained. Observed intermediate and settled animation values, immediate settled values with Reduce Motion, and a retained navigation state. Rendered Invest and Overview were visually inspected. This is browser rendering and simulated preference testing; physical iPhone motion, VoiceOver and Dynamic Type remain to be verified on the phone.

The website Next.js production build, TypeScript and scoped lint passed. Both font faces loaded with correct computed 400/700 weights. All six website destinations fit 320, 390 and 1280 pixels; summary amounts stay unbroken and sidebar branding stays on one line. The Overview also passed a 200% web text-size check after constraining navigation labels and chart tips. No database changes or financial behavior changes.
