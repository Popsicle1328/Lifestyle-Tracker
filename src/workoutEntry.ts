import type {LoadUnit,WorkoutSet} from './models';

export type EntrySpec={exerciseId:string;weight:number|null;reps:number;unit:LoadUnit;sequence:number;setKind:WorkoutSet['setKind'];effort:WorkoutSet['effort'];dropStages:WorkoutSet['dropStages']};
export function validateSetSpec(spec:EntrySpec):string|null{
 if(!spec.exerciseId)return 'Choose an exercise.';
 if(!Number.isInteger(spec.reps)||spec.reps<1||spec.reps>500)return 'Repetitions must be between 1 and 500.';
 if(spec.unit!=='bodyweight'&&(!Number.isFinite(spec.weight)||spec.weight===null||spec.weight<0))return 'Enter a valid nonnegative load.';
 if(spec.setKind==='dropset'&&spec.dropStages.some(d=>!Number.isFinite(d.weight)||d.weight<0||!Number.isInteger(d.reps)||d.reps<1))return 'Check the drop-set stages.';
 return null;
}
export function buildSupersetRound(sessionId:string,first:EntrySpec,second:EntrySpec,at:string,newId:()=>string):[WorkoutSet,WorkoutSet]{
 if(!sessionId||first.exerciseId===second.exerciseId)throw new Error('A superset needs two different exercises.');
 const error=validateSetSpec(first)||validateSetSpec(second);if(error)throw new Error(error);
 const groupId=`superset-${newId()}`;
 const make=(entry:EntrySpec):WorkoutSet=>({id:newId(),sessionId,exerciseId:entry.exerciseId,sequence:entry.sequence,weight:entry.unit==='bodyweight'?null:entry.weight,reps:entry.reps,unit:entry.unit,completedAt:at,startedAt:null,setKind:entry.setKind,dropStages:entry.dropStages,supersetGroupId:groupId,effort:entry.effort,notes:'',isDemo:false,timestampSource:'grouped'});
 return [make(first),make(second)];
}
/** A stored timestamp is not necessarily an observed time. Only individually tapped sets are timed. */
export function showsMeasuredTiming(set:WorkoutSet):boolean {return set.timestampSource===undefined||set.timestampSource==='automatic';}
export function canEstimateRest(previous:WorkoutSet|undefined,current:WorkoutSet):boolean {
 return !!previous&&showsMeasuredTiming(previous)&&showsMeasuredTiming(current)&&!previous.supersetGroupId&&!current.supersetGroupId;
}
