import {useEffect,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {Save,Target,Droplets,Info} from 'lucide-react';
import {getNutritionPrefs,saveNutritionPrefs} from './db';
import {DEFAULT_NUTRITION_PREFS,type NutritionPrefs} from './models';
export default function GoalsSettings({notify}:{notify:(s:string)=>void}){
 const stored=useLiveQuery(()=>getNutritionPrefs(),[],DEFAULT_NUTRITION_PREFS)??DEFAULT_NUTRITION_PREFS;
 const [draft,setDraft]=useState<NutritionPrefs>(stored);
 useEffect(()=>setDraft(stored),[stored]);
 const set=(key:keyof NutritionPrefs,value:string)=>setDraft(prev=>({...prev,[key]:value===''?null:Number(value)}));
 const save=async()=>{
  const values=[draft.proteinTarget,draft.waterTargetMl,draft.bodyWeightKg,draft.workoutDaysPerWeek,draft.calorieBurnTarget,draft.calorieTarget];
  if(values.some(v=>v!==null&&v!==undefined&&(!Number.isFinite(v)||v<0)))return notify('Targets must be nonnegative numbers.');
  if(draft.bodyWeightKg!=null&&draft.bodyWeightKg<=0)return notify('Body weight must be greater than zero.');
  if(draft.workoutDaysPerWeek!=null&&draft.workoutDaysPerWeek>7)return notify('Workout target cannot exceed 7 days per week.');
  await saveNutritionPrefs(draft);notify('Targets saved. Your historical logs are unchanged.');
 };
 const items:{key:keyof NutritionPrefs;label:string;unit:string;tip:string}[]=[
  {key:'bodyWeightKg',label:'Current body weight',unit:'kg',tip:'60 kg is your supplied reference; this is not a weight-tracker module.'},
  {key:'proteinTarget',label:'Daily protein target',unit:'g',tip:'120 g/day, as you specified.'},
  {key:'waterTargetMl',label:'Daily drinking-water target',unit:'mL',tip:'Starting estimate 35 mL/kg x 60 kg = 2100 mL. Edit for your circumstances.'},
  {key:'workoutDaysPerWeek',label:'Workout days per week',unit:'days',tip:'Leave blank until you choose a target.'},
  {key:'calorieBurnTarget',label:'Daily exercise calories target',unit:'kcal',tip:'Leave blank until you choose a target. Exercise kcal are estimates.'}
 ];
 return <section className="panel goals-settings"><div className="section-head"><div><div className="eyebrow">YOUR TARGETS</div><h3>Personal goals</h3><p>Editable targets shared across Today, Nutrition and Workouts. No calorie-intake goal yet.</p></div><Target size={22}/></div>
 <div className="goals-grid">{items.map(it=><label key={it.key} className="workout-input">{it.label}<div className="goal-number"><input type="number" min="0" step="0.1" placeholder="Not set" value={draft[it.key]??''} onChange={e=>set(it.key,e.target.value)}/><span>{it.unit}</span></div><small>{it.tip}</small></label>)}</div>
 <div className="session-buttons"><button className="action-primary" onClick={()=>void save()}><Save size={16}/> Save goals</button></div>
 <p className="micro-text"><Droplets size={15}/> Creatine does not, by itself, establish a mandatory additional water allowance. Adequate fluid varies with individual physiology, weather, exercise and sweat loss. Avoid forcing excess water just to meet an app number.</p>
 <p className="micro-text"><Info size={15}/> Changing current body weight does not recalculate an earlier workout's stored weight or its calorie estimate.</p>
 </section>;
}
