# Fixing "408 / hung up" on git push (large history)

Your push is ~364 MB because **earlier commits** added `.next/` and `node_modules/` to the repo. Those are now in `.gitignore`, but they remain in git history, so the server still receives them and can timeout (HTTP 408).

## What was done

- **`dist/`** (old Vite build) has been removed from tracking and committed.
- **`.gitignore`** already excludes `.next/`, `node_modules/`, and `dist/`.

## Option A: One clean commit (recommended)

Rewrite your local commits into a single commit that only contains the current tree (no `.next` or `node_modules` in history). Then force-push.

```bash
# Save current branch name
BRANCH=$(git branch --show-current)

# Point branch at remote; your work stays in the working tree
git reset --soft origin/simon-web-app

# Unstage everything
git reset

# Re-add everything; .gitignore will skip .next, node_modules, dist
git add .

# One new commit with all current changes
git commit -m "Next.js app: dashboard, auth, Task 4 middleware, etc."

# Push (will be much smaller). Use --force-with-lease to avoid overwriting others’ work
git push --force-with-lease origin "$BRANCH"
```

After this, future pushes will stay small as long as you don’t commit `.next/` or `node_modules/`.

## Option B: Keep history, try a bigger buffer

If you prefer not to rewrite history:

```bash
# Allow larger HTTP buffer (500 MB)
git config http.postBuffer 524288000

# Try push again (may still timeout if the server has a short limit)
git push origin simon-web-app
```

If the server or network still times out, use Option A.

## Avoid committing build artifacts again

- Never run `git add .` without checking that `.next/`, `node_modules/`, and `dist/` are ignored.
- Your current `.gitignore` already lists them; just avoid `git add -f` on those paths.
