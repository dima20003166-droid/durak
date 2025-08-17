import React, { useEffect, useState } from 'react'
import { joinTable, getMyActiveTable } from '../../api/tables.js'
import { getLastTable } from '../../shared/lib/rejoin.js'
export default function RejoinButton(){
  const [tableId,setTableId] = useState(null)
  useEffect(()=>{ getMyActiveTable().then(t=>setTableId(t?.tableId ?? getLastTable())) },[])
  if(!tableId) return null
  return <button onClick={async()=>{
    const r = await joinTable(tableId)
    if(r.status !== 'locked'){
      window.location.href = `/game/${r.tableId || tableId}`
    }
  }}>Вернуться в игру</button>
}
