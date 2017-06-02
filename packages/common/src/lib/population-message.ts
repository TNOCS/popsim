import { IHousehold } from './household';

export interface IPopulationMsg {
  requestId: number;
  bbox: number[];
  households: IHousehold[];
}
