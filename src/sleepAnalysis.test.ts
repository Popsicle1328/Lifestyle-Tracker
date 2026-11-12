import {expect,test} from 'vitest';
import {analyzeSleepFluctuations,clockShiftMinutes,median} from './sleepAnalysis';
import {DEFAULT_PREFS,type EnrichedSleep} from './models';
test('median resists a very short night',()=>expect(median([480,480,100,480,500])).toBe(480));
test('clock differences cross midnight correctly',()=>{
 expect(clockShiftMinutes('2026-11-02T23:55:00+05:30','2026-11-03T00:05:00+05:30')).toBe(10);
});
test('large timing shift compares to preceding night',()=>{
 const sample=(date:string,bed:string,wake:string,duration:number):EnrichedSleep=>({id:date,sleepDate:date,bedtime:bed,wakeup:wake,createdAt:bed,updatedAt:bed,sourceBed:'manual',sourceWake:'manual',bedMinutes:duration+45,estimatedMinutes:duration,bedHour:22,wakeHour:30,status:'ideal'});
 const a=sample('2026-11-02','2026-11-02T23:00:00+05:30','2026-11-03T07:45:00+05:30',480);
 const b=sample('2026-11-03','2026-11-04T01:00:00+05:30','2026-11-04T09:45:00+05:30',480);
 const result=analyzeSleepFluctuations([a,b],DEFAULT_PREFS);
 expect(result[0].kind).toBe('timing');
});
