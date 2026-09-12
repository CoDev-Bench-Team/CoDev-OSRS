---
name: create-pr
description: Create a pull request to main with a description from the branch diff and spec/plan/tasks when present.
user-invocable: true
---

# Create Pull Request

Create a pull request to **`main`** from the current branch. Description comes from git history plus this repo’s spec artifacts — not an invented API contract and not a hardcoded tracker workspace.

## Instructions

1. **Gather git context** in parallel:
   - `git branch --show-current`
   - `git status -sb`
   - `git log main..HEAD --oneline`
   - `git diff main...HEAD --stat`
   - `git log origin/main..HEAD` if `origin/main` exists

2. **If there are uncommitted changes**, warn and ask whether to proceed (do not stage unless the user asked to commit).

3. **If the branch has no commits ahead of `main`**, stop and say so.

4. **Load product context** when present (do not invent HTTP):
   - `AGENTS.md` constitution
   - Active `spec.md` / `plan.md` / `tasks.md` under `specs/` (see `specs/ACTIVE_WORKFLOW.md` or `specs/001-office-supplies-mvp/`)
   - PR title/body should match the spec’s why, not chat memory

5. **Optional tracker IDs** (Linear, GitHub Issues, ClickUp, …):
   - If commit messages or the user supply a task ID, include a link
   - If none, omit the tracker section — do not use a workspace ID from another product

6. **Push** the branch if needed: `git push -u origin HEAD`

7. **Create the PR**:

   ```bash
   gh pr create --base main --title "TITLE" --body "BODY"
   ```

   Body:

   ```markdown
   ## Summary
   - …

   ## Test plan
   - [ ] …
   ```

   Title: short, imperative, matches the change (docs/feat/fix). No requirement to use `type[id]:` unless the team is already using that on the branch.

8. **Return the PR URL.**

## Notes

- Default base branch for this repository is `main`, not `dev`.
- Do not add a server, database, or REST `api.md` in the PR unless an ADR and the backend contract say so.
