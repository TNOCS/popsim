import { IActivity } from '../activity';

export interface IActivitiesMsg {
  requestId: number;
  bbox: number[];
  activities: { [guid: string]: IActivity }
}
