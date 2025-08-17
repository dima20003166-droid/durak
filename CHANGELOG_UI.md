# UI Redesign — Durak (Burgundy Edition)

**Date:** 2025-08-17

### Highlights
- New burgundy + gold theme aligned to site style (CSS variables).
- Felt-like game table with subtle grid and glow.
- Card backs redesigned with burgundy diamond pattern and gold trim.
- Smoother fan animations, half-overlap mini-hands under avatars.
- Chat input and send button fixed on mobile.
- Increased desktop max width to 1440px for comfortable 2–6 players.

### Touched files
- `client/src/index.css`
- `client/src/components/Card.jsx`
- `client/src/components/game/PlayersList.jsx`
- `client/src/components/game/RoomChat.jsx`

### Safe-by-design
- **No changes to sockets, API, or game logic.**
- Purely presentational updates (Tailwind/CSS/Framer Motion).