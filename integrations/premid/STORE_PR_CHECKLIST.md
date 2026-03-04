# PreMiD Store PR Checklist (BookJourney)

## 1) Metadata

- [ ] `integrations/premid/BookJourney/metadata.json` has valid JSON.
- [ ] `author.id` is your real Discord user ID (not `"0"`).
- [ ] `service`, `url`, `regExp`, `version`, `description`, and `tags` are correct.

## 2) Presence Behavior

- [ ] Activity appears only on `/s/[id]` pages.
- [ ] Activity clears on non-session routes (`/`, `/dashboard`, etc.).
- [ ] Join screen shows generic status.
- [ ] Active public session shows role/queue-aware status.
- [ ] Ended session shows ended-state status.
- [ ] Private or passcode-protected sessions never expose sensitive details.

## 3) Local Validation

- [ ] Clone `PreMiD/Activities`.
- [ ] Use a temporary local activity name (example: `BookJourneyLocal`) before push/PR.
- [ ] Copy `integrations/premid/BookJourney` to `Activities/websites/B/BookJourneyLocal`.
- [ ] In copied `metadata.json`, set `service` to `BookJourneyLocal`.
- [ ] Run `npx pmd dev BookJourneyLocal` and verify live updates.
- [ ] Run `npx pmd build BookJourneyLocal --validate` with no errors.

## 4) PR Submission

- [ ] Commit only BookJourney activity files expected by PreMiD.
- [ ] Rename back to official naming before PR:
- [ ] Folder: `BookJourney`
- [ ] `metadata.json` service: `BookJourney`
- [ ] Validation command: `npx pmd build BookJourney --validate`
- [ ] Include a short demo (gif/video/screenshots) for:
  - join screen
  - active public session
  - private/passcode-protected session
  - ended session
- [ ] Link to BookJourney production URL (`https://bookreading.space`).
