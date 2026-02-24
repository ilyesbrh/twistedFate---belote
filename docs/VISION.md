# TwistedFate — Project Vision

## What Is TwistedFate?

TwistedFate is a **card game engine platform**. Not a single game — a foundation for building many card games with shared infrastructure, shared UI, and game-specific logic plugged in on top.

Belote is the first game. It will not be the last.

---

## The Platform Model

```
┌─────────────────────────────────────────────────┐
│                  Shared UI Shell                │
│        (table, hand, cards, animations,         │
│         layout, theme, responsive design)       │
├────────┬────────┬────────┬────────┬─────────────┤
│ Belote │Coinche │  Rami  │  Uno   │   Skyjo     │
│  UI    │  UI    │  UI    │  UI    │    UI       │
│specifics│specifics│specifics│specifics│ specifics │
├────────┼────────┼────────┼────────┼─────────────┤
│ Belote │Coinche │  Rami  │  Uno   │   Skyjo     │
│  Core  │  Core  │  Core  │  Core  │    Core     │
├────────┴────────┴────────┴────────┴─────────────┤
│            Shared Infrastructure                │
│    (session, commands, events, animation        │
│     engine, ID system, state management)        │
└─────────────────────────────────────────────────┘
```

### Shared Layer (the platform)

Everything that is common across card games lives here:

- **UI shell** — table layout, card rendering, hand display, player seats, score area, animations, transitions, responsive/mobile-first design, general theme
- **Infrastructure** — session management, command/event system, animation engine, unique ID system, state machine patterns
- **Common domain primitives** — Card, Deck, Player, Seat, shuffle, deal

### Game-Specific Layer (the plugins)

Each game brings its own:

- **Core rules** — game state machine, legal moves, scoring, win conditions, round structure
- **UI specifics** — bidding panel (Belote/Coinche), draw pile (Rami/Uno), discard rules, game-specific overlays and indicators

---

## Target Games

Belote comes first. Each new game validates and strengthens the shared layer.

| Game | Category | Complexity |
|------|----------|------------|
| **Belote** | Trick-taking (trump) | High — first game, proving ground |
| **Coinche / Contrée** | Trick-taking (trump, bidding variant) | High — close cousin of Belote |
| **Rami** | Set collection / melding | Medium |
| **Uno** | Shedding | Low-Medium |
| **Skyjo** | Open tableau / scoring | Low-Medium |

---

## Compatible Games Catalog

The engine architecture supports any game built around cards, turns, and a shared table. Below is the full catalog of games the platform can host, grouped by family.

### Trick-Taking

Games where players play one card each per trick; highest card (or trump) wins.

| Game | Players | Deck | Notes |
|------|---------|------|-------|
| Belote | 4 (2v2) | 32 | French classic, trump-based |
| Coinche / Contrée | 4 (2v2) | 32 | Belote with auction bidding |
| Tarot (French) | 3–5 | 78 | Tarot-specific deck, complex scoring |
| Whist | 4 (2v2) | 52 | Classic trick-taker, no bidding |
| Bridge | 4 (2v2) | 52 | Auction + play, high complexity |
| Spades | 4 (2v2) | 52 | Spades always trump, bid tricks |
| Hearts | 4 | 52 | Avoid points, no trump |
| Euchre | 4 (2v2) | 24 | Fast trick-taker, jack-based trump |
| Piquet | 2 | 32 | Historic 2-player trick game |
| Manille | 4 (2v2) | 32 | 10 is highest, popular in southern France |

### Shedding

Games where the goal is to empty your hand first.

| Game | Players | Deck | Notes |
|------|---------|------|-------|
| Uno | 2–10 | 108 (special) | Color/number matching, action cards |
| Crazy Eights | 2–7 | 52 | Uno ancestor, simpler rules |
| Mau-Mau | 2–5 | 32 or 52 | European Uno variant |
| President (Trou du cul) | 4–7 | 52 | Climbing game, social ranks |

### Set Collection / Melding

Games where you form sets and runs from your hand.

