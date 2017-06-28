import { IPerson } from './person';

export interface IPdaMsg {
  requestId: number;
  bbox: number[];
  persons: IPerson[];
}
