import {useMemo,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {format,parseISO,subDays} from 'date-fns';
import {Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {Check,ChevronDown,Droplets,Edit3,Flame,Info,Plus,Save,Trash2,Utensils} from 'lucide-react';
import {db,getNutritionPrefs} from './db';
import {foodTotals} from './nutritionLogic';
import type {FoodDefinition,FoodLog,FoodSnapshot,WaterLog} from './models';

const dayKey=()=>format(new Date(),'yyyy-MM-dd');
const displayDate=(value:string)=>format(parseISO(value),'MMM d');
const n=(s:string)=>Number(s);
const round=(value:number,digits=1)=>Number(value.toFixed(digits));
export default function NutritionTracker({notify}:{notify:(message:string)=>void}) {
 const [selectedDay,setSelectedDay]=useState(dayKey());
 const [showEditor,setShowEditor]=useState(false);
 const [editId,setEditId]=useState<string|null>(null);
 const [foodCategoriesText,setFoodCategoriesText]=useState('');const [foodFilter,setFoodFilter]=useState('all');
 const [foodName,setFoodName]=useState('');const [portionAmount,setPortionAmount]=useState('1');const [portionUnit,setPortionUnit]=useState('serving');
 const [calories,setCalories]=useState('');const [protein,setProtein]=useState('');const [carbs,setCarbs]=useState('');const [fat,setFat]=useState('');
 const [foodId,setFoodId]=useState('');const [portions,setPortions]=useState('1');const [note,setNote]=useState('');
 const [waterAmount,setWaterAmount]=useState('250');
 const [editLogId,setEditLogId]=useState<string|null>(null);
 const foods=useLiveQuery(()=>db.foods.orderBy('name').toArray(),[],[])??[];
 const logs=useLiveQuery(()=>db.foodLogs.orderBy('at').reverse().toArray(),[],[])??[];
 const waters=useLiveQuery(()=>db.waterLogs.orderBy('at').reverse().toArray(),[],[])??[];
 const goals=useLiveQuery(()=>getNutritionPrefs(),[],undefined);
 const dayLogs=useMemo(()=>logs.filter(l=>l.date===selectedDay).sort((a,b)=>a.at.localeCompare(b.at)),[logs,selectedDay]);
 const dayWaters=waters.filter(w=>w.date===selectedDay);
 const totals=foodTotals(dayLogs);const totalWater=dayWaters.reduce((a,w)=>a+w.amountMl,0);
 const series=Array.from({length:14},(_,i)=>{const date=format(subDays(new Date(),13-i),'yyyy-MM-dd');return {date,label:displayDate(date),protein:round(foodTotals(logs.filter(l=>l.date===date)).protein),water:round(waters.filter(w=>w.date===date).reduce((a,w)=>a+w.amountMl,0)/1000,2)};});
 const available=foods.filter(f=>!f.isArchived);
 const categoryNames=[...new Set(foods.flatMap(f=>f.categories??[]))].sort((a,b)=>a.localeCompare(b));
 const visibleAvailable=available.filter(f=>foodFilter==='all'||(f.categories??[]).includes(foodFilter));
 const active=visibleAvailable.find(f=>f.id===foodId)||visibleAvailable[0];
 const normaliseCategories=(text:string)=>[...new Map(text.split(',').map(c=>c.trim()).filter(Boolean).map(c=>[c.toLocaleLowerCase(),c])).values()].slice(0,15);
 const toggleCategory=(category:string)=>{const values=normaliseCategories(foodCategoriesText);setFoodCategoriesText(values.some(x=>x.toLowerCase()===category.toLowerCase())?values.filter(x=>x.toLowerCase()!==category.toLowerCase()).join(', '):[...values,category].join(', '));};
 const snapshot=(f:FoodDefinition):FoodSnapshot=>({name:f.name,portionAmount:f.portionAmount,portionUnit:f.portionUnit,calories:f.calories,protein:f.protein,carbs:f.carbs,fat:f.fat,categories:f.categories??[]});
 const clearForm=()=>{setFoodName('');setPortionAmount('1');setPortionUnit('serving');setCalories('');setProtein('');setCarbs('');setFat('');setFoodCategoriesText('');setEditId(null);setShowEditor(false)};
 const editFood=(f:FoodDefinition)=>{setFoodName(f.name);setPortionAmount(String(f.portionAmount));setPortionUnit(f.portionUnit);setCalories(String(f.calories));setProtein(String(f.protein));setCarbs(String(f.carbs));setFat(String(f.fat));setFoodCategoriesText((f.categories??[]).join(', '));setEditId(f.id);setShowEditor(true)};
 async function saveFood(){
  const amount=n(portionAmount),energy=n(calories),p=n(protein),c=n(carbs),f=n(fat);
  if(!foodName.trim()||!portionUnit.trim()||!(amount>0)||[energy,p,c,f].some(v=>!Number.isFinite(v)||v<0)||[calories,protein,carbs,fat].some(s=>s.trim()===''))return notify('Enter the food name, serving size and nonnegative nutrition values.');
  if(energy>10000||p>1000||c>1000||f>1000)return notify('Please check the nutrition values per serving.');
  const now=new Date().toISOString();const old=editId?await db.foods.get(editId):undefined;
  const next:FoodDefinition={id:old?.id??crypto.randomUUID(),name:foodName.trim(),portionAmount:amount,portionUnit:portionUnit.trim(),calories:energy,protein:p,carbs:c,fat:f,createdAt:old?.createdAt??now,updatedAt:now,isArchived:false,categories:normaliseCategories(foodCategoriesText)};
  await db.foods.put(next);setFoodFilter('all');setFoodId(next.id);clearForm();notify(old?'Food updated. Past food logs keep their original values.':'Food saved to your personal library.');
 }
 async function addFoodLog(){if(!active)return notify('Create a food in the library first.');const count=n(portions);if(!Number.isFinite(count)||count<=0||count>1000)return notify('Enter a valid number of portions.');const now=new Date().toISOString();
  const old=editLogId?await db.foodLogs.get(editLogId):undefined;
  await db.foodLogs.put({id:old?.id??crypto.randomUUID(),date:selectedDay,foodId:active.id,portions:count,foodSnapshot:old&&old.foodId===active.id?old.foodSnapshot:snapshot(active),at:old?.at??now,note});setEditLogId(null);setNote('');setPortions('1');notify(old?'Food entry updated':'Food logged');
 }
 async function addWater(amount:number){if(!Number.isFinite(amount)||amount<=0||amount>10000)return notify('Enter a valid water amount in mL.');const now=new Date().toISOString();await db.waterLogs.add({id:crypto.randomUUID(),date:selectedDay,amountMl:amount,at:now});notify(`${amount} mL water recorded`)}
 const proteinTarget=goals?.proteinTarget===undefined?120:goals.proteinTarget;
 const waterTarget=goals?.waterTargetMl===undefined?2100:goals.waterTargetMl;
 return <div className="nutrition-page">
  <div className="page-heading"><div><div className="eyebrow">FUEL YOUR DAY</div><h1>Nutrition & hydration</h1><p>Build your own food library. Every log keeps the nutrition values recorded at the time.</p></div><span className="workout-chip"><Utensils size={16}/> Local food database</span></div>
  <div className="panel nutrition-date"><label className="workout-input">Logging date<input type="date" value={selectedDay} onChange={e=>setSelectedDay(e.target.value)}/></label><span className="micro-text">Dates on charts use abbreviated months (Jan, Feb, Nov).</span></div>
  <div className="nutrition-stats">
   <div className="panel"><div className="mini-title"><Utensils size={18}/> Protein</div><strong>{round(totals.protein)} <small>g / {proteinTarget===null?'not set':proteinTarget+' g'}</small></strong><div className="progress-track"><span style={{width:`${proteinTarget===null?0:Math.min(100,100*totals.protein/(proteinTarget||1))}%`}}/></div><p>{proteinTarget===null?'Set your target in Settings':Math.max(0,round(proteinTarget-totals.protein))+' g remaining to target'}</p></div>
   <div className="panel"><div className="mini-title"><Droplets size={18}/> Drinking water</div><strong>{round(totalWater/1000,2)} <small>L / {waterTarget===null?'not set':round(waterTarget/1000,2)+' L'}</small></strong><div className="progress-track water"><span style={{width:`${waterTarget===null?0:Math.min(100,100*totalWater/(waterTarget||1))}%`}}/></div><p>{waterTarget===null?'Set your target in Settings':Math.max(0,waterTarget-totalWater)+' mL remaining'}</p></div>
   <div className="panel"><div className="mini-title"><Flame size={18}/> Energy consumed</div><strong>{Math.round(totals.calories)} <small>kcal</small></strong><p>No calorie-intake target until you choose one.</p></div>
   <div className="panel"><div className="mini-title"><Info size={18}/> Other macros</div><strong>{round(totals.carbs)} <small>g carbs</small></strong><p>{round(totals.fat)} g fats logged</p></div>
  </div>
  <div className="nutrition-columns">
   <section className="panel"><div className="section-head"><div><div className="eyebrow">EAT & LOG</div><h3>Log food</h3><p>Choose a category, then a food and portion count.</p></div><Utensils size={19}/></div>
    <label className="workout-input">Food category<select value={foodFilter} onChange={e=>{setFoodFilter(e.target.value);setFoodId('')}}><option value="all">All food categories</option>{categoryNames.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
    {visibleAvailable.length?<><label className="workout-input">Food<select value={active?.id??''} onChange={e=>setFoodId(e.target.value)}>{visibleAvailable.map(f=><option value={f.id} key={f.id}>{f.name} ({f.portionAmount} {f.portionUnit})</option>)}</select></label>
     <div className="nutrition-entry-grid"><label className="workout-input">Portions<input type="number" min="0.1" step="0.25" value={portions} onChange={e=>setPortions(e.target.value)}/></label><div className="nutrition-preview"><span>Preview</span><strong>{round((active?.protein??0)*Number(portions)||0)} g protein</strong><small>{Math.round((active?.calories??0)*Number(portions)||0)} kcal</small></div></div>
     <label className="workout-input">Optional note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Breakfast, homemade, etc."/></label>
     <button className="action-primary full" onClick={()=>void addFoodLog()}><Plus size={16}/> {editLogId?'Update food log':'Add food entry'}</button>
     {editLogId&&<button className="tiny-action" onClick={()=>{setEditLogId(null);setPortions('1');setNote('')}}>Cancel editing</button>}</>:<p className="empty-small">No foods in this category yet. Choose All or create a new food below.</p>}
    <div className="nutrition-library-top"><strong>Your food library ({foods.length})</strong><button className="action-outline" onClick={()=>{clearForm();setShowEditor(v=>!v)}}><Plus size={15}/> New food</button></div>
    {showEditor&&<div className="nutrition-food-editor"><h3>{editId?'Edit food':'Create a food'}</h3><p className="micro-text">Nutrient values are for ONE entered serving, not necessarily 100 g.</p>
     <label className="workout-input">Food name<input value={foodName} onChange={e=>setFoodName(e.target.value)} placeholder="e.g. Whole wheat bread"/></label>
     <label className="workout-input">Categories (comma-separated, create any names you like)<input value={foodCategoriesText} onChange={e=>setFoodCategoriesText(e.target.value)} placeholder="e.g. Bread, Breakfast, Vegetarian"/></label>
     <div className="nutrition-category-picker"><span>Quick add:</span>{['Non-veg','Bread','Dairy','Vegetarian','Fruit','Grains','Snacks','Drinks'].map(c=><button type="button" key={c} aria-pressed={normaliseCategories(foodCategoriesText).some(x=>x.toLowerCase()===c.toLowerCase())} className={normaliseCategories(foodCategoriesText).some(x=>x.toLowerCase()===c.toLowerCase())?'chosen':''} onClick={()=>toggleCategory(c)}>{c}</button>)}</div>
     <div className="nutrition-entry-grid"><label className="workout-input">Amount per portion<input type="number" value={portionAmount} min="0.1" step="0.1" onChange={e=>setPortionAmount(e.target.value)}/></label><label className="workout-input">Unit<input value={portionUnit} onChange={e=>setPortionUnit(e.target.value)} placeholder="slice, g, bowl, mL"/></label></div>
     <div className="nutrition-entry-grid"><label className="workout-input">Energy (kcal)<input type="number" min="0" value={calories} onChange={e=>setCalories(e.target.value)}/></label><label className="workout-input">Protein (g)<input type="number" min="0" step="0.1" value={protein} onChange={e=>setProtein(e.target.value)}/></label><label className="workout-input">Carbs (g)<input type="number" min="0" step="0.1" value={carbs} onChange={e=>setCarbs(e.target.value)}/></label><label className="workout-input">Fat (g)<input type="number" min="0" step="0.1" value={fat} onChange={e=>setFat(e.target.value)}/></label></div>
     <div className="session-buttons"><button className="action-primary" onClick={()=>void saveFood()}><Save size={16}/> Save food</button><button className="action-outline" onClick={clearForm}>Cancel</button></div>
    </div>}
    <div className="nutrition-saved-foods">{foods.filter(f=>foodFilter==='all'||(f.categories??[]).includes(foodFilter)).map(f=><div key={f.id} className="nutrition-food-line"><div><strong>{f.name}</strong>{(f.categories??[]).length>0&&<div className="food-category-tags">{f.categories?.map(c=><span key={c}>{c}</span>)}</div>}<small>{f.portionAmount} {f.portionUnit} - {f.calories} kcal - {f.protein} g protein</small></div><button aria-label={`Edit ${f.name}`} onClick={()=>editFood(f)}><Edit3 size={16}/></button><button aria-label={`Archive ${f.name}`} onClick={()=>void db.foods.update(f.id,{isArchived:!f.isArchived})}>{f.isArchived?'Unarchive':'Archive'}</button></div>)}</div>
   </section>
   <section className="panel"><div className="section-head"><div><div className="eyebrow">HYDRATION</div><h3>Water intake</h3><p>Track plain drinking water separately from food and other beverages.</p></div><Droplets size={19}/></div>
    <div className="water-quick">{[150,250,500,750].map(ml=><button key={ml} onClick={()=>void addWater(ml)}><Plus size={14}/>{ml} mL</button>)}</div>
    <div className="inline-add"><input aria-label="Custom amount of drinking water in milliliters" type="number" min="1" step="25" value={waterAmount} onChange={e=>setWaterAmount(e.target.value)}/><button className="action-primary" onClick={()=>void addWater(n(waterAmount))}>Add water</button></div>
    <p className="micro-text">2.1 L is a provisional, editable 60 kg-based starting target (35 mL/kg), NOT a creatine-specific requirement. Exercise, heat and sweat losses can change your needs.</p>
    <div className="nutrition-list-title">Water entries on {displayDate(selectedDay)}</div>
    <div className="nutrition-log-list">{dayWaters.length?dayWaters.map(w=><div className="nutrition-log" key={w.id}><span><Droplets size={14}/> {w.amountMl} mL</span><small>{format(new Date(w.at),'h:mm a')}</small><button title="Delete water entry" aria-label="Delete water entry" onClick={()=>void db.waterLogs.delete(w.id)}><Trash2 size={15}/></button></div>):<p className="micro-text">No water recorded on this date.</p>}</div>
    <div className="nutrition-list-title">Food entries on {displayDate(selectedDay)}</div>
    <div className="nutrition-log-list">{dayLogs.length?dayLogs.map(l=><div className="nutrition-log" key={l.id}><span><Utensils size={14}/><span>{l.foodSnapshot.name}{(l.foodSnapshot.categories??[]).length>0&&<span className="log-food-categories">{l.foodSnapshot.categories?.join(' · ')}</span>}<small>{l.portions} x {l.foodSnapshot.portionAmount} {l.foodSnapshot.portionUnit} - {round(l.portions*l.foodSnapshot.protein)} g protein</small></span></span><button title="Edit food entry" aria-label="Edit food entry" onClick={()=>{setEditLogId(l.id);setFoodFilter('all');setFoodId(l.foodId);setPortions(String(l.portions));setNote(l.note)}}><Edit3 size={15}/></button><button title="Delete food entry" aria-label="Delete food entry" onClick={()=>void db.foodLogs.delete(l.id)}><Trash2 size={15}/></button></div>):<p className="micro-text">No food recorded on this date.</p>}</div>
   </section>
  </div>
  <section className="panel"><div className="section-head"><div><div className="eyebrow">RECENT 14 DAYS</div><h3>Protein and water trends</h3><p>Missing logs are not evidence that you consumed zero. Chart bars show recorded amounts only.</p></div></div><div className="nutrition-charts"><div><strong>Protein (g)</strong><ResponsiveContainer width="100%" height={240}><BarChart data={series}><CartesianGrid vertical={false} stroke="var(--graph-grid,#e8edf5)" strokeDasharray="3 3"/><XAxis dataKey="label" tick={{fontSize:10}} interval={2}/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="protein" name="Protein (g)" fill="var(--nutrition-protein,#a37ada)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div><div><strong>Water (L)</strong><ResponsiveContainer width="100%" height={240}><BarChart data={series}><CartesianGrid vertical={false} stroke="var(--graph-grid,#e8edf5)" strokeDasharray="3 3"/><XAxis dataKey="label" tick={{fontSize:10}} interval={2}/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="water" name="Water (L)" fill="var(--nutrition-water,#6799d6)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div></section>
 </div>;
}
