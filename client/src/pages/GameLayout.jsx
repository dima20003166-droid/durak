import React from 'react';

const GameLayout = ({ header, players, footer, rightSidebar, table }) => {
  return (
    <div className="min-h-screen flex flex-col p-4 game-bg text-text">
      {header && <header className="mb-4">{header}</header>}

      <main className="flex-grow grid grid-cols-12 grid-rows-1 gap-4">
        {/* Ліва та центральна частина (гравці та стіл) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col">
          {players ? (
            <div className="flex-grow">{players}</div>
          ) : table ? (
            <div className="flex-grow flex items-center justify-center">{table}</div>
          ) : null}
        </div>

        {/* Правий сайдбар (чат) */}
        <aside className="col-span-12 lg:col-span-3 lg:block">
          {rightSidebar}
        </aside>
      </main>

      {footer && <footer className="mt-4">{footer}</footer>}
    </div>
  );
};

export default GameLayout;