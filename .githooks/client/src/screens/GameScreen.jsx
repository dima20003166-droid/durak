import React from "react";
import Board from "../components/game/Board.jsx";
import PlayersList from "../components/game/PlayersList.jsx";
import GameControls from "../components/game/GameControls.jsx";

/**
 * Контейнер-экран. Не меняет бизнес-логику, только раскладку.
 * Открывается твоим роутом/логикой создания стола.
 */
export default function GameScreen({ game, me, onAction, rightPanel, topBar }) {
  const players = game?.players || [];
  return (
    <div className="w-full h-full min-h-screen bg-[radial-gradient(ellipse_at_center,rgba(20,20,30,1),rgba(5,5,10,1))] text-white">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">Стол: {game?.tableName || "Без названия"}</h1>
            <span className="text-xs sm:text-sm text-white/60">Раунд #{game?.round ?? 1}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">Ход: {game?.turnPlayerName || "—"}</span>
            {topBar ?? null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <aside className="lg:col-span-3 order-2 lg:order-1">
          <section className="rounded-2xl border border-white/10 bg-white/5 shadow">
            <div className="p-3 sm:p-4 border-b border-white/10">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-white/70">Игроки ({players.length})</h2>
            </div>
            <div className="p-2 sm:p-3">
              <PlayersList players={players} me={me} activeId={game?.turnPlayerId} />
            </div>
          </section>
        </aside>

        <section className="lg:col-span-6 order-1 lg:order-2">
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/0 shadow overflow-hidden">
            <div className="p-2 sm:p-3 md:p-4 lg:p-6">
              <Board game={game} me={me} />
            </div>
            <div className="border-t border-white/10 bg-black/20 px-2 sm:px-3 md:px-4 py-2 sm:py-3">
              <GameControls game={game} me={me} onAction={onAction} />
            </div>
          </div>
        </section>

        <aside className="lg:col-span-3 order-3">
          <section className="rounded-2xl border border-white/10 bg-white/5 min-h-[240px] flex flex-col">
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-white/70">Стол · Инфо</h2>
              {game?.timerSeconds != null && (
                <span className="text-xs px-2 py-1 rounded-md bg-black/40 border border-white/10">⏱ {game.timerSeconds}s</span>
              )}
            </div>
            <div className="p-2 sm:p-3 flex-1 overflow-auto">
              {rightPanel ?? (
                <p className="text-sm text-white/60">Подключи сюда чат или журнал событий, передав его в prop <code>rightPanel</code>.</p>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
