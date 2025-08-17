import React from 'react';
export default function GameLayout({ header, left, top, center, right, bottom }) {
  return (
    <div className="min-h-screen w-full px-2 md:px-6 py-3 md:py-6">
      {header}
      <div className="game-grid">
        <div className="area-top">{top}</div>
        <div className="area-left">{left}</div>
        <div className="area-center">{center}</div>
        <div className="area-right">{right}</div>
        <div className="area-bottom">{bottom}</div>
      </div>
    </div>
  );
}
