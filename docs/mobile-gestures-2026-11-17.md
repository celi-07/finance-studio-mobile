# Mobile navigation and sheet refinement - 17 November 2026

This pass supersedes the tab-selection shape, whole-page reveal and sheet-close descriptions in the earlier visual-parity checkpoint.

## Behavior

- The 66-point floating bar paints every gradient frame over the same full-size bounds, with no inset fill or separate rectangular base. SVG dimensions use the actual layout bounds. The selected lens is a rounded rectangle with a 14-point corner radius.
- Horizontal scrubbing tracks the finger, previews the destination and continuously blends the bar and selection gradients. Releasing selects the nearest tab; cancellation or leaving the bar vertically restores the current tab. Taps, long presses and selected-tab accessibility semantics remain available. Reduce Motion snaps automatic transitions while retaining direct finger tracking.
- Headers, cards and activity rows reveal separately with a small lift and stagger. The page container stays still. Sheet content does not inherit these page reveals, and Reduce Motion settles all items immediately.
- Settings places Finance sheets near the top, with a labeled Add sheet action. Creating a sheet still selects it automatically. The common selector switches existing sheets only.
- All sheets share a full-width, 100-point drag header, left-aligned title, no X control, and a tappable 44-point grabber area. Backdrop, Android back and accessibility escape remain supported. Small drags return to position; dirty entry and management forms preserve drafts behind Keep editing / Discard changes.
- Mobile primary actions use plum (#7046ab to #5c358d, white labels) in light appearance and lavender (#d1b3fa to #bda0e7, #241333 labels) in dark appearance. Endpoint text contrast is at least 6.66:1 in light and 7.69:1 in dark. Other colors retain the website tokens. Both applications follow the device appearance; Settings now says which is active.

## Verification

- Strict TypeScript, all 49 existing financial/concurrency/storage/statement tests, formatting and Expo Doctor (20/20) passed.
- Browser-rendered touch checks covered committed and canceled tab scrubs, intermediate gradient values, a clean downward sheet dismissal, dragging the right side of a dirty header, keeping the typed draft, discarding explicitly, a short drag returning to position, and tappable-grabber dismissal.
- Observed distinct intermediate opacity/translation values for incoming cards, with the page root fixed at opacity 1 and no transform; all items then settled. Reduced-motion checks settled immediately.
- At widths 320, 390 and 768 in light and dark, every navigation gradient frame matched the bar bounds, the selection radius was 14, Settings reported the matching appearance, and the page did not overflow horizontally. Checked the rendered Invest header, primary actions, Settings and sheet title visually. Sheet creation/save was completed against fictional local demo data.
- Production exports passed for iOS (Hermes), Android (Hermes) and web. Physical iPhone gesture feel, VoiceOver and Dynamic Type are still device checks; browser touch simulation and a Hermes bundle do not establish them.

## Design references

Applied the current Apple HIG guidance for [tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [motion](https://developer.apple.com/design/human-interface-guidelines/motion) and [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons). The branded draggable tab bar is a React Native adaptation. Removing the visible close control follows the explicit requested design, with alternate dismissal and unsaved-work protection retained.
