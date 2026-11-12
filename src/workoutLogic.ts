import type {WorkoutSession,WorkoutSet,CardioInterval,ExerciseDefinition,LoadUnit} from './models';
export function activeMinutes(session:WorkoutSession,nowISO=new Date().toISOString()):number {
 const end=Date.parse(session.endedAt??nowISO);
 const started=Date.parse(session.startedAt);
 if(!Number.isFinite(end)||!Number.isFinite(started)||end<started)return 0;
 const paused=session.pauses.reduce((sum,p)=>{
  const a=Math.max(started,Date.parse(p.startedAt));
  const b=Math.min(end,Date.parse(p.endedAt??nowISO));
  return sum+Math.max(0,b-a);
 },0);
 return Math.max(0,Math.round((end-started-paused)/60000));
}
export function restApproxMinutes(prev:WorkoutSet|undefined,current:WorkoutSet):number|null {
 if(!prev||prev.sessionId!==current.sessionId)return null;
 const delta=(Date.parse(current.completedAt)-Date.parse(prev.completedAt))/60000;
 return Number.isFinite(delta)&&delta>=0?Math.round(delta*10)/10:null;
}
export function estimatedGrossKcal(massKg:number|null,minutes:number,met:number):number|null {
 if(massKg===null||!Number.isFinite(massKg)||massKg<=0||!Number.isFinite(minutes)||minutes<0)return null;
 return Math.round(met*3.5*massKg/200*minutes);
}
export function treadmillKcal(massKg:number|null,speedKmh:number,gradePercent:number,minutes:number):number|null {
 if(massKg===null||massKg<=0||speedKmh<=0||gradePercent<0||minutes<=0)return null;
 const speedMMin=speedKmh*1000/60;
 const vo2=3.5+0.1*speedMMin+1.8*speedMMin*(gradePercent/100);
 return Math.round(vo2*massKg*minutes/200);
}
export function totalSessionKcal(session:WorkoutSession,cardio:CardioInterval[]):number|null {
 if(session.bodyWeightKg===null)return null;
 const minutes=activeMinutes(session);
 const treadmillMinutes=cardio.reduce((sum,c)=>sum+c.durationMinutes,0);
 const resistance=estimatedGrossKcal(session.bodyWeightKg,Math.max(0,minutes-treadmillMinutes),3.5)??0;
 const walking=cardio.reduce((sum,c)=>sum+(treadmillKcal(c.bodyWeightKg??session.bodyWeightKg,c.speedKmh,c.inclinePercent,c.durationMinutes)??0),0);
 return resistance+walking;
}
export function activeDaysForMuscle(sessions:WorkoutSession[],sets:WorkoutSet[],exercises:ExerciseDefinition[],muscle:string,includeSecondary=false){
 const ids=new Set(exercises.filter(e=>e.primaryMuscles.includes(muscle)||(includeSecondary&&e.secondaryMuscles.includes(muscle))).map(e=>e.id));
 const dayBySession=new Map(sessions.map(s=>[s.id,s.date]));
 return new Set(sets.filter(s=>s.setKind!=='warmup'&&ids.has(s.exerciseId)).map(s=>dayBySession.get(s.sessionId)).filter((d):d is string=>!!d)).size;
}
export function exerciseTrend(sets:WorkoutSet[],sessions:WorkoutSession[],id:string){
 const dateMap=new Map(sessions.map(s=>[s.id,s.date]));
 const ordered=sets.filter(s=>s.exerciseId===id&&s.setKind==='working').sort((a,b)=>a.completedAt.localeCompare(b.completedAt));
 const byDate=new Map<string,{date:string,weight:number,reps:number,unit:LoadUnit,sets:number,superset:boolean}>();
 for(const s of ordered){const date=dateMap.get(s.sessionId);if(!date||s.weight===null)continue;
  const key=`${date}/${s.unit}`;const prev=byDate.get(key);
  if(!prev||s.weight>prev.weight||(s.weight===prev.weight&&s.reps>prev.reps))byDate.set(key,{date,weight:s.weight,reps:s.reps,unit:s.unit,sets:(prev?.sets??0)+1,superset:!!s.supersetGroupId});
  else prev.sets+=1;
 }
 return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function contextMessage(current:WorkoutSet[],previous:WorkoutSet[],currentSessionSets:WorkoutSet[]=current,previousSessionSets:WorkoutSet[]=previous):string {
 if(!previous.length||!current.length)return 'More comparable sessions are needed';
 if(current.some(s=>s.supersetGroupId))return 'Superset session: lower reps are not treated as a strength decline';
 if(current.some(s=>s.setKind==='dropset'))return 'Drop-set context: review separately from straight working sets';
 const ordered=(list:WorkoutSet[])=>[...list].sort((a,b)=>a.completedAt.localeCompare(b.completedAt));
 const uniqueOrder=(all:WorkoutSet[])=>[...new Set(ordered(all).map(x=>x.exerciseId))];
 const first=ordered(current)[0],old=ordered(previous)[0];
 if(first.unit!==old.unit)return 'Load unit changed: comparison is not valid';
 if(first.weight!==old.weight)return 'Resistance changed: compare volume and reps before interpreting strength';
 const newPosition=uniqueOrder(currentSessionSets).indexOf(first.exerciseId);
 const oldPosition=uniqueOrder(previousSessionSets).indexOf(old.exerciseId);
 if(first.reps<old.reps && newPosition>oldPosition && oldPosition>=0)return 'Later exercise order: possible accumulated fatigue, not a confirmed performance decline';
 const typicalRest=(list:WorkoutSet[])=>{const sorted=ordered(list);const intervals=sorted.slice(1).map((x,i)=>restApproxMinutes(sorted[i],x)).filter((x):x is number=>x!==null);return intervals.length?intervals.reduce((a,b)=>a+b,0)/intervals.length:null};
 const newRest=typicalRest(current),oldRest=typicalRest(previous);
 if(first.reps<old.reps&&newRest!==null&&oldRest!==null&&newRest<oldRest*.75)return 'Shorter rest between completed-set taps: reps may reflect reduced recovery';
 if(first.reps<old.reps)return 'Single-session rep drop: track another comparable session before flagging a decline';
 if(first.reps>old.reps)return 'Rep improvement at a comparable load and set context';
 return 'Stable logged performance: progression thresholds still need your approval';
}
