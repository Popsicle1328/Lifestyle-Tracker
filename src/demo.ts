import {addDays,format,subDays} from 'date-fns';
import type {SleepRecord,WorkoutSession,WorkoutSet,CardioInterval,ExerciseDefinition,LoadUnit} from './models';
import raw from './exercises.seed.json';

export const originalExercises:ExerciseDefinition[]=raw.exercises.map(e=>({
 id:e.id,name:e.name,category:e.category,equipment:e.equipment,loadMode:e.loadMode,
 primaryMuscles:e.primaryMuscles,secondaryMuscles:e.secondaryMuscles,reviewStatus:e.reviewStatus,
 notes:e.notes,aliases:e.aliases,isCustom:false
}));
// Additional optional core ideas, not part of the original user-supplied schedule.
const optionalCore:ExerciseDefinition[]=[
 {id:'suggested_plank',name:'Forearm Plank (suggested)',category:'core',equipment:'bodyweight',loadMode:'bodyweight',primaryMuscles:['core_stabilizers','rectus_abdominis'],secondaryMuscles:['obliques','gluteus_maximus'],reviewStatus:'suggestion: not in user routine'},
 {id:'suggested_dead_bug',name:'Dead Bug (suggested)',category:'core',equipment:'bodyweight',loadMode:'bodyweight',primaryMuscles:['core_stabilizers','rectus_abdominis'],secondaryMuscles:['obliques'],reviewStatus:'suggestion: not in user routine'},
 {id:'suggested_hanging_knee_raise',name:'Hanging Knee Raise (suggested)',category:'core',equipment:'pull_up_bar',loadMode:'bodyweight',primaryMuscles:['rectus_abdominis'],secondaryMuscles:['obliques'],reviewStatus:'suggestion: not in user routine'},
 {id:'suggested_cable_crunch',name:'Kneeling Cable Crunch (suggested)',category:'core',equipment:'cable_machine',loadMode:'machine_level',primaryMuscles:['rectus_abdominis'],secondaryMuscles:['obliques'],reviewStatus:'suggestion: not in user routine'},
];
export const initialExercises:ExerciseDefinition[]=[...originalExercises,...optionalCore];
const date=(d:Date)=>format(d,'yyyy-MM-dd');
const at=(d:Date,h:number,m:number)=>{const x=new Date(d);x.setHours(h,m,0,0);return x.toISOString()};
export function createDemoData(now=new Date()){
 const sleep:SleepRecord[]=[];
 const variation=[480,525,560,455,590,505,535,460,510,610,475,520,540,430,575,495,525,470,600,530,500,550,485,445,525,570,505,515,620,450,540,485,510,555,475];
 for(let offset=34;offset>=1;offset--){
  if([4,13,20,29].includes(offset))continue; // missing days deliberately demonstrate gaps
  const d=subDays(now,offset);const assigned=date(d);
  const bedtime=new Date(d);bedtime.setHours(offset%5===0?0:23,offset%5===0?18:10+(offset*7)%45,0,0);
  if(offset%5===0)bedtime.setDate(bedtime.getDate()+1); // after-midnight sleep still belongs to previous day
  const wake=new Date(bedtime.getTime()+variation[offset-1]*60000);
  sleep.push({id:`demo-sleep-${assigned}`,sleepDate:assigned,bedtime:bedtime.toISOString(),wakeup:wake.toISOString(),sourceBed:'manual',sourceWake:'manual',createdAt:at(d,12,0),updatedAt:at(d,12,0),note:'Sample record for testing, not your actual sleep.',isDemo:true});
 }
 const workoutSessions:WorkoutSession[]=[];const workoutSets:WorkoutSet[]=[];const cardioIntervals:CardioInterval[]=[];
 const layouts=[
  [['flat_dumbbell_bench_press',3,20,11,'kg_each'],['incline_dumbbell_bench_press',3,15,11,'kg_each'],['dumbbell_lateral_raise',3,5,12,'kg_each'],['cable_triceps_pushdown',3,3,13,'machine_level']],
  [['wide_grip_lat_pulldown',3,4,12,'machine_level'],['seated_cable_row',3,4,11,'machine_level'],['biceps_curl',3,7.5,12,'kg_each'],['hammer_curl',3,7.5,10,'kg_each']],
  [['leg_press',3,80,12,'kg_total'],['seated_leg_curl',3,3,12,'machine_level'],['lying_leg_curl',3,3,11,'machine_level'],['bilateral_weighted_calf_raise',3,20,15,'kg_total']],
  [['dumbbell_overhead_press',3,12.5,10,'kg_each'],['dumbbell_lateral_raise',3,5,12,'kg_each'],['single_arm_preacher_curl',3,7.5,10,'kg_each'],['dumbbell_overhead_triceps_extension',3,10,10,'kg_total']]
 ] as const;
 const offsets=[31,28,26,23,21,18,16,13,11,8,6,3];
 offsets.forEach((offset,index)=>{
  const day=subDays(now,offset);const id=`demo-session-${date(day)}`;const startedAt=at(day,18,5);const endedAt=at(day,19,20);
  const pauses=index===5?[{startedAt:at(day,18,35),endedAt:at(day,18,41)}]:[];
  workoutSessions.push({id,date:date(day),startedAt,endedAt,status:'completed',pauses,bodyWeightKg:70,notes:'DEMO ONLY — uses an illustrative 70 kg body mass. Replace with your own records.',createdAt:startedAt,updatedAt:endedAt,isDemo:true});
  const group=layouts[index%layouts.length];
  group.forEach(([exerciseId,count,weight,reps,unit],exerciseIndex)=>{
   for(let n=0;n<count;n++){
    const minutes=5+exerciseIndex*15+n*3;
    const completedAt=at(day,18+Math.floor(minutes/60),5+minutes%60);
    const plus=index>=6&&exerciseIndex===0&&unit!=='machine_level'?2.5:0;
    const isDrop=exerciseId==='biceps_curl'&&index===9&&n===2;
    const superset=(index===7&&exerciseIndex>=2)?`demo-super-${id}`:null;
    const loadUnit=unit as LoadUnit;
    const stageWeight=Math.max(0,weight+plus-(unit==='machine_level'?0:2.5));
    workoutSets.push({id:`demo-set-${id}-${exerciseIndex}-${n}`,sessionId:id,exerciseId,sequence:n+1,weight:weight+plus,reps:Math.max(5,reps-n+(index%3===0?1:0)),unit:loadUnit,completedAt,startedAt:null,setKind:isDrop?'dropset':'working',dropStages:isDrop?[{weight:stageWeight,reps:5,unit:loadUnit,at:new Date(Date.parse(completedAt)+15000).toISOString()}]:[],supersetGroupId:superset,effort:n===2?'near_failure':'normal',notes:isDrop?'Sample drop set':superset?'Sample superset':'',isDemo:true});
   }
  });
  if(index%3===1){cardioIntervals.push({id:`demo-cardio-${id}`,sessionId:id,kind:'incline_treadmill',startedAt:at(day,19,1),endedAt:at(day,19,16),durationMinutes:15,speedKmh:4.2,inclinePercent:8,bodyWeightKg:70,isDemo:true});}
 });
 return {sleep,workoutSessions,workoutSets,cardioIntervals};
}
