# Game Ad Patterns

Use this reference for casual games, mobile games, app-store game listings, puzzle games, hypercasual games, idle games, merge games, runners, and simple gameplay loops.

## Core Rule

Simple-game ads should feel like high-energy gameplay. Do not explain the game with feature cards first. Simulate the most satisfying loop immediately, then use store assets as fast proof moments.

Default duration is 15s. A 30s game ad must be explicitly requested or justified by a deeper story.

The common failure mode is making a mini slide deck: gameplay hook, proof card, feature card, CTA card. Avoid that. Shot cuts are allowed and often useful, but each shot should be kinetic: gameplay action, world/character motion, screenshot motion, reward motion, or CTA motion.

## First 2 Seconds

Start with one clear action and payoff:

- Match: swap pieces, trigger a combo, explode the board.
- Merge: drag two objects together, reveal a better object.
- Runner: near-miss obstacle, collect chain, speed burst.
- Puzzle: wrong move tension, one smart move solves it.
- Idle/reward: tap or unlock triggers a coin/reward cascade.

Use a short command-style headline such as `ONE MOVE. BIG BLAST.`, `MERGE IT. UNLOCK MORE.`, or `TAP. COLLECT. LEVEL UP.` Keep product/app icon visible in the first scene.

## Asset Use

Use app-store assets in this order:

1. Icon: brand anchor, header, CTA.
2. Screenshots: product proof, stacked cards, swipe carousel, before/after reveal.
3. Feature image or hero art: mid-video world/character context.
4. Rating/download/review numbers: proof cards, not the opening hook.

If screenshots are static, recreate the gameplay motion with custom Remotion shapes over or beside them. Do not rely on panning screenshots as the main animation.

Proof numbers, ratings, screenshots, and feature art should enter as fast overlays, stickers, flashes, swipe cards, match cuts, or side pops. They should not become static information screens.

## Motion Systems

Minimum for 15s game ads:

- Gameplay loop: one animated mechanic that resembles the actual game category.
- Payoff: particles, burst, score pop, reward cascade, or level-up moment.
- Asset proof: app-store screenshot/icon/feature-art reveal as a kinetic shot or overlay.
- CTA pulse: button/icon with a reason to install.
- Tempo: a meaningful visual change every 0.5-1.5 seconds.

Prefer `useCurrentFrame()`, `spring()`, `interpolate()`, and deterministic arrays for pieces, particles, boards, cards, and score pops.

## 15s Storyboard Pattern

- 0-2s: immediate action and payoff.
- 2-5s: second combo, fail-rescue, or reward cascade.
- 5-8s: screenshot/feature art proof enters as a kinetic cut, overlay, or match-cut.
- 8-11s: bigger payoff, level-up, multiplier, or challenge moment.
- 11-15s: CTA with motion, such as icon pop, reward burst, card swipe, or gameplay background.

Use 30s only when needed:

- 0-3s hook.
- 3-12s continuous gameplay variations.
- 12-20s proof and features as kinetic shots or overlays.
- 20-26s challenge/event/social mechanic.
- 26-30s CTA with motion.

## QA Checks

- Would the first second still read without sound?
- Is the core mechanic visible before social proof?
- Do proof and CTA use kinetic shots or motion instead of static cards?
- Does the ad include real store assets plus custom motion?
- Are screenshots supporting the ad rather than replacing animation?
- Would any still look like a presentation slide? If yes, revise with a cut, motion, or payoff.
- Are store claims copied accurately and documented in the source summary?
- Are third-party asset rights called out before commercial handoff?
