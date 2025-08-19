import React from "react";
import Board from "../Board.jsx";

// Обёртка: гарантирует, что setSelectedCard и onSelectCard всегда переданы.
export default function BoardSafe(props) {
  const noop = () => {};
  const setSelectedCard = props.setSelectedCard || noop;
  const onSelectCard = props.onSelectCard || setSelectedCard;
  return <Board {...props} setSelectedCard={setSelectedCard} onSelectCard={onSelectCard} />;
}
