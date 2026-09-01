# Google Sheets Deployment Status

On 27 August 2026, the application was updated to the latest supplied Apps Script Web App endpoint. The authenticated handshake passed, confirming that the protected application and deployed Apps Script now share the same authorization value.

The bound workbook was initialized with `setupPremierBalletWorkbook()`. The authoritative central roster snapshot completed successfully: the Members tab now contains **269 member records plus one header row (270 rows total)**. The Academy visually confirmed this result in the Google Sheet.

The previously failed `parent_update.confirmed` event was retried after the mirror was online and is now recorded as `synced` by the central application. The one-way mirror is configured to create or update the relevant sheet row from centrally authorized registration and parent-update events without attempting to validate app-only personal-update tokens. A real post-recovery new-parent registration remains to be verified separately.

The central application database remains the source of truth. Google Sheets is the operational mirror and review workspace.
