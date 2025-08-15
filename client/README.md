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
Если она не задана, по умолчанию используется `http://localhost:4000`.
