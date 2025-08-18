import React from "react";
import PlayersList from "../PlayersList.jsx";

// Обёртка: не рендерит оригинальный PlayersList, пока нет корректного game.players.
export default function PlayersListSafe(props) {
  const safeGame = props.game ?? { players: [] };
  const hasPlayersArray = Array.isArray(safeGame.players);
  if (!hasPlayersArray) {
    return <div className="text-sm text-white/60">Подключение к столу…</div>;
  }
  return <PlayersList {...props} game={safeGame} />;
}
