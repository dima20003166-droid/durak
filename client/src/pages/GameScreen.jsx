import React, { useEffect } from 'react'
import Board from '../components/game/Board.jsx'
import RejoinButton from '../components/lobby/RejoinButton.jsx'
import { saveLastTable } from '../shared/lib/rejoin.js'
export default function GameScreen(){
  const tableId = 'demo-table'
  useEffect(()=>{ saveLastTable(tableId) },[tableId])
  return (<div style={{display:'grid',gap:12}}>
    <RejoinButton />
    <Board />
  </div>)
}
