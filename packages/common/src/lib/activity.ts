import { ILocation } from './location';

export interface IActivity {
  name: string;
  location: ILocation;
  start: Date;
  end: Date;
}