| Game | Players | Deck | Notes |
|------|---------|------|-------|
| Rami (Rummy) | 2–6 | 52+jokers | Form sets and sequences |
| Gin Rummy | 2 | 52 | Fast 2-player rummy |
| Canasta | 4 (2v2) | 2x52+jokers | Team melding, wild cards |
| Phase 10 | 2–6 | 108 (special) | Complete 10 phases in order |

### Fishing

Games where you capture cards from the table by matching.

| Game | Players | Deck | Notes |
|------|---------|------|-------|
| Scopa | 2–4 | 40 (Italian) | Capture cards summing to target |
| Scopone | 4 (2v2) | 40 (Italian) | Team variant of Scopa |

### Tableau / Scoring

Games where cards are laid out and points are tracked over rounds.

| Game | Players | Deck | Notes |
|------|---------|------|-------|
| Skyjo | 2–8 | 150 (special) | Minimize your grid score |
| 6 qui prend! (Take 5) | 2–10 | 104 (special) | Avoid taking rows of cards |

### Casino / Comparing

Games where players bet or compare hands.

| Game | Players | Deck | Notes |
|------|---------|------|-------|
| Poker (Texas Hold'em) | 2–10 | 52 | Community cards, betting rounds |
| Blackjack | 1–7 vs dealer | 52+ | Reach 21 without busting |
| Bataille (War) | 2 | 52 | Simple compare, good for kids |

### Kids / Family

Simple rules, short games — perfect for younger players and casual play.

| Game | Players | Deck | Notes |
|------|---------|------|-------|
| Bataille (War) | 2 | 52 | Flip & compare, highest wins — pure luck |
| عائلات / 7 Familles (Happy Families) | 2–6 | 42 (7 families x 6) | "Give me X from family Y" — collect complete families |
| Go Fish | 2–6 | 52 | Ask for cards, collect sets of 4 |
| Old Maid (Pouilleux) | 2–6 | 51 (one queen removed) | Don't get stuck with the odd card |
| Snap | 2–4 | 52 | Match cards by speed — reflexes game |
| Memory (Concentration) | 1–4 | 52 (face-down pairs) | Flip two, match pairs — memory game |

> This catalog is not a roadmap — it's a compatibility list. Games will be added based on demand and strategic value. The architecture must support all of them, but we ship one at a time.

---

## Future: Story Mode & LLM-Powered AI

Once the platform and multiple games are solid:

- **Monetization** — story mode and advanced AI are premium features for paying clients. The core multiplayer games remain accessible

### Story Mode

A single-player campaign where you progress through a series of **AI personas** — each one a distinct character with a name, a backstory, a play style, and dialogue.

**How it works:**

- The player enters a story arc (e.g., "The Café Tournament", "The Old Masters", "Street Hustlers")
- Each stage pits you against a unique AI persona
- You must beat each persona to advance to the next
- Difficulty and personality escalate as you progress
- Personas talk to you during the game — they taunt, compliment, bluff, react

**Example personas:**

| Persona | Game | Style | Flavor |
|---------|------|-------|--------|
| Mami Zohra | Belote | Wise, patient | "Your grandfather used to play the same way... poorly." |
| Le Requin | Coinche | Greedy, aggressive | Bets big, talks trash, goes all-in every round |
| Petit Moussa | Rami | Playful, chaotic | Discards wildly, somehow wins, laughs the whole time |
| La Prof | Belote | Safe, methodical | Lectures you on every mistake after the game |
| Khal | Trick-taking | Trickster, silent | Says nothing. Plays perfectly. Terrifying. |

Each persona is **generated and driven by an LLM** — their play decisions, their dialogue, their reactions are all live, not scripted. Two playthroughs against the same persona feel different.

**Progression:**

- Beat a persona to unlock the next one
- Earn rewards (card skins, table themes, new story arcs)
- Some personas appear across multiple games — beat Le Requin at Belote, then face him again at Coinche where he's even more dangerous
- Leaderboards for fastest arc completion

### LLM Partners & Opponents

The current AI is a rule-based decision tree. The vision is to replace it with a **real LLM-powered player** — an AI that doesn't just follow rules, but actually *plays* the game.

**Personality selection** — before a game, the player picks who they're playing with (or against):

| Personality | Play Style |
|-------------|------------|
| Greedy | Aggressive, always chases the big score, takes risks |
| Safe | Conservative, minimizes losses, never overcommits |
| Angry | Impulsive, targets the leading player, holds grudges |
| Wise | Balanced, reads the table, makes optimal long-term moves |
| Playful | Unpredictable, bluffs, tries flashy plays for fun |
| Trickster | Deceptive, baits traps, plays mind games |

These are not difficulty levels — they are *characters*. A Greedy AI and a Wise AI can both be strong, but they feel completely different to play against.

**Pattern awareness** — the AI learns your habits over time:

- Notices when you always lead with trump early
- Detects your bidding tendencies (cautious vs. aggressive)
- Adapts its counter-strategy across multiple games
- As a **partner**, learns to complement your style — if you play aggressively, it covers defensively
- As an **opponent**, learns to exploit your patterns — if you always protect a suit, it forces you to play it

**The result**: every player gets a unique experience. The AI you play against after 50 games is not the same AI you played against on day one. It knows you.

This is the long-term differentiator: not just another card game app, but one where the AI opponents are genuinely interesting to play against — and they get better at playing *you* specifically.

---

## Multiplayer Platform — Coin-Based Economy

TwistedFate is also a **multiplayer platform** in the style of Miniclip / 8 Ball Pool — real players, real stakes, real competition.

### How It Works

- Players join **lobbies** and pick a game (Belote, Coinche, Rami, Uno...)
- Each match has a **coin entry fee** — both players put coins on the table
- Winner takes the pot (minus a small platform cut)
- Higher-stakes tables require more coins and unlock as you rank up

### Coin Economy

| Source | Description |
|--------|-------------|
| **Daily rewards** | Free coins for logging in, completing challenges |
| **Win matches** | Beat opponents to earn their stake |
| **Purchase** | Buy coin packs with real money (IAP) |
| **Story mode rewards** | Beat personas to earn bonus coins |
| **Tournaments** | Entry fee + prize pool distributed to top finishers |

### Matchmaking & Lobbies

- **Ranked matchmaking** — play against players of similar skill level
- **Stake tiers** — Casual (free), Bronze, Silver, Gold, Diamond tables with increasing entry fees
- **Quick match** — instant pairing for a fast game
- **Private rooms** — invite friends, set custom rules, play for fun or coins
- **Tournaments** — scheduled events with brackets, elimination rounds, and big prize pools

### Social & Progression

- **Player profiles** — avatar, stats, win rate, favorite game, rank
- **Leaderboards** — global, per-game, weekly, and friends-only
- **Achievements** — milestones that reward coins and cosmetics
- **Cosmetics** — card backs, table skins, avatars, emotes (purchased with coins or earned)
- **Friends list** — add opponents, rematch, spectate live games

### Revenue Model

| Stream | Type | Description |
|--------|------|-------------|
| **Coin packs** | IAP | Buy coins with real money |
| **Story mode** | Premium | Paid access to AI story campaigns |
| **Cosmetics** | IAP | Card skins, table themes, emotes |
| **Platform cut** | Per-match | Small % of every coin pot |
| **Tournament entry** | Per-event | Fee to join premium tournaments |
| **Ad-free** | Subscription | Remove ads for a monthly fee |

> The core experience — playing card games online with friends — stays free. Monetization comes from convenience, cosmetics, and premium content. No pay-to-win.

---

## Guiding Principles

1. **Shared first, specific second** — before building a game-specific feature, ask: can this be shared?
2. **Each game proves the platform** — adding a new game should get easier over time, not harder
3. **Mobile-first, always** — touch is primary, desktop is secondary
4. **Engine quality matters** — the core and shared layers are production-grade, tested, deterministic
5. **Incremental growth** — ship Belote fully, then expand. No half-built multi-game skeleton

---

## Current State

- **Belote core** — domain engine complete (11+ iterations, 458+ tests)
- **App layer** — session management, command system, AI players
- **Animation engine** — sequence descriptions, framework-agnostic
- **UI** — starting fresh after a full reset

The immediate priority is rebuilding the Belote UI. The platform generalization will emerge naturally as the second game is added.
