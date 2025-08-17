import React from 'react';

/**
 * GameLayout
 * - header (top bar)
 * - main: left sidebar • center (table + players) • right sidebar (chat)
 * - footer (action panel)
 * Keeps center perfectly centered even when one sidebar is missing.
 */
const GameLayout = ({ header, table, players, leftSidebar, rightSidebar, footer }) => {
  return (
    <div className="game-layout text-text game-bg min-h-screen">
      {header && <header className="game-header">{header}</header>}
      <div className="game-main">
        {/* Left stub keeps grid stable on narrow screens */}
        <aside className="game-left">{leftSidebar || <div aria-hidden="true" />}</aside>
        <div className="game-center">
          {table && <div className="game-table">{table}</div>}
          {players && <div className="game-players">{players}</div>}
        </div>
        <aside className="game-right">{rightSidebar || <div aria-hidden="true" />}</aside>
      </div>
      {footer && <footer className="game-footer">{footer}</footer>}
    </div>
  );
};

export default GameLayout;
