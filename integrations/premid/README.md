# BookJourney PreMiD Integration

This folder contains a BookJourney activity package that targets session pages (`/s/[id]`) and reads state from:

- `#bookjourney-premid-state` (`type="application/json"`)

## Files

- `BookJourney/metadata.json`
- `BookJourney/presence.ts`
- `BookJourney/tsconfig.json`

## Local Development (PreMiD Developer Mode)

1. Install the PreMiD desktop app and browser extension.
2. Enable Developer Mode in the PreMiD extension.
3. Clone the PreMiD activities repository:
   - `git clone https://github.com/PreMiD/Activities.git`
4. Copy this activity into the activities repo:
   - Source: `integrations/premid/BookJourney`
   - Destination: `Activities/websites/B/BookJourney`
5. Inside the activities repository, run:
   - `npx pmd dev BookJourney`
6. Open `https://bookreading.space/s/<sessionId>` and verify Rich Presence updates.

## Validation

Inside the activities repository:

- `npx pmd build BookJourney --validate`

## Store Submission Checklist

1. Ensure `metadata.json` fields are complete and valid.
2. Replace `author.id` (`"0"` placeholder) with your real Discord user id.
3. Verify private or passcode-protected sessions never expose book or reader details.
4. Run `npx pmd build BookJourney --validate` with no errors.
5. Submit a PR to `PreMiD/Activities` following contribution guidelines:
   - https://docs.premid.app/dev/presence/overview
   - https://docs.premid.app/dev/presence/metadata
