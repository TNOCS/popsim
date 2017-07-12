import { IPerson } from '../person';

export interface IPersonsMsg {
  requestId: number;
  bbox: number[];
  persons: { [guid: string]: IPerson };
}
