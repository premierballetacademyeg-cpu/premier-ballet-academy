# Original User Request

## 2026-08-29T05:38:34Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval ↚ delegate to teamwork_preview
> Requested team: Full team

Build version 2.0 of the Premier Ballet Academy Management App from scratch in a separate codebase, using the provided 270-parent dataset and Google Sheet backup as the seed data. Understand the flow of the V1 application and enhance it using best practices.

Working directory: `D:\Downloads\Anja Shets\premier-ballet-loyalty\New App`
Integrity mode: development

## Requirements

### R1. Scope Exclusions

- Do NOT include Parent ID screenshot uploads.
- Do NOT include a selectable "Member" box on the parent form. It defaults silently to Member. Loyalty Member remains an optional toggle with a benefits dialog.
- Do NOT include the Wallet feature.
- Do NOT include class/level selection on the parent-facing form. Class assignment is handled purely by staff via roster import or manual notes.

### R2. Customer & Status Model

- Customer Model: Distinguish between New parent (auditioned, not in system), Active parent (existing, tuition paid), and Inactive parent (existing, missed payment).
- Status Columns (Reception List View):
  - Payment status: Active / Inactive
  - Policy status: Accepted / Not Accepted
  - Renewal status: Renewed / Expiring Soon / Expired
  - Card status: Not Issued / Issued – Awaiting Confirmation / Received (plus tag M/LM)

### R3. Flow A ‑ New Parent Registration

- Reception clicks "Add New" → Enters Name + Mobile ↚ System generates Member ID & a blank, unique registration link.
- Staff taps to send an auto-composed WhatsApp message with the link.
- Parent fills full form (guardian/child info, branch, medical), optionally selects Loyalty Member, accepts policy, and submits.
- Auto-email #1 fires confirming receipt.
- Registration fee is paid via Instapay (shown post-submission) and staff verifies receipt.
- Staff verified payment triggers card issuance (Platinum for Member, Gold for Loyalty). Status becomes "Issued – Awaiting Confirmation". Auto-email #2 fires with card details.
- Staff hands over card and marks "Received" (status updates to Received, no re-triggering).

### R4. Flow B ‑ Existing Parent Completion/Renewal

- Staff filters for "Policy: Not Accepted" and bulk-issues personal update links via prefilled WhatsApp messages.
- Parent completes missing info, optionally selects Loyalty, accepts policy, and submits. Auto-email fires. Instapay popup shows if Loyalty is newly selected.
- Reception taps to send a prefilled WhatsApp "Thank you" message.
- "Renew" button (parent or staff side) opens pre-filled form with Instapay popup for tuition. Staff manually updates the renewal date afterward.

### R5. Reception App Interface & Filtering

- Side panel with tabs: Search, New Registration, Renewals.
- Universal search across all columns. Persistent "Add New" button.
- Comprehensive multi-criteria filtering for targeted list generation and WhatsApp broadcasts.

### R6. Data Seeding & Emails

- Seed the database using the provided Google Sheet backup and roster data located in the Goose project folder. Use the provided digital card templates.
- Configure SMTP/API credentials via environment variables for all automated emails using the official custom email address.

## Acceptance Criteria

### Verification

- [ ] **Role-based Agent Verification:** An independent AI agent must verify the application by acting as three different personas:
  1. **Reception Staff:** Verifying they can search, filter, click "Add New", trigger WhatsApp messages, and update card statuses.
  2. **Current Parent:** Verifying they can receive the update form, see missing info, submit it, and see the Instapay popup if upgrading.
  3. **New Registred Parent:** Verifying they can follow the registration link, submit the full form without class selection/ID upload, and receive auto-emails.
- [ ] Each persona must provide written feedback on the pros and cons of the implemented flow.
