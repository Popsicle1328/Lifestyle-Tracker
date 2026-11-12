import {differenceInCalendarDays,parseISO} from 'date-fns';
import type {EnrichedSleep,Preferences} from './models';

export type SleepInsight = {
 id:string; sleepDate:string; kind:'timing'|'duration'; title:string; detail:string;
 minutes:number; direction:'earlier'|'later'|'higher'|'lower'; status:EnrichedSleep['status'];
};
export function median(values:number[]):number|null {
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 const middle=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}
// Signed shortest clock displacement, handling 23:55 -> 00:05 as +10 min.
export function clockShiftMinutes(older:string,newer:string):number {
 const a=new Date(older),b=new Date(newer);
 const am=a.getHours()*60+a.getMinutes(),bm=b.getHours()*60+b.getMinutes();
 return ((bm-am+2160)%1440)-720;
}
export function analyzeSleepFluctuations(records:EnrichedSleep[],prefs:Preferences):SleepInsight[] {
 const ordered=records.filter((r)=>r.wakeup&&r.estimatedMinutes!==null)
  .sort((a,b)=>a.sleepDate.localeCompare(b.sleepDate));
 return ordered.flatMap((r,i):SleepInsight[]=>{
  if(i===0)return [];
  const previous=ordered[i-1];
  const consecutive=differenceInCalendarDays(parseISO(r.sleepDate),parseISO(previous.sleepDate))===1;
  if(consecutive&&previous.wakeup&&r.wakeup){
   const bed=clockShiftMinutes(previous.bedtime,r.bedtime);
   const wake=clockShiftMinutes(previous.wakeup,r.wakeup);
   if(Math.abs(bed)>=prefs.fluctuationMinutes||Math.abs(wake)>=prefs.fluctuationMinutes){
    const phrases:string[]=[];
    if(Math.abs(bed)>=prefs.fluctuationMinutes)phrases.push(`bedtime ${Math.abs(bed)} min ${bed<0?'earlier':'later'}`);
    if(Math.abs(wake)>=prefs.fluctuationMinutes)phrases.push(`wake-up ${Math.abs(wake)} min ${wake<0?'earlier':'later'}`);
    return [{id:r.id,sleepDate:r.sleepDate,kind:'timing',title:'Sleep schedule shifted',detail:`Compared with the immediately preceding night: ${phrases.join('; ')}.`,minutes:Math.max(Math.abs(bed),Math.abs(wake)),direction:bed<0?'earlier':'later',status:r.status}];
   }
  }
  // Robust baseline excludes today's record and requires 5 earlier records.
  const recent=ordered.slice(Math.max(0,i-14),i).map(x=>x.estimatedMinutes!).filter(Number.isFinite);
  const baseline=median(recent);
  if(recent.length<5||baseline===null)return [];
  const diff=r.estimatedMinutes!-baseline;
  if(Math.abs(diff)<prefs.fluctuationMinutes)return [];
  return [{id:r.id,sleepDate:r.sleepDate,kind:'duration',title:diff<0?'Below usual sleep duration':'Above usual sleep duration',detail:`${Math.abs(Math.round(diff))} min ${diff<0?'below':'above'} your prior ${recent.length}-night median (${Math.floor(baseline/60)}h ${String(Math.round(baseline%60)).padStart(2,'0')}m).`,minutes:Math.abs(Math.round(diff)),direction:diff<0?'lower':'higher',status:r.status}];
 }).reverse();
}
