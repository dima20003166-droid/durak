import React from 'react';

const GameLayout = ({ header, table, footer }) => (
  <div className="game-layout text-text game-bg">
    {header && <header className="game-header">{header}</header>}
    {table && (
      <div className="game-table">
        <div className="table-oval">
          <div className="table-slots">{table}</div>
        </div>
      </div>
    )}
    {footer && <footer className="game-footer">{footer}</footer>}
  </div>
);

export default GameLayout;
