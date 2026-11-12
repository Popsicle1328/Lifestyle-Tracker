import type {FoodLog} from './models';
export function foodTotals(logs:FoodLog[]){
 return logs.reduce((sum,log)=>({
  calories:sum.calories+log.foodSnapshot.calories*log.portions,
  protein:sum.protein+log.foodSnapshot.protein*log.portions,
  carbs:sum.carbs+log.foodSnapshot.carbs*log.portions,
  fat:sum.fat+log.foodSnapshot.fat*log.portions
 }),{calories:0,protein:0,carbs:0,fat:0});
}
