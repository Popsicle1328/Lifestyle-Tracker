import {differenceInCalendarDays,format,parseISO,subDays} from 'date-fns';
import type {ExerciseDefinition,WorkoutSession,WorkoutSet} from './models';

export const muscleRegions = [
 {id:'chest',label:'Chest',muscles:['sternocostal_pectoralis_major','clavicular_pectoralis_major','pectoralis_major']},
 {id:'shoulders',label:'Shoulders',muscles:['anterior_deltoid','lateral_deltoid','posterior_deltoid']},
 {id:'biceps',label:'Biceps',muscles:['biceps_brachii','brachialis']},
 {id:'triceps',label:'Triceps',muscles:['triceps_brachii']},
 {id:'forearms',label:'Forearms',muscles:['wrist_flexors','finger_flexors','wrist_extensors','brachioradialis']},
 {id:'back',label:'Back',muscles:['latissimus_dorsi','rhomboids','middle_trapezius','lower_trapezius','upper_trapezius','teres_major']},
 {id:'quads',label:'Quadriceps',muscles:['quadriceps']},
 {id:'hamstrings',label:'Hamstrings',muscles:['hamstrings']},
 {id:'glutes',label:'Glutes',muscles:['gluteus_maximus']},
 {id:'calves',label:'Calves',muscles:['gastrocnemius','soleus']},
 {id:'core',label:'Abs & core',muscles:['core_stabilizers','rectus_abdominis','obliques']},
] as const;
export type Split='all'|'push'|'pull'|'legs';
export type Region = typeof muscleRegions[number]['id'];
export function regionOf(exercise:ExerciseDefinition):string[]{
 return muscleRegions.filter(r=>r.muscles.some(m=>exercise.primaryMuscles.includes(m))).map(r=>r.id);
}
export function splitOf(exercise:ExerciseDefinition):Split|'core'|'other' {
 const groups=regionOf(exercise);
 if(groups.some(g=>['chest','shoulders','triceps'].includes(g)))return 'push';
 if(groups.some(g=>['back','biceps','forearms'].includes(g)))return 'pull';
 if(groups.some(g=>['quads','hamstrings','glutes','calves'].includes(g)))return 'legs';
 if(groups.includes('core'))return 'core';
 return 'other';
}
export function matchesExercise(e:ExerciseDefinition,region:string,split:Split):boolean {
 return e.category!=='cardio'&&(region==='all'||regionOf(e).includes(region))&&(split==='all'||splitOf(e)===split);
}
export const muscleTint:Record<string,string>={chest:'#e9edff',shoulders:'#e8defe',biceps:'#e9ddff',triceps:'#ffdfed',forearms:'#e8e7fb',back:'#d9f3ec',quads:'#ffe5d2',hamstrings:'#ffe4cf',glutes:'#ffe0d8',calves:'#ffe6d7',core:'#fff2d7'};
export const muscleInk:Record<string,string>={chest:'#5366b5',shoulders:'#7954b7',biceps:'#7756ad',triceps:'#b74e80',forearms:'#655ba0',back:'#167e70',quads:'#ad6a31',hamstrings:'#b77733',glutes:'#bb6c54',calves:'#aa7040',core:'#9c7829'};
export function primaryRegions(exercises:ExerciseDefinition[]):string[]{return [...new Set(exercises.flatMap(regionOf))];}
export function sessionMuscles(sessionId:string,sets:WorkoutSet[],byId:Map<string,ExerciseDefinition>):string[]{
 const e=sets.filter(s=>s.sessionId===sessionId&&s.setKind!=='warmup').map(s=>byId.get(s.exerciseId)).filter((e):e is ExerciseDefinition=>!!e);
 return primaryRegions(e);
}
export type FocusSuggestion={split:'push'|'pull'|'legs';title:string;reason:string;groups:{id:string;label:string;daysAgo:number|null;trainingDays30:number}[];exercises:ExerciseDefinition[];optionalCardio:string;coreExercises:ExerciseDefinition[];coreOverdue:boolean};
export function recommendFocus(sessions:WorkoutSession[],sets:WorkoutSet[],exercises:ExerciseDefinition[],atDate=new Date()):FocusSuggestion {
 const byId=new Map(exercises.map(e=>[e.id,e]));
 const currentKey=format(atDate,'yyyy-MM-dd');
 const regions=muscleRegions.map(r=>{
  const used=new Set<string>();
  for(const set of sets){if(set.setKind==='warmup')continue;
   const s=sessions.find(s=>s.id===set.sessionId);
   const e=byId.get(set.exerciseId);
   if(!s||!e||s.status!=='completed'||!r.muscles.some(m=>e.primaryMuscles.includes(m)))continue;
   used.add(s.date);
  }
  const dates=[...used].sort();
  const latest=dates[dates.length-1];
  const daysAgo=latest?Math.max(0,differenceInCalendarDays(atDate,parseISO(latest))):null;
  const thirtyAgo=format(subDays(atDate,29),'yyyy-MM-dd');
  return {id:r.id,label:r.label,daysAgo,trainingDays30:dates.filter(d=>d>=thirtyAgo).length};
 });
 const categories:{split:'push'|'pull'|'legs';focus:string[]}[]=[
  {split:'push',focus:['chest','shoulders','triceps']},
  {split:'pull',focus:['back','biceps','forearms']},
  {split:'legs',focus:['quads','hamstrings','glutes','calves']},
 ];
 const completed=sessions.filter(s=>s.status==='completed'&&s.date<=currentKey).sort((a,b)=>b.startedAt.localeCompare(a.startedAt));
 const lastWorkout=completed[0];
 const gap=lastWorkout?Math.max(0,differenceInCalendarDays(atDate,new Date(lastWorkout.startedAt))):null;
 const recentSplits=completed.slice(0,4).map(s=>{
  const ids=new Set(sets.filter(x=>x.sessionId===s.id).map(x=>x.exerciseId));
  return categories.map(c=>({split:c.split,count:exercises.filter(e=>ids.has(e.id)&&splitOf(e)===c.split).length})).sort((a,b)=>b.count-a.count)[0];
 }).filter(x=>x.count>0).map(x=>x.split);
 // When returning after a long break, never suggest all groups at once. Resume the PPL cycle.
 let target:'push'|'pull'|'legs';
 if(gap===null||gap>=7){const last=recentSplits[0];target=last==='push'?'pull':last==='pull'?'legs':'push';}
 else {
  const ranked=categories.map(c=>{
   const members=regions.filter(r=>c.focus.includes(r.id));
   const score=members.reduce((acc,r)=>acc+Math.min(7,r.daysAgo??7)-Math.min(3,r.trainingDays30)*0.5,0)/members.length;
   const recently=recentSplits[0]===c.split?3:0;
   return {split:c.split,score:score-recently};
  }).sort((a,b)=>b.score-a.score);
  target=ranked[0].split;
 }
 const candidate=categories.find(c=>c.split===target)!;
 const focus=regions.filter(r=>candidate.focus.includes(r.id)).sort((a,b)=>(b.daysAgo??999)-(a.daysAgo??999));
 const recommended=exercises.filter(e=>splitOf(e)===target).sort((a,b)=>{
  const aIndex=focus.findIndex(r=>regionOf(a).includes(r.id));const bIndex=focus.findIndex(r=>regionOf(b).includes(r.id));return aIndex-bIndex;
 }).slice(0,5);
 const optionalCore=regions.find(r=>r.id==='core');
 const coreOverdue=!!optionalCore&&(optionalCore.daysAgo===null||optionalCore.daysAgo>=4);
 const addCore=coreOverdue&&target==='pull';
 const coreExercises=addCore?exercises.filter(e=>splitOf(e)==='core').slice(0,2):[];
 const coreNote=addCore?' Include a manageable core exercise rather than trying to train everything.':'';
 return {split:target,title:`${target[0].toUpperCase()+target.slice(1)}${addCore?' + core':''} day suggested`,reason:gap!==null&&gap>=7?`Returning after ${gap} days away: ease back in with one familiar split, not an all-muscle catch-up.${coreNote}`:`Balances recent training frequency and time since each group was trained. Suggestions are optional.${coreNote}`,groups:focus,exercises:recommended,optionalCardio:'Optional incline treadmill walk (duration, speed and incline are your choice).',coreExercises,coreOverdue};
}
