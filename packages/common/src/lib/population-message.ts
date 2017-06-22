import { IPerson } from './person';
import { IHousehold } from './household';

export interface IPopulationMsg {
  requestId: number;
  bbox: number[];
  households: IHousehold[];
  /** Non-local persons */
  others: IPerson[];
}
