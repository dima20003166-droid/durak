export const LAST_KEY='LAST_TABLE_ID';
export const saveLastTable=(id:string)=>{try{localStorage.setItem(LAST_KEY,String(id))}catch{}};
export const getLastTable=():string|null=>{try{return localStorage.getItem(LAST_KEY)}catch{return null}};
