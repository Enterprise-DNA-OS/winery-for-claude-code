import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { REPO_ROOT } from './db.mjs';
import { parseCsv,pick } from './csv.mjs';
import { page,table,writeOut } from './render.mjs';
export const TABLES=['clients','vineyards','vessels','lots','origins','positions','lineage','operations','analyses','work_orders','additions','bottlings','supplies','recalls','notes'];
export const READS={
 clients:'select id,name,address,jurisdiction from clients order by name',
 vineyards:'select id,name,grower,region,address,source_id from vineyards order by name',
 vessels:'select * from capacity_view order by vessel',
 lots:'select l.id,l.name,c.name as owner,l.status,l.received_on,l.source_ref from lots l join clients c on c.id=l.client_id order by l.name',
 cellar:'select lot,owner,vessel,litres,status,last_sample from cellar_view order by lot,vessel',
 'cellar-round':'select lot,vessel,litres,status,last_sample from cellar_view order by status desc,last_sample nulls first',
 'tank-space':'select * from capacity_view order by vessel',
 'lab-watch':'select lot,vessel,last_sample,status from cellar_view where last_sample is null or last_sample<current_date-14 order by lot',
 analyses:'select l.name as lot,a.vessel,a.sampled_on,a.metric,a.value,a.unit,a.lab_ref from analyses a join lots l on l.id=a.lot_id order by a.sampled_on desc,l.name,a.metric',
 'work-orders':'select * from work_view order by due_on,job',
 'bottling-plan':"select job,lot,owner,due_on,lot_status,note from work_view where status='open' and lower(kind) like '%bottl%' order by due_on",
 bottlings:'select b.name,l.name as lot,b.bottled_on,b.bottles,b.bottle_ml,b.litres,b.packaging_ref from bottlings b join lots l on l.id=b.lot_id order by b.bottled_on,b.name',
 additions:'select l.name as lot,a.occurred_on,a.material,a.supplier,a.supplier_batch,a.quantity,a.unit,a.recorded_by from additions a join lots l on l.id=a.lot_id order by a.occurred_on desc',
 supplies:'select s.name,l.name as lot,s.supplied_on,s.recipient,s.address,s.litres,s.statement_ref from supplies s join lots l on l.id=s.lot_id order by s.supplied_on desc',
 operations:'select o.name,l.name as lot,o.kind,o.occurred_on,o.litres,o.from_vessel,o.to_vessel,o.recorded_by,o.note from operations o join lots l on l.id=o.lot_id order by o.created_at desc,o.name',
 recalls:'select r.name,l.name as lot,r.performed_on,r.reviewer,r.evidence,r.follow_up from recalls r join lots l on l.id=r.lot_id order by r.performed_on desc',
 notes:'select l.name as lot,n.note,n.recorded_by,n.created_at from notes n join lots l on l.id=n.lot_id order by n.created_at desc',
 attention:'select * from attention_view order by issue,reference',
 compliance:'select * from compliance_view order by rule,reference',
 'owner-review':'select * from owner_view order by owner'
};
export const required=(v,k)=>{if(v===undefined||v===null||String(v).trim()==='')throw Error(`Required: ${k}`);return String(v).trim();};
function number(v,k,{zero=false,integer=false}={}){if(v===undefined||v===null||String(v).trim()===''||!Number.isFinite(Number(v))||(zero?Number(v)<0:Number(v)<=0)||(integer&&!Number.isInteger(Number(v))))throw Error(`Invalid ${k}`);return Number(v);}
function litres(v){const n=number(v,'litres');if(Math.abs(n*1000-Math.round(n*1000))>0.00001)throw Error('Litres support at most three decimal places');return n;}
const today=()=>new Date().toISOString().slice(0,10);
function date(v,k='date',{future=false}={}){const s=required(v,k);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s||(!future&&s>today()))throw Error(`Invalid ${k}: use YYYY-MM-DD${future?'':' and no future date'}`);return s;}
const textFields=(d,keys)=>Object.fromEntries(keys.map(k=>[k,required(d[k],k)]));
export async function resolve(db,t,ref){if(!TABLES.includes(t))throw Error('Unknown record type');const s=required(ref,t);const rows=await db.query(`select * from ${t} where lower(name)=lower($1) or id::text=$1`,[s]);if(rows.length===1)return rows[0];const matches=await db.query(`select * from ${t} where position(lower($1) in lower(name))>0 or starts_with(id::text,$1) order by name`,[s]);if(matches.length!==1)throw Error(`${t}: ${matches.length?'ambiguous':'no match'} ${s}${matches.length?'\n'+matches.map(r=>`${r.id}  ${r.name}`).join('\n'):''}`);return matches[0];}
async function insert(db,t,d){const keys=Object.keys(d);return (await db.query(`insert into ${t}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(d)))[0];}
async function tx(db,fn){await db.exec('BEGIN');try{await db.query('select pg_advisory_xact_lock(874321)');const result=await fn();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function origin(db,lot){return db.query('select vineyard,vintage,variety,region,fraction from origins where lot_id=$1 order by vineyard,variety',[lot.id]);}
async function movable(db,ref){const l=await resolve(db,'lots',ref);if(l.status!=='available')throw Error(`Lot ${l.name} is on hold`);return l;}
async function source(db,lot,vessel,amount){const v=await resolve(db,'vessels',vessel);const [p]=await db.query('select * from positions where lot_id=$1 and vessel_id=$2',[lot.id,v.id]);if(!p||Number(p.litres)<amount)throw Error(`Insufficient wine in ${v.name}`);return v;}
async function take(db,lot,v,amount){await db.query('delete from positions where lot_id=$1 and vessel_id=$2 and litres=$3',[lot.id,v.id,amount]);await db.query('update positions set litres=litres-$3 where lot_id=$1 and vessel_id=$2',[lot.id,v.id,amount]);}
async function put(db,lot,v,amount){const [p]=await db.query('select * from positions where vessel_id=$1',[v.id]);if(p&&p.lot_id!==lot.id)throw Error('Destination contains a different lot: use blend into an empty vessel');if(Number(p?.litres||0)+amount>Number(v.capacity_l))throw Error('Vessel capacity exceeded');if(p)await db.query('update positions set litres=litres+$2 where id=$1',[p.id,amount]);else await insert(db,'positions',{lot_id:lot.id,vessel_id:v.id,litres:amount});}
async function op(db,lot,kind,d,extra={}){const when=date(d.occurred_on||today());if(when<lot.received_on)throw Error('Operation predates lot receipt');return insert(db,'operations',{name:d.reference||`${kind.toUpperCase()}-${randomUUID()}`,lot_id:lot.id,kind,occurred_on:when,recorded_by:required(d.recorded_by,'recorded_by'),litres:extra.litres||0,note:required(d.note,'note'),retain_until:retention(when),...extra});}
function retention(s){const d=new Date(s);d.setUTCFullYear(d.getUTCFullYear()+7);return d.toISOString().slice(0,10);}
function checkOrigins(list){if(!Array.isArray(list)||!list.length)throw Error('Supply origins with vineyard, vintage, variety, region and fraction');const rows=list.map(o=>({...textFields(o,['vineyard','variety','region']),vintage:number(o.vintage,'vintage',{integer:true}),fraction:number(o.fraction,'fraction')}));if(rows.some(o=>o.vintage<1900||o.vintage>2200)||Math.abs(rows.reduce((s,o)=>s+o.fraction,0)-1)>0.000000001)throw Error('Origin fractions must sum to one and vintage must be valid');return rows;}
export async function mutate(db,cmd,d){return tx(db,async()=>{
 if(cmd==='add'){
  if(d.type==='client'){if(!['NZ','AU'].includes(d.jurisdiction))throw Error('jurisdiction must be NZ or AU');return insert(db,'clients',{...textFields(d,['name','address','jurisdiction'])});}
  if(d.type==='vessel')return insert(db,'vessels',{...textFields(d,['name','location']),capacity_l:litres(d.capacity_l)});
  if(d.type==='vineyard')return insert(db,'vineyards',{...textFields(d,['name','grower','region','address'])});
  if(d.type==='work-order'){const l=await resolve(db,'lots',d.lot);return insert(db,'work_orders',{...textFields(d,['name','kind','assigned_to','note']),lot_id:l.id,due_on:date(d.due_on,'due_on',{future:true})});}
  if(d.type==='recall'){const l=await resolve(db,'lots',d.lot);return insert(db,'recalls',{...textFields(d,['name','reviewer','evidence','follow_up']),lot_id:l.id,performed_on:date(d.performed_on)});}
  throw Error('add type: client, vineyard, vessel, work-order, recall');
 }
 if(cmd==='receive'){
  const client=await resolve(db,'clients',d.client),v=await resolve(db,'vessels',d.vessel),qty=litres(d.litres),origins=checkOrigins(d.origins);
  const l=await insert(db,'lots',{...textFields(d,['name','source_ref']),client_id:client.id,received_on:date(d.occurred_on||today())});
  for(const o of origins)await insert(db,'origins',{lot_id:l.id,...o});await put(db,l,v,qty);await op(db,l,'receive',d,{litres:qty,to_vessel:v.name,evidence:JSON.stringify({supplier:required(d.supplier,'supplier'),supplier_address:required(d.supplier_address,'supplier_address'),origins})});return l;
 }
 if(cmd==='blend'){
  if(!Array.isArray(d.inputs)||d.inputs.length<2)throw Error('Blend requires at least two input lots');
  const v=await resolve(db,'vessels',d.vessel);if((await db.query('select id from positions where vessel_id=$1',[v.id])).length)throw Error('Blend destination must be empty');
  const inputs=[];for(const i of d.inputs){const l=await movable(db,i.lot),qty=litres(i.litres),sv=await source(db,l,i.vessel,qty);inputs.push({lot:l,vessel:sv,litres:qty});}
  if(new Set(inputs.map(i=>i.lot.client_id)).size!==1)throw Error('Cannot blend different owners');
  if(new Set(inputs.map(i=>i.lot.id)).size!==inputs.length)throw Error('Each input lot must be distinct');
  const total=inputs.reduce((n,i)=>n+i.litres,0),when=date(d.occurred_on||today());
  if(inputs.some(i=>i.lot.received_on>when))throw Error('Blend predates source receipt');
  const l=await insert(db,'lots',{name:required(d.name,'name'),client_id:inputs[0].lot.client_id,received_on:when,source_ref:required(d.source_ref,'source_ref')});
  for(const i of inputs){const os=await origin(db,i.lot);checkOrigins(os);for(const o of os)await insert(db,'origins',{lot_id:l.id,...o,fraction:Number(o.fraction)*i.litres/total});await insert(db,'lineage',{parent_id:i.lot.id,child_id:l.id,litres:i.litres});await take(db,i.lot,i.vessel,i.litres);await op(db,i.lot,'blend',{...d,reference:undefined},{litres:i.litres,from_vessel:i.vessel.name,to_vessel:v.name,evidence:JSON.stringify({child:l.name})});}
  await put(db,l,v,total);await op(db,l,'blend',d,{litres:total,to_vessel:v.name,evidence:JSON.stringify(inputs.map(i=>({lot:i.lot.name,vessel:i.vessel.name,litres:i.litres})))});return l;
 }
 if(['transfer','loss','bottle','supply'].includes(cmd)){
  const l=await movable(db,d.lot);let qty=cmd==='bottle'?number(d.bottles,'bottles',{integer:true})*number(d.bottle_ml,'bottle_ml',{integer:true})/1000:litres(d.litres);qty=litres(qty);
  const v=await source(db,l,d.vessel,qty),when=date(d.occurred_on||today());let extra={litres:qty,from_vessel:v.name};
  if(cmd==='transfer'){const dest=await resolve(db,'vessels',d.to_vessel);if(dest.id===v.id)throw Error('Choose a different destination vessel');await put(db,l,dest,qty);extra.to_vessel=dest.name;}
  if(cmd==='bottle')await insert(db,'bottlings',{...textFields(d,['name','packaging_ref','recorded_by']),lot_id:l.id,bottled_on:when,bottles:d.bottles,bottle_ml:d.bottle_ml,litres:qty});
  if(cmd==='supply'){const composition=checkOrigins(await origin(db,l));await insert(db,'supplies',{...textFields(d,['name','recipient','address','recorded_by','statement_ref']),lot_id:l.id,supplied_on:when,litres:qty,retain_until:retention(when),composition:JSON.stringify(composition)});extra.evidence=JSON.stringify({recipient:d.recipient,address:d.address,statement_ref:d.statement_ref,composition});}
  await take(db,l,v,qty);return op(db,l,cmd,d,extra);
 }
 if(['hold','release'].includes(cmd)){const l=await resolve(db,'lots',d.lot);await db.query('update lots set status=$2 where id=$1',[l.id,cmd==='hold'?'hold':'available']);return op(db,l,cmd,d);}
 if(cmd==='analyse'){const l=await resolve(db,'lots',d.lot);const when=date(d.sampled_on);if(when<l.received_on)throw Error('Sample predates lot receipt');const value=Number(required(d.value,'value'));if(!Number.isFinite(value))throw Error('Invalid analysis value');return insert(db,'analyses',{lot_id:l.id,vessel:d.vessel||null,sampled_on:date(d.sampled_on),...textFields(d,['metric','unit','lab_ref']),value});}
 if(cmd==='addition'){const l=await movable(db,d.lot);if(date(d.occurred_on||today())<l.received_on)throw Error('Addition predates lot receipt');return insert(db,'additions',{lot_id:l.id,occurred_on:date(d.occurred_on||today()),...textFields(d,['material','supplier','supplier_batch','unit','recorded_by','note']),quantity:number(d.quantity,'quantity')});}
 if(cmd==='complete'||cmd==='cancel'){const w=await resolve(db,'work_orders',d.job);if(w.status!=='open')throw Error('Work order is not open');return (await db.query('update work_orders set status=$2,completed_on=$3,note=note||$4 where id=$1 returning *',[w.id,cmd==='complete'?'done':'cancelled',cmd==='complete'?date(d.occurred_on||today()):null,'\n'+required(d.note,'note')+' ('+required(d.recorded_by,'recorded_by')+')']))[0];}
 if(cmd==='log'){const l=await resolve(db,'lots',d.lot);return insert(db,'notes',{lot_id:l.id,...textFields(d,['note','recorded_by'])});}
 throw Error(`Unknown write command: ${cmd}`);
});}
export async function trace(db,ref){const l=await resolve(db,'lots',ref);const lineage=await db.query(`with recursive family(id) as (select $1::uuid union select e.child_id from lineage e join family f on f.id=e.parent_id) select l.id,l.name from family f join lots l on l.id=f.id order by l.name`,[l.id]);const ids=lineage.map(x=>x.id);return {lot:l,origins:await origin(db,l),descendants:lineage,positions:await db.query('select * from cellar_view where id=any($1::uuid[])',[ids]),operations:await db.query('select * from operations where lot_id=any($1::uuid[]) order by created_at',[ids]),supplies:await db.query('select * from supplies where lot_id=any($1::uuid[])',[ids]),bottlings:await db.query('select * from bottlings where lot_id=any($1::uuid[])',[ids]),additions:await db.query('select * from additions where lot_id=any($1::uuid[])',[ids])};}
export async function importVintrace(db,file,{kind='vineyards',preview=false,sampledOn}={}){
 const rows=parseCsv(readFileSync(file,'utf8'));if(!rows.length)throw Error('CSV contains no records');if(!['vineyards','lab'].includes(kind))throw Error('Import kind: vineyards or lab');
 return tx(db,async()=>{const result={kind,preview,inserted:0,unchanged:0,metrics:0,rows:rows.length};
 for(const [index,r] of rows.entries()){
  try{
   if(kind==='vineyards'){
    const source_id=required(pick(r,'VINx2 ID'),'VINx2 ID'),name=required(pick(r,'Name'),'Name'),grower=required(pick(r,'Grower'),'Grower');
    const [old]=await db.query('select * from vineyards where source_id=$1',[source_id]);
    if(old){if(JSON.stringify(old.source_record)!==JSON.stringify(r)&&JSON.stringify(Object.entries(old.source_record).sort())!==JSON.stringify(Object.entries(r).sort()))throw Error('Existing source id differs: reconcile changes before import');result.unchanged++;continue;}
    const same=await db.query('select id from vineyards where lower(name)=lower($1)',[name]);if(same.length)throw Error('Vineyard name already exists with another source id');
    await insert(db,'vineyards',{source_id,name,grower,region:pick(r,'GI','Region','AVA')||null,address:['Street 1','Street 2','City'].map(k=>pick(r,k)).filter(Boolean).join(', ')||null,source_record:JSON.stringify(r)});result.inserted++;
   }else{
    const id=required(pick(r,'id'),'id'),batch=required(pick(r,'Batch'),'Batch'),l=await resolve(db,'lots',batch),when=date(sampledOn||pick(r,'Sampled On'),'Sampled On or --sampled-on');
    if(when<l.received_on)throw Error('Sample predates lot receipt');
    for(const [metric,unit] of [['pH','pH'],['Brix','degBx'],['FSO2','mg/L'],['TA','g/L'],['Temp','C']]){
     const value=pick(r,metric);if(!value||['R','NR'].includes(value.toUpperCase()))continue;
     if(!Number.isFinite(Number(value)))throw Error(`Invalid ${metric}`);
     const source_key=`${id}:${metric}`,data={lot_id:l.id,vessel:pick(r,'Vessel')||null,sampled_on:when,metric,value:Number(value),unit,lab_ref:pick(r,'Lab Ref')||id,source_key,source_record:JSON.stringify(r)};
     const [old]=await db.query('select * from analyses where source_key=$1',[source_key]);
     if(old){if(Number(old.value)!==data.value||old.lot_id!==l.id||old.sampled_on!==when||old.vessel!==data.vessel||old.lab_ref!==data.lab_ref)throw Error('Existing result differs: reconcile before import');result.unchanged++;}else{await insert(db,'analyses',data);result.metrics++;}
    }
   }
  }catch(e){throw Error(`CSV row ${index+2}: ${e.message}`);}
 }
 if(preview)await db.exec('ROLLBACK; BEGIN');return result;
 });
}
export async function exportAll(db,dir){const out=path.resolve(dir);mkdirSync(out,{recursive:true});const counts={};await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of TABLES){const rows=await db.query(`select * from ${t} order by id`);writeFileSync(path.join(out,t+'.json'),JSON.stringify(rows,null,2)+'\n');counts[t]=rows.length;}await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,exported_at:new Date().toISOString(),counts},null,2)+'\n');return {directory:out,counts};}
export async function draft(db,ref){const t=await trace(db,ref);return {file:writeOut('drafts','lot-'+t.lot.id,page({title:'Lot review draft',subtitle:t.lot.name,sections:[{title:'Review before sharing',html:'<p>Internal draft. No release or certification implied.</p>'},...['origins','positions','supplies','bottlings','additions'].map(k=>({title:k,html:table(t[k])}))]}))};}
