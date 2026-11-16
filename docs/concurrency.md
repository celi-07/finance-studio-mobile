# Concurrency contract

## Mobile writes

1. Every form has a synchronous submission latch, catching repeated taps before React renders a disabled button.
2. A session-scoped promise queue serializes mutations. A rejected mutation does not poison later operations. Queued operations are stopped when their store is disposed.
3. New rows use `INSERT`, not unconditional upsert. A draft gets one UUID and keeps it on retry. A duplicate ID is considered a successful retry only when the existing owner-scoped row matches the attempted payload. A different payload fails.
4. Updates and deletes filter by `user_id`, `id`, and the original row values, including nulls, JSON fields, and `updated_at` where present. These predicates are part of the same PostgREST/SQL statement as the mutation. Zero affected rows is a conflict, never a success. Both clients must edit the same originally read version for a conflict to occur; independent rows remain independent.
5. The form retains its original snapshot even when polling refreshes the store. A background refresh cannot silently rebase an unsaved draft. After a conflict, close and reopen the form to review the latest state; copying a changed draft is a deliberate user decision.
6. Writes invalidate outstanding refresh tickets. Only the latest eligible refresh can publish. Refreshes are skipped while writes are pending, then a new refresh starts after the last write settles. Disposed stores cannot publish results into the next account's UI.

The repository always filters on the owner and still relies on the existing signed-user RLS policies for authorization. Client-side JWT inspection only chooses a screen; the database checks OTP proof itself. No privileged API key is used.

The existing database's receipt trigger locks the expense row before checking outstanding amounts, so concurrent receipts against a claim cannot overpay it. Existing unique constraints also arbitrate account names, valuations on the same date, and balance checks on the same date. Mobile surfaces those server rejections and retains the form. This app expects the website's migrations 001–010 to already exist; do not recreate or reset the live database.

## What a frontend cannot guarantee

- The source website at the referenced commit uses unconditional upserts and deletes. A **mobile save after a website change** is guarded. A **website save after a mobile change** can still overwrite data because the website does not supply its original snapshot. Full two-way conflict detection requires changing its write paths to pass the original record and use the same conditional approach. A read-before-upsert check is insufficient because another client can write between those requests.
- For tables without a monotonic version column, value comparisons cannot detect a value changing away and then back (the ABA case). The transactions table additionally supplies its trigger-managed `updated_at`. A future shared version column would strengthen other tables without putting locks in the UI.
- Workspace loads span several tables and requests. They are eventually consistent, not one serializable database snapshot. Keyset pagination avoids offset shifts under insertion; subsequent refreshes pick up changes that occur behind a pagination cursor.
- There is no offline financial write queue and no automatic replay after app termination. If an insert response is lost, retry the still-open draft with its same UUID or refresh and inspect the saved record before creating a new draft. Existing-record uncertain writes may return a conflict on retry even when the first request committed.
- Long field values make snapshot filters longer. A backend version column/RPC is the appropriate extension if large records encounter gateway URL limits.
- Foreground refresh, polling, and Realtime events improve freshness; they do not replace conditional writes. Realtime availability is optional and no publication is changed by this app.

## Staging procedure

Use a test owner and staging project with the website's current migrations, not production financial records.

1. Open the same transaction in mobile and the website. Save a change on the website, then save the original mobile draft. Mobile must show a conflict and leave the draft intact. Close/reopen it and confirm the website's value appears.
2. Open the same transaction in two mobile sessions. Save one, then the other. Exactly one change should succeed from that original version. Repeat for a savings goal and an account.
3. Delay an insert response after the database commits. Retry that same draft. Confirm there is one record with one UUID and a single cash effect. Change the payload while reusing the UUID and confirm it is rejected.
4. Tap Save rapidly while offline. Reconnect and retry. Confirm one submission is active at a time, failures preserve input, and reconnect refreshes data.
5. Make two reimbursement payments whose sum exceeds the remaining claim, from separate sessions. One must be rejected by the existing trigger; balances and claim totals must reconcile after refreshing.
6. Delay a refresh, then save a newer transaction before releasing the old response. The saved result must remain visible. Repeat with overlapping refreshes in reverse completion order.
7. Delay a read, sign out, and sign in as another owner. The previous owner's response must never appear. Repeat while a mutation is queued.
8. Verify the exact `financestudio://auth/callback` redirect in a native development build, test Google/Apple where enabled, complete OTP, background the app through a token refresh, reopen it, and sign out. Confirm the native keychain no longer contains the published session manifest.
9. Compare each report with the website using the same sheet, currency and period, including historical transfers, receipts linked to income, split claims, valuations and balance updates. Export filtered transactions and verify closing balance still reconciles to the whole period.

Automated tests exercise the queue, refresh ordering, account disposal, HTTP mutation predicates, stable-ID retry behavior, keyset pagination, Unicode SecureStore chunking, failed partial storage writes, statement escaping, and the financial model. They use mock PostgREST responses and in-memory storage; live RLS/trigger and device checks above require staging credentials and a device.
