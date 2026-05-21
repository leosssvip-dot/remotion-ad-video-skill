# AGENTS.md

Project standard for this repository.

Standard, concise, efficient. Work from the real repo state, keep scope tight, and never claim completion without targeted evidence.

## Project Scope

- This repo maintains the `remotion-ad-video` Codex skill.
- Source of truth for the skill: `skills/remotion-ad-video/`.
- Remotion template source: `skills/remotion-ad-video/assets/remotion-template/`.
- Public snapshot output: `dist/open-source-snapshot/`. Treat it as generated; do not edit it by hand.
- Main scripts live in `scripts/`; use the repo `npm` scripts before inventing new commands.
- This checkout may not be a git repository. Check `git rev-parse --show-toplevel` before assuming commit or diff behavior.

## Definition Of Done

A task is done only when:

- The requested behavior or acceptance criteria are met.
- The diff is scoped to the requested surface.
- Verification matches the risk and changed files.
- Workflow-file changes run `node scripts/validate-agent-workflow.mjs` when that script exists; if absent, report it as skipped.
- Secrets, tokens, env values, customer data, one-time IDs, and PII are not exposed in chat, docs, logs, screenshots, PRs, or memory notes.

If any item fails, report the task as in progress or blocked.

## Execution Modes

Classify before starting. Default to Quick Path unless a deny rule applies.

### Quick Path

Use when there are no file changes, or when changes are small: up to 2 files, up to 30 changed lines, Tier 1-2 only, and confined to the immediate surface.

For Quick Path:

- Do not create or update workflow docs.
- Inspect only what is necessary.
- Run one direct check when useful.
- Report the evidence in the final response.

### Standard Path

Use when work is bounded Tier 1-3 but exceeds Quick Path, changes tests/config/contracts, or should be traceable later.

For Standard Path:

- Read `docs/PROGRESS.md`.
- Continue an active task if it is not `Done` or `Superseded`; otherwise create one concise `docs/tasks/*.md` record.
- Update the task record and `docs/PROGRESS.md` at start and handoff only.
- Do not update `docs/DEVELOPMENT_PLAN.md` unless roadmap or project direction changed.

### Full Path

Use for roadmap changes, architecture changes, multi-session work, or Tier 4 surfaces: auth, payments, data, migrations, deploy, env/secrets, permissions, or billing.

For Full Path:

- Read `docs/PROGRESS.md`; read `docs/DEVELOPMENT_PLAN.md` when roadmap status may change.
- Record risk, acceptance criteria, calibration assumption, and rollback plan for Tier 4 work.
- Update workflow docs at start, blocked, and handoff checkpoints.

## Documentation Model

- `docs/DEVELOPMENT_PLAN.md` is the stable roadmap and project-scope source of truth.
- `docs/PROGRESS.md` is a short current-status dashboard only.
- `docs/tasks/*.md` are per-request execution records with detailed evidence.
- Required task fields: goal, scope, risk tier, acceptance criteria, verification result, final outcome.
- Task status must be one of `Planned`, `In Progress`, `Blocked`, `Verifying`, `Done`, or `Superseded`.
- Keep top-level workflow docs short. Move history, command detail, and long evidence into task records.
- If documents disagree, trust `docs/DEVELOPMENT_PLAN.md` for roadmap state and the active task record for execution state.

## Engineering Rules

- Read before editing, but only read the files needed for the change path.
- Prefer existing repo patterns over new abstractions.
- Keep changes surgical; do not refactor unrelated code.
- Do not revert user or external changes unless explicitly asked.
- Use `rg` for search.
- Use structured parsers or schema checks when available.
- Use `apply_patch` for manual edits.
- Default to ASCII unless the file already uses non-ASCII or the content requires it.

## Skill-Specific Rules

- For skill behavior changes, inspect the affected parts of `skills/remotion-ad-video/SKILL.md`, `references/`, `scripts/validate-skill.mjs`, and the Remotion template.
- Keep contracts and validation in sync. If a behavior becomes required, add or update validator coverage.
- For Remotion template changes, check `schema.ts`, `default-props.json`, `AdVideo.tsx`, and template `README.md` together.
- For classifier changes, run the classifier smoke path.
- For public packaging changes, run `npm run snapshot` and validate the snapshot before publishing or committing the publish repo.
- Sync installed skill or external publish clones only when the user asks for install/publish/commit, or when the task explicitly requires it.

## Validation Scope

Run the narrowest check that can disprove the change.

- Docs-only: local review plus `git diff --check` when a git repo is present.
- Script syntax: `npm run check`.
- Skill/template behavior: `npm run validate`.
- Classifier behavior: `npm run smoke:classifier`.
- Snapshot packaging: `npm run snapshot`, then validate the generated snapshot when it is part of the handoff.
- Workflow files: `node scripts/validate-agent-workflow.mjs` when present.

Do not run full validation by default. Use full validation for release, deploy, public package surface, workflow validator changes, migrations, auth, payments, permissions, data, env/secrets, or high-risk runtime changes.

## Security

- Never print secrets or raw env contents.
- Redact tokens, keys, customer data, one-time IDs, and PII before adding evidence anywhere.
- Before publish, PR, or handoff of shareable artifacts, scan the changed surface for secrets and local-machine paths when practical.

## Handoff

Before final response or commit:

- Review changed files and scope.
- Confirm verification output and any skipped checks.
- Update the active task record and `docs/PROGRESS.md` when Standard or Full Path applies.
- Report commit hash only after verifying the commit exists.
- State blockers honestly instead of implying completion.

Memory writes are opt-in only. Do not persist memory unless the user explicitly asks.
