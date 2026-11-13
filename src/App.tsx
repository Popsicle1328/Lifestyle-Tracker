import {useEffect,useMemo,useRef,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {format,parseISO,subDays,addDays} from 'date-fns';
import {Area,AreaChart,CartesianGrid,ComposedChart,Line,ReferenceLine,ResponsiveContainer,Tooltip,XAxis,YAxis,Cell,Bar,BarChart,Scatter} from 'recharts';
import {Activity,ArrowDownToLine,ArrowLeft,ArrowRight,BedDouble,CalendarDays,Check,ChevronDown,Clock3,CloudOff,Coffee,Download,Dumbbell,Flame,Footprints,Heart,Home,Lock,Menu,Minus,Moon,MoreHorizontal,Plus,RotateCcw,Save,Settings2,ShieldCheck,SlidersHorizontal,Sunrise,Trash2,TrendingUp,Upload,Utensils,Weight,X,ChartNoAxesCombined,Info,FileSpreadsheet,GraduationCap} from 'lucide-react';
import {db,downloadFile,exportCsv,exportWorkoutCsv,exportNutritionCsv,getPrefs,makeBackup,restoreBackup,savePrefs,upsertSleep,initializeCatalogAndDemo,removeDemo,addDemoOnceMore} from './db';
import TodayDashboard from './TodayDashboard';
import NutritionTracker from './Nutrition';
import GoalsSettings from './GoalsSettings';
import {analyzeSleepFluctuations,median} from './sleepAnalysis';
import WorkoutTracker from './Workout';
import {activeMinutes} from './workoutLogic';
import {dateForNight,dateKey,enrich,gradient,lastNDates,localDateTimeToIso,minutesLabel,shortDuration,timeOf,toLocalInput} from './logic';
import {DEFAULT_PREFS,type EnrichedSleep,type Preferences,type SleepRecord} from './models';

type Tab='overview'|'sleep'|'settings'|'nutrition'|'workout'|'study';
const today=()=>new Date();
const fmtDate=(d:string,pattern='MMM d')=>format(parseISO(d),pattern);
function Logo(){return <div className="logo"><div className="logo-mark"><Moon size={19} fill="currentColor" strokeWidth={1.6}/><span>✦</span></div><strong>daymark<span>.</span></strong></div>}
function Pill({children,tone='neutral'}:{children:React.ReactNode;tone?:'neutral'|'green'|'orange'|'red'|'purple'}){return <span className={'pill '+tone}>{children}</span>}
function Button({children,onClick,kind='primary',disabled=false,className=''}:{children:React.ReactNode;onClick:()=>void;kind?:'primary'|'soft'|'outline'|'danger';disabled?:boolean;className?:string}){return <button className={'btn '+kind+' '+className} disabled={disabled} onClick={onClick}>{children}</button>}
function Stat({icon,label,value,sub,tone}:{icon:React.ReactNode;label:string;value:string;sub:string;tone:string}){return <div className="stat"><div className="stat-top"><span className={'stat-icon '+tone}>{icon}</span><span className="stat-label">{label}</span></div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div>}
const moduleList:[Tab,string,React.ReactNode,string][]=[['sleep','Sleep',<Moon size={19}/>,'Active'],['workout','Workout',<Dumbbell size={19}/>,'Active'],['nutrition','Nutrition & water',<Utensils size={19}/>,'Active'],['study','Study (planned)',<Coffee size={19}/>,'Coming soon']];
function ChartTooltip({active,payload,label,prefs}:{active?:boolean;payload?:Array<{payload?:any}>;label?:string;prefs:Preferences}){
 if(!active||!payload?.length)return null;
 const d=payload.find(entry=>entry.payload?.date)?.payload;
 if(!d||!d.complete)return <div className="tooltip"><strong>{label}</strong><p>No complete sleep record</p></div>;
 return <div className="tooltip" role="status"><strong>{fmtDate(d.date,'EEE, MMM d')}</strong>
  <p>Went to bed: <b>{d.bedTimeLabel}</b></p><p>Woke up: <b>{d.wakeTimeLabel}</b></p>
  <p>Time in bed: <b>{minutesLabel(d.bedMinutes)}</b></p><p>Adjusted: <b style={{color:d.colour}}>{minutesLabel(d.estimatedMinutes)}</b></p>
  <small>Sleep estimate = time in bed minus {prefs.latencyMinutes} min; not measured actual sleep.</small>
 </div>;
}
function Graph({records,prefs,mode}:{records:EnrichedSleep[];prefs:Preferences;mode:'duration'|'timing'}){
 const [endOffset,setEndOffset]=useState(0); const [days,setDays]=useState(14);
 const endDate=dateKey(subDays(today(),endOffset));
 const data=useMemo(()=>lastNDates(endDate,days).map(date=>{const r=records.find(x=>x.sleepDate===date);return {date,label:fmtDate(date,'MMM d'),complete:!!r?.wakeup,bedMinutes:r?.bedMinutes??null,estimatedMinutes:r?.estimatedMinutes??null,bedTimeLabel:r?timeOf(r.bedtime):'',wakeTimeLabel:r?.wakeup?timeOf(r.wakeup):'',colour:gradient(r?.estimatedMinutes??null,prefs),bedHour:r?.wakeup?r.bedHour:null,wakeHour:r?.wakeup?r.wakeHour:null};}),[endDate,days,records,prefs]);
 const completed=data.filter(d=>d.complete);
 const tickHours=(v:number)=>{const hour=((Math.round(v)%24)+24)%24;return `${hour.toString().padStart(2,'0')}:00`};
 const durationMax=Math.max(12,Math.ceil(Math.max(...completed.map(d=>(d.bedMinutes??0)/60),10)+1));
 const plotted=data.map((d,i)=>({...d,range:d.bedHour!==null&&d.wakeHour!==null?[d.bedHour,d.wakeHour]:null,...Object.fromEntries(Array.from({length:data.length-1},(_,k)=>['seg'+k,(i===k||i===k+1)?d.estimatedMinutes:null]))}));
 const [timingMin,timingMax]=[Math.min(18,...completed.map(d=>d.bedHour??18)),Math.max(40,...completed.map(d=>d.wakeHour??40))];
 return <div className="graph-card">
  <div className="section-head"><div><div className="eyebrow">{mode==='duration'?'SLEEP DURATION':'SLEEP RHYTHM'}</div><h3>{mode==='duration'?'How long did you rest?':'When are you sleeping?'}</h3><p>{mode==='duration'?'Your actual time in bed vs. your adjusted sleep estimate.':'Bedtime and wake-up plotted across each night. Shaded space = time in bed.'}</p></div><div className="chart-range"><button aria-label="Earlier nights" onClick={()=>setEndOffset(v=>v+days)}><ArrowLeft size={17}/></button><span>{fmtDate(data[0].date)} – {fmtDate(data[data.length-1].date)}</span><button aria-label="Later nights" disabled={!endOffset} onClick={()=>setEndOffset(v=>Math.max(0,v-days))}><ArrowRight size={17}/></button></div></div>
  <div className="graph-options"><div className="legend"><span><i style={{background:mode==='duration'?'#8178d3':'#8178d3'}}/> {mode==='duration'?'Time in bed':'Bedtime'}</span><span><i style={{background:mode==='duration'?'linear-gradient(90deg,#ec616c,#eab64a,#3bb894)':'#e7a56b'}}/>{mode==='duration'?'Adjusted estimate':'Wake-up'}</span></div><select aria-label="Chart range" value={days} onChange={e=>{setDays(Number(e.target.value));setEndOffset(0)}}><option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></div>
  <div className="chart-overflow"><div className="chart-inner" style={{minWidth:days>14?Math.max(680,days*43):'100%',height:285}}>
  <ResponsiveContainer width="100%" height="100%">{mode==='duration'?<ComposedChart data={plotted} margin={{top:18,right:14,bottom:0,left:-12}}><CartesianGrid stroke="#e9eaf2" vertical={false} strokeDasharray="3 4"/><XAxis dataKey="label" interval={days>14?2:1} tickLine={false} axisLine={false} tick={{fill:'#9596a9',fontSize:11}} dy={10}/><YAxis domain={[0,durationMax*60]} tickFormatter={v=>`${Math.round(v/60)}h`} ticks={Array.from({length:Math.floor(durationMax/2)+1},(_,i)=>i*120)} tickLine={false} axisLine={false} tick={{fill:'#9596a9',fontSize:11}}/><Tooltip content={<ChartTooltip prefs={prefs}/>} /><ReferenceLine y={prefs.idealMinMinutes} stroke="#55b99d" strokeDasharray="5 5" strokeOpacity={.5}/><ReferenceLine y={prefs.idealMaxMinutes} stroke="#55b99d" strokeDasharray="5 5" strokeOpacity={.5}/><Line type="monotone" dataKey="bedMinutes" name="In bed" stroke="#8677dc" strokeWidth={2.7} dot={{r:3,fill:'#8677dc',stroke:'#fff',strokeWidth:1.5}} connectNulls={false} activeDot={{r:6}}/>{data.slice(0,-1).map((d,i)=>{const nxt=data[i+1];return d.complete&&nxt.complete?<Line key={i} type="linear" dataKey={'seg'+i} name="Adjusted" stroke={gradient(Math.round(((d.estimatedMinutes??0)+(nxt.estimatedMinutes??0))/2),prefs)} strokeWidth={2.8} dot={false} connectNulls={false} isAnimationActive={false} legendType="none" tooltipType="none"/>:null})}<Scatter data={completed.map(d=>({...d,estimatedMinutes:d.estimatedMinutes}))} dataKey="estimatedMinutes" shape={(props:any)=>{const {cx,cy,payload}=props;return <circle cx={cx} cy={cy} r={5} fill={payload.colour} stroke="white" strokeWidth={1.8}/>}} /></ComposedChart>:<ComposedChart data={plotted} margin={{top:18,right:14,bottom:0,left:-12}}><CartesianGrid stroke="#e9eaf2" vertical={false} strokeDasharray="3 4"/><XAxis dataKey="label" interval={days>14?2:1} tickLine={false} axisLine={false} tick={{fill:'#9596a9',fontSize:11}} dy={10}/><YAxis domain={[Math.floor(timingMin)-1,Math.ceil(timingMax)+1]} tickCount={8} tickFormatter={tickHours} tickLine={false} axisLine={false} tick={{fill:'#9596a9',fontSize:11}}/><Tooltip content={<ChartTooltip prefs={prefs}/>} /><Area type="monotone" dataKey="range" stroke="none" fill="#c4bbf4" fillOpacity={0.24} connectNulls={false} isAnimationActive={false}/><Line type="monotone" dataKey="wakeHour" name="Wake-up" stroke="#e6a26b" strokeWidth={2.5} dot={{r:3,fill:'#e6a26b'}} connectNulls={false}/><Line type="monotone" dataKey="bedHour" name="Bedtime" stroke="#8178d3" strokeWidth={2.5} dot={{r:3,fill:'#8178d3'}} connectNulls={false}/></ComposedChart>}</ResponsiveContainer>
  </div></div><div className="chart-foot"><span><Info size={13}/> {mode==='duration'?'Point colour reflects the adjusted duration.':'Clock values run beyond midnight to keep overnight times continuous.'}</span><span>Swipe horizontally for wider ranges</span></div>
  {mode==='duration'&&<div className="scale"><div className="scale-bar"/><div className="scale-legend"><span>Too little</span><span>Ideal {prefs.idealMinMinutes/60}–{prefs.idealMaxMinutes/60}h</span><span>Too much</span></div></div>}
 </div>;
}
function makeRecord(sleepDate:string,bedtime:string,wakeup:string|null,sourceBed:'now'|'manual',sourceWake:'now'|'manual'|null,existing?:SleepRecord):SleepRecord{return {id:existing?.id??crypto.randomUUID(),sleepDate,bedtime,wakeup,createdAt:existing?.createdAt??new Date().toISOString(),updatedAt:new Date().toISOString(),sourceBed,sourceWake,note:existing?.note};}
function EntryModal({close,prefs,existing}:{close:()=>void;prefs:Preferences;existing?:SleepRecord}){
 const [night,setNight]=useState(existing?.sleepDate??dateForNight(new Date(),prefs.dayCutoffHour));
 const initialBed=existing?new Date(existing.bedtime):new Date();
 const initialWake=existing?.wakeup?new Date(existing.wakeup):null;
 const [bedTime,setBedTime]=useState(format(initialBed,'HH:mm'));
 const [wakeTime,setWakeTime]=useState(initialWake?format(initialWake,'HH:mm'):'07:00');
 const [hasWake,setHasWake]=useState(!!existing?.wakeup||!existing);
 const [afterMidnight,setAfterMidnight]=useState(!!existing&&dateKey(initialBed)>existing.sleepDate);
 const [note,setNote]=useState(existing?.note??'');const [demo,setDemo]=useState(!!existing?.isDemo);
 const [err,setErr]=useState('');const [busy,setBusy]=useState(false);
 const save=async()=>{try{setBusy(true);setErr('');
  if(!night||!bedTime)throw Error('Choose the sleep date and bedtime.');
  const bedDate=addDays(parseISO(night),afterMidnight?1:0);
  const bedIso=localDateTimeToIso(dateKey(bedDate)+'T'+bedTime);
  const wakeDate=addDays(bedDate,hasWake&&wakeTime<=bedTime?1:0);
  const wakeIso=hasWake&&wakeTime?localDateTimeToIso(dateKey(wakeDate)+'T'+wakeTime):null;
  await upsertSleep({...makeRecord(night,bedIso,wakeIso,'manual',wakeIso?'manual':null,existing),note,isDemo:demo});close();
 }catch(e){setErr(e instanceof Error?e.message:'Unable to save record')}finally{setBusy(false)}};
 return <div className="modal-screen" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">SLEEP JOURNAL</div><h2>{existing?'Edit your night':'Add a sleep record'}</h2></div><button className="icon-button" onClick={close} aria-label="Close"><X size={20}/></button></div>
  <div className="form-grid"><label className="field wide"><span>Sleep date <small>(which night does this belong to?)</small></span><input type="date" value={night} onChange={e=>setNight(e.target.value)}/></label>
  <label className="field"><span>Went to bed at</span><input type="time" value={bedTime} onChange={e=>setBedTime(e.target.value)}/></label>
  <label className="field"><span>Woke up at</span><input type="time" value={wakeTime} disabled={!hasWake} onChange={e=>setWakeTime(e.target.value)}/></label>
  <label className="field wide check-field"><input type="checkbox" checked={afterMidnight} onChange={e=>setAfterMidnight(e.target.checked)}/><span>Bedtime was after midnight (the next calendar day)</span></label>
  <label className="field wide check-field"><input type="checkbox" checked={hasWake} onChange={e=>setHasWake(e.target.checked)}/><span>I know the wake-up time (uncheck to save an incomplete night)</span></label>
  <label className="field wide"><span>Optional note</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. woke several times"/></label>
  {existing?.isDemo&&<label className="field wide check-field"><input type="checkbox" checked={demo} onChange={e=>setDemo(e.target.checked)}/><span>Keep marked as a demo record (uncheck to retain as personal data)</span></label>}
  </div><div className="help-note"><Info size={17}/> One date only: choose the assigned sleep night. Wake-up will automatically be placed on the next calendar day if its clock time is earlier than bedtime. Tick the after-midnight option if you went to bed after 12 AM but the record belongs to the previous night.</div>{err&&<p className="error">{err}</p>}<div className="modal-actions"><Button kind="outline" onClick={close}>Cancel</Button><Button disabled={busy} onClick={save}><Save size={16}/> Save night</Button></div></div></div>;
}

function Settings({prefs,setPrefs,notify}:{prefs:Preferences;setPrefs:(p:Preferences)=>void;notify:(s:string)=>void}){
 const [draft,setDraft]=useState(prefs);const inputRef=useRef<HTMLInputElement>(null);const [err,setErr]=useState('');
 const demoSleep=useLiveQuery(()=>db.sleep.filter(x=>!!x.isDemo).count(),[],0);
 const demoSessions=useLiveQuery(()=>db.workoutSessions.filter(x=>!!x.isDemo).count(),[],0);
 const change=(key:keyof Preferences,n:number)=>setDraft(p=>({...p,[key]:n}));
 const save=async()=>{if(!(draft.redLowMinutes<draft.yellowLowMinutes&&draft.yellowLowMinutes<draft.idealMinMinutes&&draft.idealMinMinutes<draft.idealMaxMinutes&&draft.idealMaxMinutes<draft.yellowHighMinutes&&draft.yellowHighMinutes<draft.redHighMinutes)){setErr('Duration thresholds must increase from red-low through red-high.');return;}if(draft.latencyMinutes<0||draft.latencyMinutes>240||draft.dayCutoffHour<0||draft.dayCutoffHour>23){setErr('Check the adjustment and cutoff hour values.');return;}await savePrefs(draft);setPrefs(draft);setErr('');notify('Sleep preferences saved');};
 const backup=async()=>{const data=await makeBackup();downloadFile(`daymark-backup-${dateKey(new Date())}.json`,new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));notify('Backup downloaded');};
 const restore=async(file:File)=>{try{const data=JSON.parse(await file.text());const n=(data?.sleep?.length??0);if(!window.confirm(`Replace ALL local sleep and workout data with this backup (${n} sleep records)? Export your existing backup first.`))return;const count=await restoreBackup(data);const latest=await getPrefs();setPrefs(latest);setDraft(latest);notify(`Restored ${count.sleep} sleep records and ${count.sessions} workouts`);}catch(e){setErr('Restore failed: '+(e instanceof Error?e.message:'Invalid file'))}};
 return <><div className="page-heading"><div><div className="eyebrow">MAKE IT YOURS</div><h1>Settings & data</h1><p>Your rules, your records, your control.</p></div></div><div className="settings-grid"><div className="panel"><div className="section-head"><div><h3>Sleep preferences</h3><p>Adjust the assumptions used for analysis. Actual records are unchanged.</p></div><SlidersHorizontal size={22} color="#8d86c7"/></div><div className="setting-list">{([['latencyMinutes','Adjustment subtracted from time in bed','min'],['idealMinMinutes','Ideal duration begins','min'],['idealMaxMinutes','Ideal duration ends','min'],['yellowLowMinutes','Short-sleep yellow threshold','min'],['redLowMinutes','Short-sleep red threshold','min'],['yellowHighMinutes','Long-sleep yellow threshold','min'],['redHighMinutes','Long-sleep red threshold','min'],['fluctuationMinutes','Major fluctuation from prior night','min'],['dayCutoffHour','Default sleep-date cutoff (0–23)','hour']] as [keyof Preferences,string,string][]).map(([key,title,unit])=><label className="setting-row" key={key}><span>{title}</span><div><input aria-label={title} type="number" min="0" max={key==='dayCutoffHour'?23:1000} value={draft[key]} onChange={e=>change(key,Number(e.target.value))}/><small>{unit}</small></div></label>)}</div>{err&&<p className="error">{err}</p>}<div className="setting-actions"><Button onClick={save}><Save size={16}/> Save preferences</Button><Button kind="outline" onClick={()=>setDraft(DEFAULT_PREFS)}><RotateCcw size={15}/> Reset form</Button></div></div><div className="right-stack"><div className="panel"><div className="section-head"><div><h3>Data ownership</h3><p>Your database lives on this device, not on GitHub.</p></div><ShieldCheck color="#43b898" size={24}/></div><div className="backup-actions"><Button onClick={backup}><Download size={17}/> Export complete JSON backup</Button><Button kind="outline" onClick={()=>inputRef.current?.click()}><Upload size={17}/> Restore from JSON</Button><Button kind="outline" onClick={()=>void exportCsv()}><FileSpreadsheet size={17}/> Export sleep CSV</Button><Button kind="outline" onClick={()=>void exportWorkoutCsv()}><FileSpreadsheet size={17}/> Export workout + cardio CSV</Button><Button kind="outline" onClick={()=>void exportNutritionCsv()}><FileSpreadsheet size={17}/> Export nutrition + water CSV</Button><input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void restore(f);e.target.value=''}}/></div><div className="help-note"><Info size={17}/> Restoring replaces sleep, workouts, cardio, nutrition, water, targets and exercise library entries. Export a backup first. Android and desktop do not sync automatically.</div></div><div className="panel"><h3>Sample data controls</h3><p style={{fontSize:12,color:'#8890a5',margin:'9px 0'}}>Demo records: {demoSleep} sleep nights · {demoSessions} workouts. Sample data is not your actual fitness history.</p><div className="backup-actions"><Button kind="outline" onClick={()=>void addDemoOnceMore().then(()=>notify('Sample data loaded')).catch(e=>setErr(String(e)))}><Plus size={16}/> Load more sample records (missing dates only)</Button><Button kind="danger" onClick={()=>{if(window.confirm('Remove all DEMO sleep and workout sessions? Personal records will be preserved.'))void removeDemo().then(()=>notify('Demo data removed')).catch(e=>setErr(String(e)))}}><Trash2 size={16}/> Remove sample data</Button></div></div><div className="panel lilac-panel"><h3>Offline by design <CloudOff size={20}/></h3><p>Once installed and cached, logging, charts and saved data can work without internet. Check that your backup is stored somewhere safe beyond this browser.</p></div></div></div></>;
}
function App(){
 const [tab,setTab]=useState<Tab>('overview');
 const [modal,setModal]=useState<null|'new'|SleepRecord>(null);
 const [toast,setToast]=useState('');
 const [showMobileMenu,setShowMobileMenu]=useState(false);
 const [prefs,setPrefs]=useState<Preferences>(DEFAULT_PREFS);
 const [ready,setReady]=useState(false);
 const [theme,setTheme]=useState<'light'|'dark'>(()=>{try{return localStorage.getItem('daymark-theme')==='dark'?'dark':'light'}catch{return 'light'}});
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('daymark-theme',theme)}catch{}},[theme]);
 useEffect(()=>{void initializeCatalogAndDemo().then(()=>getPrefs()).then(p=>{setPrefs(p);setReady(true)}).catch(e=>{console.error('Could not initialise local database:',e);setReady(true)});},[]);
 const raw=useLiveQuery(()=>db.sleep.orderBy('sleepDate').toArray(),[],[])??[];
 const records=useMemo(()=>raw.map(r=>enrich(r,prefs)).sort((a,b)=>a.sleepDate.localeCompare(b.sleepDate)),[raw,prefs]);
 const dateToday=dateKey(new Date());
 const recent=records.filter(r=>r.sleepDate>=dateKey(subDays(new Date(),29))&&r.sleepDate<=dateToday);
 const completeRecent=recent.filter(r=>r.estimatedMinutes!==null);
 const missed=completeRecent.filter(r=>r.status!=='ideal').length;
 const ideal=completeRecent.filter(r=>r.status==='ideal').length;
 const latest=[...records].reverse().find(r=>r.wakeup);
 const pending=records.find(r=>!r.wakeup);
 const seven=records.filter(r=>r.wakeup&&r.sleepDate>=dateKey(subDays(new Date(),6))&&r.sleepDate<=dateToday);
 const sevenMedian=median(seven.map(s=>s.estimatedMinutes!).filter(Number.isFinite));
 const fluctuation=useMemo(()=>analyzeSleepFluctuations(records,prefs).slice(0,7),[records,prefs]);
 const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),4000)};
 const nav=(next:Tab)=>{setTab(next);setShowMobileMenu(false);window.scrollTo({top:0,behavior:'smooth'})};
 const logNow=async(kind:'bed'|'wake')=>{try{
  const now=new Date(),iso=now.toISOString();
  if(kind==='bed'){
   if(pending)throw Error('Finish the previous sleep record before logging another bedtime.');
   await upsertSleep(makeRecord(dateForNight(now,prefs.dayCutoffHour),iso,null,'now',null));notify('Bedtime logged.');
  } else {
   if(!pending)throw Error('No open bedtime. Use manual entry if you forgot to log it.');
   await upsertSleep({...pending,wakeup:iso,sourceWake:'now',updatedAt:iso});notify('Wake-up time recorded.');
  }
 }catch(error){notify(error instanceof Error?error.message:'Could not save the time.')}};
 const deleteRecord=async(r:SleepRecord)=>{if(window.confirm(`Delete sleep record for ${r.sleepDate}?`)){await db.sleep.delete(r.id);notify('Sleep record removed.')}};
 const locked=tab==='study';
 const displayTitle=tab==='overview'?'Today':tab==='sleep'?'Sleep':tab==='workout'?'Workout':tab==='nutrition'?'Nutrition':tab==='settings'?'Settings':'Study';
 return <div className="app-shell">
  <aside className={'sidebar '+(showMobileMenu?'show':'')}><Logo/><div className="sidebar-section-label">YOUR SPACE</div>
   <nav><button className={'nav-item '+(tab==='overview'?'active':'')} onClick={()=>nav('overview')}><Home size={19}/> Today</button>
    <div className="sidebar-section-label inner">TRACKERS</div>{moduleList.map(([id,name,icon])=><button key={id} className={'nav-item '+(tab===id?'active':'')+(id==='study'?' muted':'')} onClick={()=>nav(id)}>{icon}<span>{name}</span>{id==='study'?<Lock size={13} className="lock-icon"/>:<span className="active-indicator"/>}</button>)}</nav>
   <div className="sidebar-bottom"><button className={'nav-item '+(tab==='settings'?'active':'')} onClick={()=>nav('settings')}><Settings2 size={19}/> Settings & backup</button>
    <button className="theme-control" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='light'?<Moon size={17}/>:<Sunrise size={17}/>} {theme==='light'?'Switch to dark mode':'Switch to light mode'}</button>
    <div className="privacy-card"><ShieldCheck size={20}/><div><strong>Private by nature</strong><span>Stored on your device</span></div></div><small>Daymark v0.4 - Sleep / Workout / Nutrition</small>
   </div></aside>
  <main className="main"><header className="topbar"><button aria-label="Toggle navigation" className="hamburger" onClick={()=>setShowMobileMenu(v=>!v)}><Menu size={22}/></button>
   <div className="breadcrumbs">DAYMARK <span>/</span> {displayTitle.toUpperCase()}</div><div className="header-right"><button className="header-theme" aria-label="Toggle dark mode" title="Change theme" onClick={()=>setTheme(t=>t==='light'?'dark':'light')}>{theme==='light'?<Moon size={18}/>:<Sunrise size={18}/>}</button><Pill tone="green"><span className="tiny-dot"/> Local-first</Pill><div className="avatar">D</div></div></header>
   {!ready?<div className="loading">Opening your journal...</div>:<div className="content">
    {tab==='overview'&&<TodayDashboard sleep={records} sleepPrefs={prefs} onOpen={nav}/>}
    {tab==='workout'&&<WorkoutTracker notify={notify}/>}
    {tab==='nutrition'&&<NutritionTracker notify={notify}/>}
    {tab==='sleep'&&<>
     {records.some(r=>r.isDemo)&&<div className="demo-banner"><Info size={16}/> DEMO nights are loaded for testing. They are not your actual sleep records.</div>}
     <div className="page-heading"><div><div className="eyebrow">REST, REFLECT, REPEAT</div><h1>Your sleep journal<span className="heading-spark">*</span></h1><p>Review your patterns, adjust your entries, and separate actual time in bed from the assumed sleep estimate.</p></div><div className="heading-actions"><Pill tone="purple"><CalendarDays size={14}/>{format(new Date(),'EEE, MMM d')}</Pill><Button kind="outline" onClick={()=>setModal('new')}><Plus size={17}/> Add night</Button></div></div>
     <div className="hero"><div className="hero-copy"><div className="hero-kicker">YOUR SLEEP SPACE</div><h2>Make room for<br/><em>better rest.</em></h2><p>Capture bedtime and wake-up with one tap, or edit records manually.</p><div className="hero-actions"><Button onClick={()=>void logNow(pending?'wake':'bed')}>{pending?<Sunrise size={17}/>:<Moon size={17}/>} {pending?"I'm awake now":'Going to bed now'}</Button><Button kind="soft" onClick={()=>setModal(pending??'new')}><Clock3 size={17}/> {pending?'Edit active night':'Manual entry'}</Button></div>{pending&&<div className="pending-note">In bed since {timeOf(pending.bedtime)} - Assigned to {fmtDate(pending.sleepDate)}</div>}</div><div className="hero-art" aria-hidden="true"><div className="orb orb1"/><div className="orb orb2"/><div className="moon-crescent"/><span className="star one">*</span><span className="star two">*</span><div className="art-pill">Rest matters</div></div></div>
     <div className="stat-grid"><Stat tone="purple" icon={<BedDouble size={20}/>} label="Latest time in bed" value={minutesLabel(latest?.bedMinutes??null)} sub={latest?`Night of ${fmtDate(latest.sleepDate)}`:'Awaiting a record'}/><Stat tone="peach" icon={<Moon size={20}/>} label="Adjusted estimate" value={minutesLabel(latest?.estimatedMinutes??null)} sub={`Time in bed minus ${prefs.latencyMinutes} min`}/><Stat tone="mint" icon={<TrendingUp size={20}/>} label="7-day median" value={minutesLabel(sevenMedian===null?null:Math.round(sevenMedian))} sub={`${seven.length} recorded nights - resilient to outliers`}/><Stat tone="coral" icon={<Activity size={20}/>} label="Outside ideal - 30 days" value={String(missed)} sub={`${ideal} ideal / ${completeRecent.length} completed`}/></div>
     <div className="charts-stack"><Graph records={records} prefs={prefs} mode="duration"/><Graph records={records} prefs={prefs} mode="timing"/></div>
     <div className="insights-grid"><div className="panel"><div className="section-head"><div><div className="eyebrow">ROBUST SLEEP ANALYSIS</div><h3>Notable fluctuations</h3><p>A large bedtime or wake-up shift is compared to the previous consecutive night; otherwise duration is compared with the median of up to 14 earlier nights (minimum 5). Threshold: {prefs.fluctuationMinutes} min.</p></div><Activity size={20}/></div>
      {fluctuation.length?fluctuation.map(x=><div className="insight-row" key={x.id}><span className={'insight-icon '+(x.kind==='timing'?'warn':'good')}>{x.kind==='timing'?<Clock3 size={16}/>:<TrendingUp size={16}/>}</span><div><strong>{fmtDate(x.sleepDate)} - {x.title}</strong><small>{x.detail}</small></div><Pill tone={x.kind==='timing'?'orange':x.status==='ideal'?'green':x.status==='below'?'red':'orange'}>{x.kind==='timing'?'Timing':'Duration'}</Pill></div>):<div className="empty-small">More history is needed before a meaningful fluctuation can be identified.</div>}
     </div><div className="panel"><div className="section-head"><div><div className="eyebrow">LAST 30 DAYS</div><h3>Monthly snapshot</h3><p>Completed nights only. Unrecorded days remain separate.</p></div></div><div className="snapshot"><div className="snapshot-big"><strong>{missed}</strong><span>nights outside<br/>ideal range</span></div><div className="snapshot-bars"><div className="snapshot-line"><span>Within ideal</span><b>{ideal}</b></div><div className="mini-bar"><div style={{width:`${completeRecent.length?ideal/completeRecent.length*100:0}%`,background:'#43b99a'}}/></div><div className="snapshot-line"><span>Outside ideal</span><b>{missed}</b></div><div className="mini-bar"><div style={{width:`${completeRecent.length?missed/completeRecent.length*100:0}%`,background:'#e6a36c'}}/></div><div className="snapshot-line"><span>Unrecorded / incomplete</span><b>{30-completeRecent.length}</b></div></div></div></div></div>
     <div className="panel history"><div className="section-head"><div><div className="eyebrow">YOUR LOGBOOK</div><h3>Sleep history</h3><p>Tap Edit to correct the recorded times. Dates assign nights, they do not alter actual timestamps.</p></div><Button kind="outline" onClick={()=>setModal('new')}><Plus size={16}/> Add record</Button></div><div className="table-wrap"><table><thead><tr><th>Night</th><th>Bedtime</th><th>Wake-up</th><th>In bed</th><th>Adjusted</th><th>Status</th><th>Actions</th></tr></thead><tbody>{[...records].reverse().map(r=><tr key={r.id}><td><strong>{fmtDate(r.sleepDate,'MMM d, yyyy')}</strong> {r.isDemo&&<Pill tone="purple">DEMO</Pill>}</td><td>{timeOf(r.bedtime)}</td><td>{r.wakeup?timeOf(r.wakeup):'Open'}</td><td>{minutesLabel(r.bedMinutes)}</td><td>{minutesLabel(r.estimatedMinutes)}</td><td><Pill tone={r.status==='ideal'?'green':r.status==='below'?'red':r.status==='above'?'orange':'purple'}>{r.status}</Pill></td><td><button className="tiny-action" onClick={()=>setModal(r)}>Edit</button><button className="tiny-action delete" aria-label="Delete record" onClick={()=>void deleteRecord(r)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></div>
    </>}
    {locked&&<div className="locked-panel"><GraduationCap size={37}/><h2>Study and 24-hour planner</h2><p>This will become part of your complete daily time tracker. We have not defined its logging rules yet.</p><Button kind="outline" onClick={()=>nav('overview')}><ArrowLeft size={16}/> Back to Today</Button></div>}
    {tab==='settings'&&<><div className="page-heading"><div><div className="eyebrow">PERSONALISE DAYMARK</div><h1>Settings & backup</h1><p>Set your own goals and export data regularly.</p></div><button className="action-outline" onClick={()=>setTheme(t=>t==='light'?'dark':'light')}>{theme==='light'?<Moon size={16}/>:<Sunrise size={16}/>} {theme==='light'?'Dark mode':'Light mode'}</button></div><GoalsSettings notify={notify}/><Settings prefs={prefs} setPrefs={setPrefs} notify={notify}/></>}
   </div>}
   <footer>Your data stays on this device. Back it up regularly.</footer></main>
  <div className="mobile-bottom"><button className={tab==='overview'?'selected':''} onClick={()=>nav('overview')}><Home size={20}/><small>Today</small></button><button className={tab==='sleep'?'selected':''} onClick={()=>nav('sleep')}><Moon size={20}/><small>Sleep</small></button><button className={tab==='workout'?'selected':''} onClick={()=>nav('workout')}><Dumbbell size={20}/><small>Workout</small></button><button className={tab==='nutrition'?'selected':''} onClick={()=>nav('nutrition')}><Utensils size={20}/><small>Nutrition</small></button><button className={tab==='settings'?'selected':''} onClick={()=>nav('settings')}><Settings2 size={20}/><small>Settings</small></button></div>
  {modal&&<EntryModal prefs={prefs} existing={modal==='new'?undefined:modal} close={()=>setModal(null)}/>}
  {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
 </div>;
}
export default App;
