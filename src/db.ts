import Dexie,{type EntityTable} from 'dexie';
import {z} from 'zod';
import {DEFAULT_PREFS,type Preferences,type SleepRecord,type ExerciseDefinition,type WorkoutSession,type WorkoutSet,type CardioInterval,type AppMeta,type FoodDefinition,type FoodLog,type WaterLog,type NutritionPrefs,DEFAULT_NUTRITION_PREFS} from './models';
import {checkInterval} from './logic';
import {createDemoData,initialExercises} from './demo';
class DaymarkDB extends Dexie {
 sleep!:EntityTable<SleepRecord,'id'>;preferences!:EntityTable<Preferences,'id'>;
 exercises!:EntityTable<ExerciseDefinition,'id'>;workoutSessions!:EntityTable<WorkoutSession,'id'>;
 workoutSets!:EntityTable<WorkoutSet,'id'>;cardioIntervals!:EntityTable<CardioInterval,'id'>;appMeta!:EntityTable<AppMeta,'id'>;
 foods!:EntityTable<FoodDefinition,'id'>;foodLogs!:EntityTable<FoodLog,'id'>;waterLogs!:EntityTable<WaterLog,'id'>;nutritionPrefs!:EntityTable<NutritionPrefs,'id'>;
 constructor(){super('daymark-local-v1');
  this.version(1).stores({sleep:'id,&sleepDate,bedtime,wakeup,updatedAt',preferences:'id'});
  this.version(2).stores({sleep:'id,&sleepDate,bedtime,wakeup,updatedAt',preferences:'id',exercises:'id,name,category',workoutSessions:'id,date,startedAt,status',workoutSets:'id,sessionId,exerciseId,completedAt',cardioIntervals:'id,sessionId',appMeta:'id'});
  this.version(3).stores({sleep:'id,&sleepDate,bedtime,wakeup,updatedAt',preferences:'id',exercises:'id,name,category',workoutSessions:'id,date,startedAt,status',workoutSets:'id,sessionId,exerciseId,completedAt',cardioIntervals:'id,sessionId',appMeta:'id',foods:'id,name',foodLogs:'id,date,foodId,at',waterLogs:'id,date,at',nutritionPrefs:'id'});
 }
}
export const db=new DaymarkDB();
export async function getPrefs(){return (await db.preferences.get('main'))??DEFAULT_PREFS;}
export async function savePrefs(value:Preferences){await db.preferences.put(value);}
export async function getNutritionPrefs(){return (await db.nutritionPrefs.get('main'))??DEFAULT_NUTRITION_PREFS;}
export async function saveNutritionPrefs(p:NutritionPrefs){await db.nutritionPrefs.put(p);}
export async function upsertSleep(rec:SleepRecord){
 if(rec.wakeup)checkInterval(rec.bedtime,rec.wakeup);
 const sameDate=await db.sleep.where('sleepDate').equals(rec.sleepDate).first();
 if(sameDate&&sameDate.id!==rec.id)throw Error('This sleep date already has a record. Edit the existing night or choose another sleep date.');
 await db.sleep.put(rec);
}
export async function initializeCatalogAndDemo(){
 await db.transaction('rw',[db.exercises,db.sleep,db.workoutSessions,db.workoutSets,db.cardioIntervals,db.appMeta],async()=>{
  // In-place upgrade without overwriting any user's records or edited catalog entries.
  for(const exercise of initialExercises)if(!await db.exercises.get(exercise.id))await db.exercises.add(exercise);
  if(await db.appMeta.get('demoInitialized'))return;
  const demo=createDemoData();
  for(const s of demo.sleep)if(!await db.sleep.where('sleepDate').equals(s.sleepDate).first())await db.sleep.add(s);
  const present=new Set((await db.workoutSessions.toArray()).map(s=>s.date));
  const selected=demo.workoutSessions.filter(s=>!present.has(s.date));
  await db.workoutSessions.bulkAdd(selected);
  const ids=new Set(selected.map(s=>s.id));
  await db.workoutSets.bulkAdd(demo.workoutSets.filter(s=>ids.has(s.sessionId)));
  await db.cardioIntervals.bulkAdd(demo.cardioIntervals.filter(s=>ids.has(s.sessionId)));
  await db.appMeta.put({id:'demoInitialized',value:new Date().toISOString()});
 });
}
export async function removeDemo(){
 await db.transaction('rw',db.sleep,db.workoutSessions,db.workoutSets,db.cardioIntervals,db.appMeta,async()=>{
  await db.sleep.filter(x=>!!x.isDemo).delete();
  await db.workoutSets.filter(x=>!!x.isDemo).delete();
  await db.cardioIntervals.filter(x=>!!x.isDemo).delete();
  await db.workoutSessions.filter(x=>!!x.isDemo).delete();
  await db.appMeta.put({id:'demoInitialized',value:'removed'});
 });
}
export async function addDemoOnceMore(){
 await db.appMeta.delete('demoInitialized');
 await initializeCatalogAndDemo();
}
const sleepSchema=z.object({id:z.string().min(1),sleepDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),bedtime:z.string().datetime({offset:true}),wakeup:z.string().datetime({offset:true}).nullable(),createdAt:z.string().datetime({offset:true}),updatedAt:z.string().datetime({offset:true}),sourceBed:z.enum(['now','manual']),sourceWake:z.enum(['now','manual']).nullable(),note:z.string().optional(),isDemo:z.boolean().optional()});
const prefSchema=z.object({id:z.literal('main'),latencyMinutes:z.number().int().min(0).max(240),idealMinMinutes:z.number().int(),idealMaxMinutes:z.number().int(),yellowLowMinutes:z.number().int(),redLowMinutes:z.number().int(),yellowHighMinutes:z.number().int(),redHighMinutes:z.number().int(),fluctuationMinutes:z.number().int().min(1),dayCutoffHour:z.number().int().min(0).max(23)});
const exerciseSchema=z.object({id:z.string(),name:z.string(),category:z.string(),equipment:z.string(),loadMode:z.string().optional(),primaryMuscles:z.array(z.string()),secondaryMuscles:z.array(z.string()),reviewStatus:z.string().optional(),notes:z.string().optional(),aliases:z.array(z.string()).optional(),isCustom:z.boolean().optional(),splitOverride:z.enum(['push','pull','legs','core','other']).optional()});
const unit=z.enum(['kg_each','kg_total','machine_level','stack_kg','bodyweight']);
const sessionSchema=z.object({id:z.string(),date:z.string(),startedAt:z.string(),endedAt:z.string().nullable(),status:z.enum(['active','paused','completed']),pauses:z.array(z.object({startedAt:z.string(),endedAt:z.string().nullable()})),bodyWeightKg:z.number().nullable(),notes:z.string(),createdAt:z.string(),updatedAt:z.string(),isDemo:z.boolean().optional()});
const setSchema=z.object({id:z.string(),sessionId:z.string(),exerciseId:z.string(),sequence:z.number().int(),weight:z.number().nullable(),reps:z.number().int(),unit,completedAt:z.string(),startedAt:z.string().nullable(),setKind:z.enum(['working','warmup','dropset']),dropStages:z.array(z.object({weight:z.number(),reps:z.number(),unit,at:z.string()})),supersetGroupId:z.string().nullable(),effort:z.enum(['normal','near_failure','failure']).nullable(),notes:z.string(),isDemo:z.boolean().optional(),timestampSource:z.enum(['automatic','grouped','manual']).optional()});
const cardioSchema=z.object({id:z.string(),sessionId:z.string(),kind:z.literal('incline_treadmill'),startedAt:z.string(),endedAt:z.string(),durationMinutes:z.number(),speedKmh:z.number(),inclinePercent:z.number(),bodyWeightKg:z.number().nullable(),isDemo:z.boolean().optional()});
const nutrient=z.number().finite().min(0).max(1000000);
const foodSnapshotSchema=z.object({name:z.string().min(1),portionAmount:z.number().positive(),portionUnit:z.string().min(1),calories:nutrient,protein:nutrient,carbs:nutrient,fat:nutrient,categories:z.array(z.string()).optional()});
const foodSchema=foodSnapshotSchema.extend({id:z.string().min(1),createdAt:z.string(),updatedAt:z.string(),isArchived:z.boolean().optional()});
const foodLogSchema=z.object({id:z.string(),date:z.string(),foodId:z.string(),portions:z.number().positive(),foodSnapshot:foodSnapshotSchema,at:z.string(),note:z.string()});
const waterLogSchema=z.object({id:z.string(),date:z.string(),amountMl:z.number().positive(),at:z.string()});
const nutritionPrefSchema=z.object({id:z.literal('main'),calorieTarget:nutrient.nullable(),proteinTarget:nutrient.nullable(),carbsTarget:nutrient.nullable(),fatTarget:nutrient.nullable(),waterTargetMl:nutrient.nullable(),bodyWeightKg:nutrient.nullable().optional(),workoutDaysPerWeek:z.number().min(0).max(7).nullable().optional(),calorieBurnTarget:nutrient.nullable().optional()});
const backupV1=z.object({app:z.literal('daymark'),schemaVersion:z.literal(1),exportedAt:z.string(),preferences:prefSchema,sleep:z.array(sleepSchema)});
const backupV2=z.object({app:z.literal('daymark'),schemaVersion:z.literal(2),exportedAt:z.string(),preferences:prefSchema,sleep:z.array(sleepSchema),exercises:z.array(exerciseSchema),workoutSessions:z.array(sessionSchema),workoutSets:z.array(setSchema),cardioIntervals:z.array(cardioSchema)});
const backupV3=backupV2.omit({schemaVersion:true}).extend({schemaVersion:z.literal(3),foods:z.array(foodSchema),foodLogs:z.array(foodLogSchema),waterLogs:z.array(waterLogSchema),nutritionPrefs:nutritionPrefSchema});
export async function makeBackup(){return {app:'daymark' as const,schemaVersion:3 as const,exportedAt:new Date().toISOString(),preferences:await getPrefs(),sleep:await db.sleep.toArray(),exercises:await db.exercises.toArray(),workoutSessions:await db.workoutSessions.toArray(),workoutSets:await db.workoutSets.toArray(),cardioIntervals:await db.cardioIntervals.toArray(),foods:await db.foods.toArray(),foodLogs:await db.foodLogs.toArray(),waterLogs:await db.waterLogs.toArray(),nutritionPrefs:await getNutritionPrefs()};}
export async function restoreBackup(input:unknown){
 const parsed=z.union([backupV3,backupV2,backupV1]).parse(input);
 if(new Set(parsed.sleep.map(r=>r.sleepDate)).size!==parsed.sleep.length)throw Error('Backup has duplicate sleep dates.');
 if(new Set(parsed.sleep.map(r=>r.id)).size!==parsed.sleep.length)throw Error('Backup has duplicate sleep identifiers.');
 for(const r of parsed.sleep)if(r.wakeup)checkInterval(r.bedtime,r.wakeup);
 const sessions=parsed.schemaVersion===1?[]:parsed.workoutSessions;
 const sets=parsed.schemaVersion===1?[]:parsed.workoutSets;
 const cardio=parsed.schemaVersion===1?[]:parsed.cardioIntervals;
 const exercises=parsed.schemaVersion===1?initialExercises:parsed.exercises;
 const foods=parsed.schemaVersion===3?parsed.foods:[];const foodLogs=parsed.schemaVersion===3?parsed.foodLogs:[];const waterLogs=parsed.schemaVersion===3?parsed.waterLogs:[];const nutritionPrefs=parsed.schemaVersion===3?parsed.nutritionPrefs:DEFAULT_NUTRITION_PREFS;
 const unique=(xs:string[])=>new Set(xs).size===xs.length;
 if(![sessions.map(s=>s.id),sets.map(s=>s.id),cardio.map(s=>s.id),exercises.map(s=>s.id)].every(unique))throw Error('Backup contains duplicate identifiers.');
 const sessionIds=new Set(sessions.map(s=>s.id));const exerciseIds=new Set(exercises.map(e=>e.id));
 if(sets.some(s=>!sessionIds.has(s.sessionId)||!exerciseIds.has(s.exerciseId))||cardio.some(c=>!sessionIds.has(c.sessionId))||foodLogs.some(f=>!new Set(foods.map(x=>x.id)).has(f.foodId)))throw Error('Backup contains orphaned workout records.');
 await db.transaction('rw',[db.sleep,db.preferences,db.exercises,db.workoutSessions,db.workoutSets,db.cardioIntervals,db.appMeta,db.foods,db.foodLogs,db.waterLogs,db.nutritionPrefs],async()=>{
  await Promise.all([db.sleep.clear(),db.exercises.clear(),db.workoutSessions.clear(),db.workoutSets.clear(),db.cardioIntervals.clear(),db.foods.clear(),db.foodLogs.clear(),db.waterLogs.clear()]);
  await db.sleep.bulkAdd(parsed.sleep);await db.preferences.put(parsed.preferences);await db.exercises.bulkAdd(exercises);await db.workoutSessions.bulkAdd(sessions);await db.workoutSets.bulkAdd(sets);await db.cardioIntervals.bulkAdd(cardio);await db.nutritionPrefs.put(nutritionPrefs);await db.foods.bulkAdd(foods);await db.foodLogs.bulkAdd(foodLogs);await db.waterLogs.bulkAdd(waterLogs);await db.appMeta.put({id:'demoInitialized',value:'restored'});
 });
 return {sleep:parsed.sleep.length,sessions:sessions.length};
}
export function downloadFile(name:string,blob:Blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const quote=(s:unknown)=>`"${String(s??'').replaceAll('"','""')}"`;
export async function exportCsv(){const list=await db.sleep.orderBy('sleepDate').toArray();const pref=await getPrefs();const cols=['sleepDate','bedtime','wakeup','bedMinutes','estimatedMinutes','sourceBed','sourceWake','isDemo','note'];const rows=list.map(r=>{const bed=r.wakeup?Math.round((Date.parse(r.wakeup)-Date.parse(r.bedtime))/60000):'';return [r.sleepDate,r.bedtime,r.wakeup??'',bed,typeof bed==='number'?Math.max(0,bed-pref.latencyMinutes):'',r.sourceBed,r.sourceWake??'',r.isDemo?'YES':'NO',r.note??''].map(quote).join(',');});downloadFile('daymark-sleep.csv',new Blob([[cols.join(','),...rows].join('\r\n')],{type:'text/csv;charset=utf-8'}));}
export async function exportWorkoutCsv(){
 const [sets,sessions,exercises,cardio]=await Promise.all([db.workoutSets.toArray(),db.workoutSessions.toArray(),db.exercises.toArray(),db.cardioIntervals.toArray()]);
 const byS=new Map(sessions.map(s=>[s.id,s]));const byE=new Map(exercises.map(e=>[e.id,e]));
 const cols=['sessionDate','sessionId','exercise','set','weight','unit','reps','kind','dropStages','supersetGroup','effort','completedAt','timingSource','isDemo'];
 const rows=sets.map(s=>[byS.get(s.sessionId)?.date,s.sessionId,byE.get(s.exerciseId)?.name,s.sequence,s.weight??'',s.unit,s.reps,s.setKind,JSON.stringify(s.dropStages),s.supersetGroupId??'',s.effort??'',s.timestampSource==='manual'?'':s.completedAt,s.timestampSource??'automatic',s.isDemo?'YES':'NO'].map(quote).join(','));
 downloadFile('daymark-workout-sets.csv',new Blob([[cols.join(','),...rows].join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const cardioCols=['sessionDate','sessionId','durationMinutes','speedKmh','inclinePercent','bodyWeightKg','isDemo'];
 const cardioRows=cardio.map(c=>[byS.get(c.sessionId)?.date,c.sessionId,c.durationMinutes,c.speedKmh,c.inclinePercent,c.bodyWeightKg??'',c.isDemo?'YES':'NO'].map(quote).join(','));
 downloadFile('daymark-cardio.csv',new Blob([[cardioCols.join(','),...cardioRows].join('\r\n')],{type:'text/csv;charset=utf-8'}));
}

export async function exportNutritionCsv(){
 const foods=await db.foodLogs.orderBy('date').toArray();const water=await db.waterLogs.orderBy('date').toArray();
 const header=['date','time','foodId','food','categories','portions','portionAmount','portionUnit','kcal','proteinG','carbsG','fatG','note'];
 const rows=foods.map(f=>[f.date,f.at,f.foodId,f.foodSnapshot.name,(f.foodSnapshot.categories??[]).join('; '),f.portions,f.foodSnapshot.portionAmount,f.foodSnapshot.portionUnit,f.foodSnapshot.calories*f.portions,f.foodSnapshot.protein*f.portions,f.foodSnapshot.carbs*f.portions,f.foodSnapshot.fat*f.portions,f.note].map(quote).join(','));
 downloadFile('daymark-nutrition.csv',new Blob([[header.join(','),...rows].join('\r\n')],{type:'text/csv;charset=utf-8'}));
 downloadFile('daymark-water.csv',new Blob([['date,time,amountMl',...water.map(w=>[w.date,w.at,w.amountMl].map(quote).join(','))].join('\r\n')],{type:'text/csv;charset=utf-8'}));
}
