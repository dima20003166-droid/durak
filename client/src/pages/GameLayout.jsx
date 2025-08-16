import React from 'react';

const GameLayout = ({ header, table, sidebar, footer }) => (
  <div className="game-layout text-text game-bg">
    {header && <header className="game-header">{header}</header>}
    {table && <div className="game-table">{table}</div>}
    {sidebar && <aside className="game-sidebar">{sidebar}</aside>}
    {footer && <footer className="game-footer">{footer}</footer>}
  </div>
);

export default GameLayout;
