import React,{useEffect,useState} from 'react';
import { joinTable, getMyActiveTable } from '../../api/tables';
import { getLastTable } from '../../shared/lib/rejoin';
export default function RejoinButton(){
 const [tableId,setTableId]=useState<string|null>(null);
 useEffect(()=>{getMyActiveTable().then(t=>setTableId(t?.tableId??getLastTable()))},[]);
 if(!tableId) return null;
 return <button className='btn btn-primary' onClick={async()=>{const r=await joinTable(tableId!); if(r.status!=='locked'){window.location.href=`/game/${r.tableId||tableId}`}}}>Вернуться в игру</button>;
}
