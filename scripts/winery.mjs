#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { getDb } from './lib/db.mjs';
import { table } from './lib/format.mjs';
import { READS,mutate,trace,importVintrace,exportAll,draft } from './lib/domain.mjs';
const args=process.argv.slice(2),pos=args.filter(x=>!x.startsWith('--')),[cmd='help',...rest]=pos;
const flag=n=>args.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const writes=['add','receive','transfer','blend','loss','bottle','supply','hold','release','analyse','addition','complete','cancel','log'];
const help={reads:Object.keys(READS),writes,other:['trace <lot>','draft-lot <lot>','import vintrace <file.csv> --kind=vineyards|lab [--preview] [--sampled-on=YYYY-MM-DD]','export <directory>'],input:'Writes take --file=record.json. Reads and writes support --json. See docs/cli.md.'};
function print(result){if(args.includes('--json')){console.log(JSON.stringify(result,null,2));return;}if(Array.isArray(result)){console.log(table(result,Object.keys(result[0]||{}).map(key=>({key,label:key,width:75}))));}else if(result&&typeof result==='object'){for(const [key,v]of Object.entries(result)){console.log('\n'+key);if(Array.isArray(v))print(v);else if(v&&typeof v==='object')console.log(JSON.stringify(v,null,2));else console.log(String(v??''));}}else console.log(String(result));}
if(cmd==='help'||cmd==='--help'||args.includes('--help'))print(help);
else{let db;try{db=await getDb();let result;if(READS[cmd])result=await db.query(READS[cmd]);else if(writes.includes(cmd)){const file=flag('file');if(!file)throw Error('Write commands require --file=record.json');result=await mutate(db,cmd,JSON.parse(readFileSync(file,'utf8')));}else if(cmd==='trace')result=await trace(db,rest.join(' '));else if(cmd==='draft-lot')result=await draft(db,rest.join(' '));else if(cmd==='export'){if(!rest[0])throw Error('Export directory required');result=await exportAll(db,rest[0]);}else if(cmd==='import'){if(rest[0]!=='vintrace'||!rest[1])throw Error('import vintrace <file.csv> required');result=await importVintrace(db,rest[1],{kind:flag('kind'),preview:args.includes('--preview'),sampledOn:flag('sampled-on')});}else throw Error('Unknown command: '+cmd);print(result);}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
