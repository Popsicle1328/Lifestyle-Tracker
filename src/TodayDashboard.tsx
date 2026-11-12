import {format,parseISO,subDays} from 'date-fns';
import {useLiveQuery} from 'dexie-react-hooks';
import {CalendarDays,Clock3,Droplets,Dumbbell,Flame,GraduationCap,Moon,Target,TrendingUp,Utensils} from 'lucide-react';
import {db,getNutritionPrefs} from './db';
import {foodTotals} from './nutritionLogic';
import {DEFAULT_NUTRITION_PREFS,type EnrichedSleep,type NutritionPrefs,type Preferences} from './models';
import {minutesLabel} from './logic';
import {activeMinutes,totalSessionKcal} from './workoutLogic';

type Props={sleep:EnrichedSleep[];sleepPrefs:Preferences;onOpen:(tab:'sleep'|'nutrition'|'workout')=>void};
const key=(d:Date)=>format(d,'yyyy-MM-dd');
const fmt=(d:string)=>format(parseISO(d),'MMM d');
const average=(arr:number[])=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
const pretty=(n:number|null,digits=0)=>n===null?'--':n.toFixed(digits);
export default function TodayDashboard({sleep,sleepPrefs,onOpen}:Props){
 const workouts=useLiveQuery(()=>db.workoutSessions.toArray(),[],[])??[];
 const cardios=useLiveQuery(()=>db.cardioIntervals.toArray(),[],[])??[];
 const foods=useLiveQuery(()=>db.foodLogs.toArray(),[],[])??[];
 const waters=useLiveQuery(()=>db.waterLogs.toArray(),[],[])??[];
 const goals=useLiveQuery(()=>getNutritionPrefs(),[],DEFAULT_NUTRITION_PREFS)??DEFAULT_NUTRITION_PREFS;
 const today=key(new Date()),lastSleep=[...sleep].reverse().find(s=>s.wakeup);
 const consumed=foodTotals(foods.filter(f=>f.date===today));
 const drunk=waters.filter(w=>w.date===today).reduce((sum,w)=>sum+w.amountMl,0);
 const todayWorkouts=workouts.filter(w=>w.date===today&&w.status==='completed');
 const trained=todayWorkouts.reduce((sum,w)=>sum+activeMinutes(w),0);
 const burned=todayWorkouts.map(w=>totalSessionKcal(w,cardios.filter(c=>c.sessionId===w.id))).reduce<number|null>((sum,n)=>n===null?sum:(sum??0)+n,null);
 const proteinGoal=goals.proteinTarget,waterGoal=goals.waterTargetMl;
 const windows=[3,7,30].map(count=>{
  const first=key(subDays(new Date(),count-1));const inRange=(d:string)=>d>=first&&d<=today;
  const recordedSleep=sleep.filter(s=>inRange(s.sleepDate)&&s.estimatedMinutes!==null).map(s=>s.estimatedMinutes!);
  const foodDays=[...new Set(foods.filter(f=>inRange(f.date)).map(f=>f.date))];
  const waterDays=[...new Set(waters.filter(w=>inRange(w.date)).map(w=>w.date))];
  const trainDays=[...new Set(workouts.filter(w=>inRange(w.date)&&w.status==='completed').map(w=>w.date))];
  return {days:count,sleep:average(recordedSleep),sleepCount:recordedSleep.length,protein:average(foodDays.map(d=>foodTotals(foods.filter(f=>f.date===d)).protein)),proteinCount:foodDays.length,water:average(waterDays.map(d=>waters.filter(w=>w.date===d).reduce((sum,w)=>sum+w.amountMl,0))),waterCount:waterDays.length,training:trainDays.length};
 });
 const trackedSleep=lastSleep?.estimatedMinutes??null;
 const cards=[
  {name:'Latest sleep estimate',value:minutesLabel(trackedSleep),detail:lastSleep?`Night of ${fmt(lastSleep.sleepDate)} (not measured sleep)`:'No sleep record',icon:<Moon size={21}/>,className:'sleep',tab:'sleep' as const},
  {name:'Protein today',value:`${Math.round(consumed.protein)} g`,detail:proteinGoal===null?'Protein target not set':`${Math.max(0,Math.round(proteinGoal-consumed.protein))} g to target (${proteinGoal} g)`,icon:<Utensils size={21}/>,className:'protein',tab:'nutrition' as const},
  {name:'Water today',value:`${(drunk/1000).toFixed(2)} L`,detail:waterGoal===null?'Water target not set':`${Math.max(0,waterGoal-drunk)} mL to provisional target`,icon:<Droplets size={21}/>,className:'water',tab:'nutrition' as const},
  {name:'Workout today',value:trained?`${trained} min`:'No session',detail:`${todayWorkouts.length} completed session${todayWorkouts.length===1?'':'s'}`,icon:<Dumbbell size={21}/>,className:'workout',tab:'workout' as const},
  {name:'Workout energy',value:burned===null?'Not measured':`~${burned} kcal`,detail:goals.calorieBurnTarget===null||goals.calorieBurnTarget===undefined?'Daily goal not set':`Optional goal: ${goals.calorieBurnTarget} kcal`,icon:<Flame size={21}/>,className:'calories',tab:'workout' as const},
  {name:'Training target',value:goals.workoutDaysPerWeek==null?'Not set':`${goals.workoutDaysPerWeek} days/week`,detail:'Configure in Settings',icon:<Target size={21}/>,className:'target',tab:'workout' as const},
 ];
 const hadSample=sleep.some(s=>s.isDemo)||workouts.some(w=>w.isDemo);
 return <div className="today-view">
  <div className="page-heading"><div><div className="eyebrow">YOUR DAILY OVERVIEW</div><h1>Today, in one place<span className="heading-spark">*</span></h1><p>{format(new Date(),'EEEE, MMM d')} - Sleep, nourishment, training and your future routines.</p></div><span className="workout-chip"><TrendingUp size={16}/> Local-first</span></div>
  {hadSample&&<div className="demo-banner">Some sleep or workout records are DEMO examples. Remove them in Settings before relying on your statistics.</div>}
  <div className="today-hero"><div><span>BUILD YOUR OWN RHYTHM</span><h2>Every day counts.<br/><em>See the whole picture.</em></h2><p>Your records remain on this device. Open a tracker to see the details or log something new.</p></div><div className="today-hero-art" aria-hidden="true"><div/><div/><div/></div></div>
  <div className="today-card-grid">{cards.map(c=><button key={c.name} className={`today-metric ${c.className}`} onClick={()=>onOpen(c.tab)}><span className="today-metric-icon">{c.icon}</span><span className="today-metric-title">{c.name}</span><strong>{c.value}</strong><small>{c.detail}</small></button>)}</div>
  <section className="panel today-trends"><div className="section-head"><div><div className="eyebrow">ROLLING WINDOWS</div><h3>3 / 7 / 30-day averages</h3><p>Sleep uses completed nights; nutrition averages use days with logs, not assumed zeros. Training days are distinct calendar days.</p></div><CalendarDays size={20}/></div>
   <div className="today-table-wrap"><table className="today-table"><thead><tr><th>Metric</th>{windows.map(w=><th key={w.days}>Last {w.days} days</th>)}</tr></thead><tbody>
    <tr><th><Moon size={15}/> Adjusted sleep</th>{windows.map(w=><td key={w.days}><strong>{w.sleep===null?'--':minutesLabel(Math.round(w.sleep))}</strong><small>{w.sleepCount}/{w.days} nights</small></td>)}</tr>
    <tr><th><Utensils size={15}/> Protein</th>{windows.map(w=><td key={w.days}><strong>{pretty(w.protein,1)} g/day</strong><small>{w.proteinCount}/{w.days} logged days</small></td>)}</tr>
    <tr><th><Droplets size={15}/> Water</th>{windows.map(w=><td key={w.days}><strong>{w.water===null?'--':(w.water/1000).toFixed(2)+' L/day'}</strong><small>{w.waterCount}/{w.days} logged days</small></td>)}</tr>
    <tr><th><Dumbbell size={15}/> Workout days</th>{windows.map(w=><td key={w.days}><strong>{w.training} / {w.days} days</strong><small>{Math.round(w.training/w.days*100)}% of days</small></td>)}</tr>
   </tbody></table></div>
  </section>
  <div className="today-future"><div><GraduationCap size={23}/><strong>Study & 24-hour time tracking</strong><p>Planned: study sessions, personal time blocks and an eventual whole-day activity breakdown. No events are auto-inferred.</p></div><span>PLANNED</span></div>
  <p className="micro-text">Targets are personal settings, not medical advice. Current protein target: {proteinGoal===null?'not set':proteinGoal+' g/day'} (user-chosen at 60 kg when configured). Sleep ideal: {sleepPrefs.idealMinMinutes/60}-{sleepPrefs.idealMaxMinutes/60} hours adjusted estimate.</p>
 </div>;
}
