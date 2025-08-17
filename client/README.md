# Client

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
   This installs peer libraries such as `framer-motion` used for card flip animations.
2. Run the development server:
   ```bash
   npm run dev
   ```

Ensure you execute these commands inside the `client` directory.

### Примечание
Не забудьте установить зависимости, включая [`framer-motion`](https://www.framer.com/motion/), чтобы сборка не выдавала ошибку `Failed to resolve import`.

## Переменные окружения

Используйте переменную `VITE_SERVER_URL`, чтобы указать адрес сервера Socket.IO.
Если она не задана, по умолчанию используется `http://185.233.47.116:4000`.


## UI Rework (Aug 17, 2025)
- Centered table layout with responsive grid (.game-table/.game-players)
- Opponent mini-fan of backs under avatar (50% overlap)
- Realistic deck stack with trump card
- Discard pile shows defense card overlapping attack ~50%
- Chat panel controls fixed inside panel on all screens
- Mobile 2–6 players: horizontal scroll of opponents; my hand unchanged
