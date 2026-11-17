# Finance Studio Mobile

Native React Native + Expo companion to [Finance Studio](https://finance-studio-ten.vercel.app/), ported from [celi-07/finance-studio](https://github.com/celi-07/finance-studio) at `189b5f77cfa9c3a6250b89575d27fb836a12a613`.

The app preserves the website's logo, pastel gradients, rounded panels, route colors, six navigation sections, light/dark themes, financial calculations, validation, 20 currencies, and Asia/Jakarta reporting dates. The interface uses native components, not a WebView.

## Run

Use Node 24 LTS and npm.

```sh
npm ci
npm start
```

Open with a matching Expo Go version, or build a development client. The project uses Expo SDK 58 / React Native 0.88. Run `npm run android` or `npm run ios` for an installed emulator/simulator, and `npm run web` for a browser build. Local iOS builds require macOS; EAS supports cloud builds from Windows.

The app defaults to the existing website's **public** Supabase project settings in `src/data/public-config.ts`. Sign in with your existing account to see the same records. **Explore the demo** opens fictional, device-local records without signing in or writing to Supabase.

To override the project, copy `.env.example` to `.env.local` and supply both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Restart Metro after changing environment variables. Explicitly leaving both empty enables standalone demo mode. Never put a service-role key, database password, or OAuth client secret in the app.

## Mobile navigation and forms

The six destinations are **Overview, Entries, Claims, Invest, Assistant, Settings**. The floating tab bar keeps side margins and rounded selected tabs. All screens scroll without visible scroll indicators, with space reserved above the home indicator and tab bar.

Reporting screens use **Filters** for period, currency and screen-specific search/type/account or claim/person filters. Current period and currency remain visible above the report. Overview has no Add entry action; record expenses and income in Entries. Claims opens a reimbursement form with full, partial and split amounts, payer and optional due date. Use **Settings > Finance sheets > Add** to create a business sheet; a newly created sheet becomes selected automatically.

Sheets fade the dimmed background separately from the sliding content. Drag the header down or tap Close to dismiss. Unsaved entry and management forms offer Keep editing or Discard changes. Pickers inside sheets expand in place, avoiding stacked native modals.

The app bundles the licensed Plus Jakarta Sans fonts and light/dark splash artwork. The branded native launch configuration requires a new installed build. Expo Go does not fully reproduce native splash screens; the React loading view displays the same identity while fonts and authentication restore. No artificial launch delay is added.

## Authentication setup

The existing database's owner policies and email-code requirement remain in force. Existing accounts can use an email code immediately if email OTP delivery is enabled. Password and provider sessions must complete the same email-code check before loading records.

For Google/Apple OAuth in a development or production build, add this exact URL to the existing Supabase project's **Authentication → URL Configuration → Redirect URLs**:

```text
financestudio://auth/callback
```

The mobile flow uses Supabase PKCE and the device's system authentication browser. Keep the providers' existing Supabase callback URL. `EXPO_PUBLIC_AUTH_MODE` controls provider buttons (`google`, `transition`, `oauth`, or `email`). Custom-scheme OAuth needs a development/production build; use email OTP when trying the app in Expo Go. [Supabase mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) · [Expo authentication](https://docs.expo.dev/guides/authentication/)

Native sessions are chunked and stored in Expo SecureStore. Writes publish a new session only after all chunks exist. Refresh starts/stops with the app lifecycle, and Supabase's `processLock` serializes auth operations. Demo data uses AsyncStorage; real financial records are kept in memory and loaded from the existing backend.

## Features

| Section   | Mobile behavior                                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview  | Cash balance, cash flow, summaries, spending breakdown, recent activity, account balances, currency summaries, activity calendar, savings goals, wealth and income/expense charts |
| Entries   | Virtualized activity list, search/type/account filters, add/edit/delete, transfers, contributions/withdrawals, custom fields, split reimbursement claims                          |
| Claims    | Outstanding claims, status/person filters, record a deposit, link an existing income payment, inspect and remove individual payments                                              |
| Invest    | Portfolio estimates, contributions/withdrawals, create and edit valuations                                                                                                        |
| Assistant | Same local English/Indonesian draft parser as the website, follow-up revisions, manual review before saving                                                                       |
| Settings  | Manage accounts, currencies, categories, custom fields, saved people and sheets; archive records; record weekly/monthly balances; sign out                                        |

All four reporting screens share A4 PDF statements through the native share sheet. Transaction exports respect active filters while preserving the full-period running balance. HTML output escapes user data. Web uses the browser print dialog. PDFs use platform fonts, so their typography differs from the website's embedded-font PDF generator.

Desktop spreadsheet entry, combined multi-claim payment management, whole-sheet deletion, signup/password recovery, and custom-field reordering remain available on the website. Combined payments from the website are included correctly in mobile balances and reports; the app does not delete one constituent of a combined payment. All supported mobile changes use the existing tables and triggers. No new database, server, migrations, or deployment of the website is required.

## Concurrent use

Mobile edits/deletes use a single conditional database statement matching the originally viewed row. Conflicts keep the draft open and tell the user to reopen the record. New-record retries reuse a stable UUID. Device writes are serialized, double-taps are latched, older refreshes cannot replace newer results, and changing accounts disposes the previous store. Data refreshes on foreground/reconnect, every 30 seconds while active, and on Realtime events if the existing project publishes those tables.

**The existing website still uses unconditional upserts.** Mobile detects website changes that precede its save, but an old website tab can still overwrite a mobile change afterward. Full protection in both directions requires conditional writes in that website as well. This repository does not silently change or deploy the website. See [the concurrency contract](docs/concurrency.md), including limitations and a staging test procedure.

## Validate and build

```sh
npm run check
npx expo-doctor
npx expo export --platform all
```

`npm run check` runs strict TypeScript and the financial, concurrency, session storage, and statement tests. The export verifies production JavaScript/Hermes bundles for Android, iOS, and web; it does not produce a signed installable app or replace device testing.

```sh
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform all
```

EAS setup requires your Expo account/project and signing credentials. Profiles are supplied in `eas.json`. Run the staging checks in `docs/concurrency.md` with separate website/mobile sessions before distributing a signed build.

## Source layout

`src/domain` contains the reused financial model and parser; `src/data` contains Supabase, demo storage, secure session storage, and native export adapters. `src/state` handles auth, session-scoped stores, report selection, and the mutation queue. `src/screens`, `src/components`, and `src/ui` contain the native interface. The source website is referenced above; its checkout and local build output are not included.
