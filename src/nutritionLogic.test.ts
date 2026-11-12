import {expect,test} from 'vitest';
import {foodTotals} from './nutritionLogic';
import type {FoodLog} from './models';
test('nutrition totals use portions and historical snapshots',()=>{
 const logs=[{portions:2,foodSnapshot:{name:'Bread',portionAmount:1,portionUnit:'slice',calories:80,protein:3,carbs:15,fat:1}}] as FoodLog[];
 const result=foodTotals(logs);
 expect(result).toEqual({calories:160,protein:6,carbs:30,fat:2});
});
