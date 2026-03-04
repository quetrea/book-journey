# BookJourney PreMiD Integration

This folder contains a BookJourney activity package that targets session pages (`/s/[id]`) and reads state from:

- `#bookjourney-premid-state` (`type="application/json"`)

## Files

- `BookJourney/metadata.json`
- `BookJourney/presence.ts`
- `BookJourney/tsconfig.json`

## Local Development (PreMiD Developer Mode)

Use a temporary local activity name before push/PR. Do not install under `BookJourney` yet.
Example local name used below: `BookJourneyLocal`.

1. Install the PreMiD desktop app and browser extension.
2. Enable Developer Mode in the PreMiD extension.
3. Clone the PreMiD activities repository:
   - `git clone https://github.com/PreMiD/Activities.git`
4. Copy this activity into the activities repo:
   - Source: `integrations/premid/BookJourney`
   - Destination: `Activities/websites/B/BookJourneyLocal`
5. (Local-only) update `metadata.json` in that copied folder:
   - Set `"service": "BookJourneyLocal"`
6. Inside the activities repository root (`PreMiD/Activities`), run:
   - `npx pmd dev BookJourneyLocal`
7. Open `https://bookreading.space/s/<sessionId>` and verify Rich Presence updates.

## Validation

Inside the activities repository root (`PreMiD/Activities`):

- `npx pmd build BookJourneyLocal --validate`

If you run this command outside `PreMiD/Activities`, validation will fail because the activity folder cannot be resolved.

## Store Submission Checklist

1. Ensure `metadata.json` fields are complete and valid.
2. Replace `author.id` (`"0"` placeholder) with your real Discord user id.
3. Verify private or passcode-protected sessions never expose book or reader details.
4. Run `npx pmd build BookJourneyLocal --validate` with no errors.
5. Submit a PR to `PreMiD/Activities` following contribution guidelines:
   - https://docs.premid.app/dev/presence/overview
   - https://docs.premid.app/dev/presence/metadata

## Notes Before Submitting

1. Replace `metadata.json -> author.id` (`"0"`) with your real Discord user ID.
2. Keep privacy behavior as-is:
   - private or passcode-protected sessions must stay generic in Rich Presence
   - do not expose book title, author, or reader names for protected sessions
3. Before opening Store PR, rename the activity back to official naming:
   - folder: `BookJourney`
   - metadata `service`: `BookJourney`
   - commands: `npx pmd dev BookJourney` and `npx pmd build BookJourney --validate`
