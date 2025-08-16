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
    <div className="game-main">
      {leftSidebar && <aside className="game-left">{leftSidebar}</aside>}
      <div className="game-center">
        {table && <div className="game-table">{table}</div>}
        {players && <div className="game-players">{players}</div>}
      </div>
      {rightSidebar && <aside className="game-right">{rightSidebar}</aside>}
    </div>
    {footer && <footer className="game-footer">{footer}</footer>}
  </div>
);

export default GameLayout;
