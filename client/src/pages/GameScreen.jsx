
// client/src/pages/GameScreen.jsx
import React, { useState } from 'react';
import GameLayout from './GameLayout';
import DurakTable from '../components/game/DurakTable';

export default function GameScreen({ room, gameState, mySocketId, myPlayer, openProfile }) {
  const [selectedCard, setSelectedCard] = useState(null);

  // Простейший хедер (можно заменить на твой)
  const header = (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="font-bold">Стол: {room?.id ?? '...'}</div>
      <div className="text-sm opacity-70">Игроков: {room?.players?.length ?? 0}</div>
    </div>
  );

  const footer = (
    <div className="px-3 py-2 text-xs opacity-60">© Durak Online</div>
  );

  return (
    <GameLayout
      header={header}
      table={
        <DurakTable
          room={room}
          gameState={gameState}
          mySocketId={mySocketId}
          myPlayer={myPlayer}
          selectedCard={selectedCard}
          setSelectedCard={setSelectedCard}
          openProfile={openProfile}
        />
      }
      footer={footer}
    />
  );
}
