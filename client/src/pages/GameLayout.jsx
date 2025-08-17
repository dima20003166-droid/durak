
import React from 'react';

const GameLayout = ({
  header,
  table,
  players,
  leftSidebar,
  rightSidebar,
  footer,
}) => (
  <div className="game-layout text-text game-bg">
    {header && <header className="game-header">{header}</header>}
    <div className="game-main justify-center">
      {leftSidebar ? <aside className="game-left">{leftSidebar}</aside> : null}
      <div className="game-center">
        <div className="game-table">
          <div className="table-oval">
            {/* If waiting state — show table content (e.g., "ожидаем игроков") */}
            {table ? <div className="mb-2">{table}</div> : null}
            {/* Players markup contains slots + battlefield when playing */}
            {players ? players : null}
          </div>
        </div>
      </div>
      {rightSidebar ? <aside className="game-right">{rightSidebar}</aside> : null}
    </div>
    {footer && <footer className="game-footer">{footer}</footer>}
  </div>
);

export default GameLayout;
