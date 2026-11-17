# Mobile refresh and safe areas - 17 November 2026

This pass supersedes the selection-radius and Add sheet placement in the previous gesture checkpoint.

- Pull-to-refresh state is local to the requested screen and separate from background synchronization. A short minimum visibility interval commits the controlled native spinner even when demo data resolves immediately. Cloud reads accept cancellation; the store aborts timed-out, superseded or disposed reads and cleans up remaining requests on completion/failure. Each read has a 15-second deadline. Failure preserves displayed data and exposes retry. Foreground/reconnect/poll/Realtime updates reuse an active read without resetting its deadline.
- Add sheet appears beside the Settings title, before the finance-sheet selector and account card. It opens the same management form and still selects a newly saved sheet automatically. Other screens retain only existing-sheet selection.
- Selection uses the same 33-point corner-radius value as the floating bar and a larger footprint around the icon and text, retaining gradients and horizontal scrubbing.
- Root safe-area metrics initialize immediately. Screen layout explicitly applies the current top and side insets, with existing scroll clearance above the tab bar/home indicator. Sheets reserve top/side insets outside their keyboard-aware frame and bottom inset plus spacing inside their scroll content, so the title and final action remain reachable in portrait and landscape.

## Evidence and limits

54 tests pass, including new cases for stalled/initial-load timeout, retry and late stale results, background request sharing, synchronous failure recovery and cloud request cancellation. TypeScript passes. Formatting, Expo Doctor (20/20) and production exports for iOS, Android and web also passed.

Browser rendering with safe-area emulation checked all six tabs at 320 x 740 with top 59/bottom 34, and 844 x 390 with side 59/bottom 21. Every selected icon/label bounding-box corner fit inside the indicator's rounded shape. Settings Add sheet was visible without scrolling. At 390 x 844, the tall sheet header started at y=67 (top inset + 8); its final Save ended at y=792 (bottom inset + 18 above the screen edge). Landscape Save ended at y=351 with a 21-point bottom inset. Creating and saving a sheet worked against fictional demo data. Physical iPhone pull-to-refresh behavior, keyboard changes and system chrome still require device validation.

References: [Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout), [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators), [React Native RefreshControl](https://reactnative.dev/docs/refreshcontrol), [Expo safe area context](https://docs.expo.dev/versions/latest/sdk/safe-area-context/), and [Supabase cancellation](https://supabase.com/docs/reference/javascript/db-abortsignal).
