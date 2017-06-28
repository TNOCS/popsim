import { IWorkplace } from './workplace';

export interface IWorkforceMsg {
  requestId: number;
  bbox: number[];
  workplaces: IWorkplace[];
}
