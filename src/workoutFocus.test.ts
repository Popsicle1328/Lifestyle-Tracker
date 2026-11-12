import {expect,test} from 'vitest';
import {recommendFocus,regionOf,splitOf} from './workoutFocus';
import {initialExercises} from './demo';
test('exercise maps to push split',()=>{
 const bench=initialExercises.find(e=>e.id==='flat_dumbbell_bench_press')!;
 expect(splitOf(bench)).toBe('push');expect(regionOf(bench)).toContain('chest');
});
test('long breaks recommend one normal split, not everything at once',()=>{
 const focus=recommendFocus([],[],initialExercises,new Date('2026-11-11T12:00:00'));
 expect(['push','pull','legs']).toContain(focus.split);
 expect(focus.exercises.length).toBeLessThanOrEqual(5);
});
