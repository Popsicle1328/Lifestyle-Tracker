export interface SleepRecord {
 id:string; sleepDate:string; bedtime:string; wakeup:string|null; createdAt:string; updatedAt:string;
 sourceBed:'now'|'manual'; sourceWake:'now'|'manual'|null; note?:string; isDemo?:boolean;
}
export interface Preferences { id:'main'; latencyMinutes:number; idealMinMinutes:number; idealMaxMinutes:number; yellowLowMinutes:number; redLowMinutes:number; yellowHighMinutes:number; redHighMinutes:number; fluctuationMinutes:number; dayCutoffHour:number }
export const DEFAULT_PREFS:Preferences={id:'main',latencyMinutes:45,idealMinMinutes:480,idealMaxMinutes:540,yellowLowMinutes:435,redLowMinutes:390,yellowHighMinutes:570,redHighMinutes:600,fluctuationMinutes:90,dayCutoffHour:6};
export interface EnrichedSleep extends SleepRecord {bedMinutes:number|null;estimatedMinutes:number|null;bedHour:number|null;wakeHour:number|null;status:'ideal'|'below'|'above'|'incomplete'}
export type LoadUnit='kg_each'|'kg_total'|'machine_level'|'stack_kg'|'bodyweight';
export interface ExerciseDefinition {id:string;name:string;category:string;equipment:string;loadMode?:string;primaryMuscles:string[];secondaryMuscles:string[];reviewStatus?:string;notes?:string;aliases?:string[];isCustom?:boolean;splitOverride?:'push'|'pull'|'legs'|'core'|'other'}
export type SessionStatus='active'|'paused'|'completed';
export interface PauseInterval {startedAt:string;endedAt:string|null}
export interface WorkoutSession {id:string;date:string;startedAt:string;endedAt:string|null;status:SessionStatus;pauses:PauseInterval[];bodyWeightKg:number|null;notes:string;createdAt:string;updatedAt:string;isDemo?:boolean}
export interface DropStage {weight:number;reps:number;unit:LoadUnit;at:string}
export interface WorkoutSet {id:string;sessionId:string;exerciseId:string;sequence:number;weight:number|null;reps:number;unit:LoadUnit;completedAt:string;startedAt:string|null;setKind:'working'|'warmup'|'dropset';dropStages:DropStage[];supersetGroupId:string|null;effort:'normal'|'near_failure'|'failure'|null;notes:string;isDemo?:boolean;timestampSource?:'automatic'|'grouped'|'manual'}
export interface CardioInterval {id:string;sessionId:string;kind:'incline_treadmill';startedAt:string;endedAt:string;durationMinutes:number;speedKmh:number;inclinePercent:number;bodyWeightKg:number|null;isDemo?:boolean}
export interface AppMeta {id:string;value:string}
// Nutrition entries snapshot the original nutrient facts, preserving historical totals when foods are edited.
export interface FoodDefinition {id:string;name:string;portionAmount:number;portionUnit:string;calories:number;protein:number;carbs:number;fat:number;createdAt:string;updatedAt:string;isArchived?:boolean;categories?:string[]}
export interface FoodSnapshot {categories?:string[];name:string;portionAmount:number;portionUnit:string;calories:number;protein:number;carbs:number;fat:number}
export interface FoodLog {id:string;date:string;foodId:string;portions:number;foodSnapshot:FoodSnapshot;at:string;note:string}
export interface WaterLog {id:string;date:string;amountMl:number;at:string}
export interface NutritionPrefs {id:'main';calorieTarget:number|null;proteinTarget:number|null;carbsTarget:number|null;fatTarget:number|null;waterTargetMl:number|null;bodyWeightKg?:number|null;workoutDaysPerWeek?:number|null;calorieBurnTarget?:number|null}
export const DEFAULT_NUTRITION_PREFS:NutritionPrefs={id:'main',calorieTarget:null,proteinTarget:120,carbsTarget:null,fatTarget:null,waterTargetMl:2100,bodyWeightKg:60,workoutDaysPerWeek:null,calorieBurnTarget:null};
