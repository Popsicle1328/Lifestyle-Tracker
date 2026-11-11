import {describe,it,expect} from 'vitest';
import {activeMinutes,estimatedGrossKcal,treadmillKcal,activeDaysForMuscle,restApproxMinutes} from './workoutLogic';
import type {WorkoutSession,WorkoutSet,ExerciseDefinition} from './models';
const s:WorkoutSession={id:'s',date:'2026-11-10',startedAt:'2026-11-10T10:00:00Z',endedAt:'2026-11-10T11:00:00Z',status:'completed',pauses:[{startedAt:'2026-11-10T10:20:00Z',endedAt:'2026-11-10T10:30:00Z'}],bodyWeightKg:70,notes:'',createdAt:'2026-11-10T10:00:00Z',updatedAt:'2026-11-10T11:00:00Z'};
const w=(id:string,at:string):WorkoutSet=>({id,sessionId:'s',exerciseId:'bench',sequence:1,weight:20,reps:10,unit:'kg_total',completedAt:at,startedAt:null,setKind:'working',dropStages:[],supersetGroupId:null,effort:null,notes:''});
describe('workout calculations',()=>{
 it('excludes pauses from active duration',()=>expect(activeMinutes(s)).toBe(50));
 it('calculates gross kcal only when mass known',()=>{expect(estimatedGrossKcal(70,60,3.5)).toBe(257);expect(estimatedGrossKcal(null,60,3.5)).toBeNull()});
 it('treadmill incline increases estimated energy',()=>expect(treadmillKcal(70,4,8,20)!).toBeGreaterThan(treadmillKcal(70,4,0,20)!));
 it('rest proxy is completion-to-completion',()=>expect(restApproxMinutes(w('a','2026-11-10T10:00:00Z'),w('b','2026-11-10T10:02:30Z'))).toBe(2.5));
 it('muscle frequency counts distinct dates, not sets',()=>{const e:ExerciseDefinition={id:'bench',name:'Bench',category:'chest',equipment:'barbell',primaryMuscles:['pectoralis'],secondaryMuscles:['triceps']};expect(activeDaysForMuscle([s],[w('a','2026-11-10T10:01:00Z'),w('b','2026-11-10T10:03:00Z')],[e],'pectoralis')).toBe(1)});
});
