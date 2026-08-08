# claude-chat/

This folder is maintained by **strategy chat sessions** (Claude in the chat app),
not by Claude Code. Purpose: give any session — chat or Claude Code — a durable,
version-controlled place to read/write planning artifacts that used to live only
in Google Drive or a single chat's memory.

## Files here

- **TRACKER.md** — canonical task tracker. Replaces `Tinku_Math_Tracker.xlsx`
  (which had drifted into multiple stale Drive copies — see git history of this
  file for why). Claude Code should update this in the SAME COMMIT as any task
  it completes, exactly like ARCHITECTURE.md.
- **questionnaire-lawyer-dpdp.md** — written questionnaire sent to DPDP counsel.
- **questionnaire-ca-tax-uae-india.md** — written questionnaire sent to a
  UAE/India tax CA. Founder profile: Indian citizen, UAE resident (NRI).
- **dpdp-lawyer-conversation-guide.md** — live-call script companion to the
  lawyer questionnaire.

## Why this exists

As of 2026-07-16: analytics fully removed from MVP (no Firebase Analytics SDK,
zero telemetry, guest or otherwise), and outbound messaging (WhatsApp/email/push
summaries) deferred post-consent-stack — see DECISIONS.md entries dated
2026-07-16. This folder's legal docs reflect that lean-MVP posture.

Read alongside `CLAUDE.md`, `DECISIONS.md`, `STANDARDS.md`, `ARCHITECTURE.md` at
repo root — those remain the primary orientation files for any AI agent working
in this repo. This folder is planning/tracking, not code orientation.

## Note on provenance (2026-07-16)

This folder was originally intended for the GitHub repo (`studyapp`) alongside
CLAUDE.md/DECISIONS.md. The GitHub write connector was non-functional this
session (403 on all writes despite read access and OAuth re-authorization —
reported as a connector bug), so these files live here in Drive as a working
fallback. **Move this whole folder's contents into the repo's `claude-chat/`
path once GitHub write access is restored** — via Claude Code (which has its
own working repo credentials) or a self-hosted GitHub MCP connector.

## Update-test log

- 2026-07-16: MODIFY test — updated this file in place (not just created) to
  confirm the connector handles updates, not only new-file writes. If you're
  reading this line, the update succeeded.
- 2026-08-08: Migrated from Google Drive fallback into this repo via a
  self-hosted GitHub MCP connector, confirming write access is restored.
