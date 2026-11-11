import Dexie,{type EntityTable} from 'dexie';
import {z} from 'zod';
import {DEFAULT_PREFS,type Preferences,type SleepRecord} from './models';
import {checkInterval} from './logic';
class DaymarkDB extends Dexie {sleep!:EntityTable<SleepRecord,'id'>; preferences!:EntityTable<Preferences,'id'>;constructor(){super('daymark-local-v1');this.version(1).stores({sleep:'id,&sleepDate,bedtime,wakeup,updatedAt',preferences:'id'});}}
export const db=new DaymarkDB();
export async function getPrefs(){return (await db.preferences.get('main'))??DEFAULT_PREFS;}
export async function savePrefs(value:Preferences){await db.preferences.put(value);}
export async function upsertSleep(rec:SleepRecord){
 if(rec.wakeup)checkInterval(rec.bedtime,rec.wakeup);
 const sameDate=await db.sleep.where('sleepDate').equals(rec.sleepDate).first();
 if(sameDate&&sameDate.id!==rec.id)throw Error('This sleep date already has a record. Edit the existing night or choose another sleep date.');
 await db.sleep.put(rec);
}
const sleepSchema=z.object({id:z.string().min(1),sleepDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),bedtime:z.string().datetime({offset:true}),wakeup:z.string().datetime({offset:true}).nullable(),createdAt:z.string().datetime({offset:true}),updatedAt:z.string().datetime({offset:true}),sourceBed:z.enum(['now','manual']),sourceWake:z.enum(['now','manual']).nullable(),note:z.string().optional()});
const prefSchema=z.object({id:z.literal('main'),latencyMinutes:z.number().int().min(0).max(240),idealMinMinutes:z.number().int(),idealMaxMinutes:z.number().int(),yellowLowMinutes:z.number().int(),redLowMinutes:z.number().int(),yellowHighMinutes:z.number().int(),redHighMinutes:z.number().int(),fluctuationMinutes:z.number().int().min(1),dayCutoffHour:z.number().int().min(0).max(23)});
const backupSchema=z.object({app:z.literal('daymark'),schemaVersion:z.literal(1),exportedAt:z.string(),preferences:prefSchema,sleep:z.array(sleepSchema)});
export async function makeBackup(){return {app:'daymark' as const,schemaVersion:1 as const,exportedAt:new Date().toISOString(),preferences:await getPrefs(),sleep:await db.sleep.toArray()};}
export async function restoreBackup(input:unknown){const parsed=backupSchema.parse(input);if(new Set(parsed.sleep.map(r=>r.sleepDate)).size!==parsed.sleep.length)throw Error('Backup has duplicate sleep dates.');if(new Set(parsed.sleep.map(r=>r.id)).size!==parsed.sleep.length)throw Error('Backup has duplicate record identifiers.');for(const r of parsed.sleep){if(r.wakeup)checkInterval(r.bedtime,r.wakeup);}await db.transaction('rw',db.sleep,db.preferences,async()=>{await db.sleep.clear();await db.sleep.bulkAdd(parsed.sleep);await db.preferences.put(parsed.preferences);});return parsed.sleep.length;}
export function downloadFile(name:string,blob:Blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function exportCsv(){const list=await db.sleep.orderBy('sleepDate').toArray();const quote=(s:unknown)=>`"${String(s??'').replaceAll('"','""')}"`;const cols=['sleepDate','bedtime','wakeup','bedMinutes','estimatedMinutes','sourceBed','sourceWake','note'];const pref=await getPrefs();const rows=list.map(r=>{const bed=r.wakeup?Math.round((Date.parse(r.wakeup)-Date.parse(r.bedtime))/60000):'';return [r.sleepDate,r.bedtime,r.wakeup??'',bed,typeof bed==='number'?Math.max(0,bed-pref.latencyMinutes):'',r.sourceBed,r.sourceWake??'',r.note??''].map(quote).join(',');});downloadFile('daymark-sleep.csv',new Blob([[cols.join(','),...rows].join('\r\n')],{type:'text/csv;charset=utf-8'}));}
