# Mobile experience fixes - 17 November 2026

## Completed

- Bundled Finance Studio fonts, logo and light/dark splash configuration, with no forced startup delay.
- Matched sign-in to the supplied card layout: logo, heading, email/password, branded Google control, sign-in and email-code alternative. Verification retains the existing email-code requirement. Expo Go provider sign-in explains the installed-build requirement.
- Replaced the overflowing tab bar with six evenly sized, rounded tabs and safe-area side margins. Labels match screen titles: Overview, Entries, Claims, Invest, Assistant, Settings.
- Hid scroll indicators on all screen, list and dialog scroll views; preserved space below content for the floating navigation and home indicator.
- Split backdrop opacity from sheet translation. Header touch drag dismisses sheets. Entry and management edits ask before discard. Pickers within a sheet expand inline instead of opening another native modal.
- Moved period, currency and route-specific filters into Filters; retained a compact current-filter summary and visible PDF action.
- Removed Overview Add entry actions, including its empty state. Cash by account excludes investment accounts.
- Claims opens an expense reimbursement form by default with full/partial/split claims, saved people and optional due dates.
- Added Add finance sheet beside the picker, and automatically select a newly created sheet. Existing Settings management remains available.
- Fixed transparent inactive web-preview scenes showing through the active screen, and empty-string JSX conditions producing native View text errors.

## Verified

- TypeScript and all 49 financial, statement, storage and concurrency tests passed.
- Prettier check passed; Expo Doctor passed 20/20 checks.
- Production JavaScript/Hermes export passed for iOS, Android and web.
- Inspected rendered sign-in, Overview, claim editor and dark Overview.
- All six screens checked at 320px in light and dark appearance without horizontal overflow. Tab geometry additionally checked at 375, 390, 430 and 768px; narrowest tab hit region exceeded 44px and selected radius was 20px.
- Browser demo interactions saved a partial claim and a two-person split claim, created and selected a separate business sheet, and exercised entry filtering.
- Verified header dismissal using emulated touch events, preserved an unsaved entry with Keep editing, discarded it explicitly, and exercised reduced-motion filters with exactly one dialog while selecting a currency.
- Final six-screen navigation produced zero browser console errors. Existing nonblocking Supabase lock deprecation and development messages remain.

## Device verification still required

This Windows session did not run an iPhone simulator or control a physical phone. iPhone keyboard/safe-area/VoiceOver behavior, actual OAuth callback completion, native sharing and launch artwork in an installed release build require device verification. Expo Go does not reproduce the configured native splash; use an installed build for that check. Browser demo writes used fictional local records, not the signed-in production account.

Web menu labels were changed separately in the web repository, keeping existing URL hashes and internal data/report identifiers. Scoped ESLint, TypeScript, Next.js production build and local browser navigation passed. The repository default vinext build has a pre-existing missing .openai/hosting.json configuration; Vercel uses the validated Next.js path.
