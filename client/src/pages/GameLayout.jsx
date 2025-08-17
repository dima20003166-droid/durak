import React from 'react';

const GameLayout = ({ header, table, players, leftSidebar, rightSidebar, footer }) => (
  <div className="min-h-screen w-full px-2 md:px-6 py-3 md:py-6 text-text">
    {header && <header className="mb-2">{header}</header>}
    <div className="game-grid">
      <div className="area-left">{leftSidebar || null}</div>
      <div className="area-top">{/* игроки сверху/по сторонам */}{players || null}</div>
      <div className="area-center">{table ? <div className="">{table}</div> : null}</div>
      <div className="area-right">{rightSidebar || null}</div>
      <div className="area-bottom">{footer || null}</div>
    </div>
  </div>
);

export default GameLayout;
