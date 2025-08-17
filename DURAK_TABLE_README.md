
# DurakTable — интеграция

Новый файл: `client/src/components/game/DurakTable.jsx` (полностью новая верстка столу).  
Стили добавлены в конец `client/src/index.css` и **изолированы** префиксом `.dt-*` (не ломают остальной сайт).

## Подключение (минимально инвазивно)
Открой `client/src/pages/GameScreen.jsx` и там, где рендерится `GameLayout`, передай:
```jsx
import DurakTable from '../components/game/DurakTable';
...
<GameLayout
  header={...}
  table={(
    <DurakTable
      room={room}
      gameState={gameState}
      mySocketId={mySocketId}
      myPlayer={myPlayer}
      selectedCard={selectedCard}
      setSelectedCard={setSelectedCard}
      openProfile={openProfile}
    />
  )}
  footer={...}
/>
```

Никакую логику/сокеты менять не нужно — компонент берет данные из уже существующих пропов.

## Что получаешь
- Оппоненты по слотам (сверху/слева/справа) с мини‑веером рубашек.
- Моя рука — дугой внизу, hover‑подъём.
- Боевая зона по центру (атака/защита) з акуратными отступами и анимациями.

## Кастомизация (при желании)
- Углы/отступы/раскладку: редактируй `.dt-*` в `index.css`.
- Кол-во видимых рубашек в мини‑веере: `visible = Math.min(8, p.hand.length)`.
- Сильнее/меньше дуга руки: множители `44` (смещение) и `6` (наклон).
