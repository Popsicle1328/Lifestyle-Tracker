import {describe,it,expect} from 'vitest';
import {buildSupersetRound,canEstimateRest,showsMeasuredTiming,validateSetSpec} from './workoutEntry';
import type {WorkoutSet} from './models';
const first={exerciseId:'shoulder-press',weight:12,reps:9,unit:'kg_each' as const,sequence:1,setKind:'working' as const,effort:'normal' as const,dropStages:[]};
const second={exerciseId:'lateral-raise',weight:5,reps:15,unit:'kg_each' as const,sequence:1,setKind:'working' as const,effort:'near_failure' as const,dropStages:[]};
describe('superset data safety',()=>{
 it('creates two independent recorded exercises linked in one round',()=>{let id=0;const [a,b]=buildSupersetRound('session',first,second,'2026-11-11T12:00:00.000Z',()=>String(++id));expect(a.exerciseId).toBe('shoulder-press');expect(b.exerciseId).toBe('lateral-raise');expect(a.reps).toBe(9);expect(b.reps).toBe(15);expect(a.weight).toBe(12);expect(b.weight).toBe(5);expect(a.supersetGroupId).toBe(b.supersetGroupId);expect(a.id).not.toBe(b.id);expect(a.timestampSource).toBe('grouped');expect(b.timestampSource).toBe('grouped');expect(canEstimateRest(a,b)).toBe(false);});
 it('rejects invalid partner repetitions',()=>{expect(validateSetSpec({...second,reps:0})).toContain('Repetitions');});
 it('does not call retroactively entered times measured',()=>{const a:WorkoutSet={id:'a',sessionId:'s',exerciseId:'press',sequence:1,weight:5,reps:10,unit:'kg_each',completedAt:'2026-11-11T12:00:00.000Z',startedAt:null,setKind:'working',dropStages:[],supersetGroupId:null,effort:null,notes:'',timestampSource:'automatic'};const b={...a,id:'b',completedAt:'2026-11-11T12:03:00.000Z',timestampSource:'manual' as const};expect(showsMeasuredTiming(b)).toBe(false);expect(canEstimateRest(a,b)).toBe(false);expect(canEstimateRest(a,{...b,timestampSource:'automatic'})).toBe(true);});
});
