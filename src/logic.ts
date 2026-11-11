import {addDays,format,parseISO,subDays} from 'date-fns';
import type {SleepRecord,Preferences,EnrichedSleep} from './models';
export const dateKey=(d:Date)=>format(d,'yyyy-MM-dd');
export const dateForNight=(instant:Date, cutoffHour:number)=>dateKey(instant.getHours()<cutoffHour?subDays(instant,1):instant);
export const toLocalInput=(date:Date)=>format(date,"yyyy-MM-dd'T'HH:mm");
export const timeOf=(iso:string)=>format(parseISO(iso),'h:mm a');
export const minsBetween=(a:string,b:string)=>Math.round((new Date(b).getTime()-new Date(a).getTime())/60000);
export const minutesLabel=(m:number|null)=>m===null?'—':`${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`;
export const shortDuration=(m:number|null)=>m===null?'—':`${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`;
export const enrich=(r:SleepRecord,p:Preferences):EnrichedSleep=>{
 const bedMinutes=r.wakeup?minsBetween(r.bedtime,r.wakeup):null;
 const estimatedMinutes=bedMinutes===null?null:Math.max(0,bedMinutes-p.latencyMinutes);
 const bedDt=new Date(r.bedtime); const wakeDt=r.wakeup?new Date(r.wakeup):null;
 const anchor=new Date(`${r.sleepDate}T00:00:00`);
 const bedHour=(bedDt.getTime()-anchor.getTime())/3600000;
 const wakeHour=wakeDt?(wakeDt.getTime()-anchor.getTime())/3600000:null;
 const status=estimatedMinutes===null?'incomplete':estimatedMinutes<p.idealMinMinutes?'below':estimatedMinutes>p.idealMaxMinutes?'above':'ideal';
 return {...r,bedMinutes,estimatedMinutes,bedHour,wakeHour,status};
};
export const gradient=(min:number|null,p:Preferences)=>{
 if(min===null)return '#b0afc1';
 const knots:[[number,string],...Array<[number,string]>]=[[0,'#ef6067'],[p.redLowMinutes,'#ef6067'],[p.yellowLowMinutes,'#f1b94b'],[p.idealMinMinutes,'#40b995'],[p.idealMaxMinutes,'#40b995'],[p.yellowHighMinutes,'#f1b94b'],[p.redHighMinutes,'#ef6067'],[2000,'#ef6067']];
 const toRGB=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 for(let i=1;i<knots.length;i++){if(min<=knots[i][0]){const [a,ca]=knots[i-1];const [b,cb]=knots[i];const t=b===a?1:Math.max(0,Math.min(1,(min-a)/(b-a)));const A=toRGB(ca),B=toRGB(cb);return '#'+A.map((n,j)=>Math.round(n+(B[j]-n)*t).toString(16).padStart(2,'0')).join('');}}
 return '#ef6067';
};
export const lastNDates=(endDate:string,days:number)=>Array.from({length:days},(_,i)=>dateKey(addDays(parseISO(endDate),i-days+1)));
export const localDateTimeToIso=(s:string)=>{const dt=new Date(s);if(!Number.isFinite(dt.getTime()))throw Error('Invalid date/time');return dt.toISOString();};
export const checkInterval=(bed:string,wake:string)=>{const duration=minsBetween(bed,wake);if(duration<=0)throw Error('Wake-up must be after bedtime.');if(duration>24*60)throw Error('A sleep record cannot exceed 24 hours.');return duration;};
