import { createAgendaItem } from './utils';
import { RuleEngineFactory, IState, IActionOptions } from '@popsim/rules';
import { IPerson, ILocation, ActivityType } from '@popsim/common';
import { config } from './configuration';

interface ITransporationState extends IState {
  employee: IPerson;
  age: number;
  travelDistance: number;
  departureTime?: Date;
  arrivalTime?: Date;
  destination: ILocation;
}

interface ITransportationOptions extends IActionOptions {
  speedKmh: number;
  activityType: ActivityType;
}

export const createTransportationScheduler = () => {

  const assignTransportation = (state: ITransporationState, options: ITransportationOptions) => {
    const speed = options.speedKmh * 1000 / 3600; // m/s
    const duration = state.travelDistance / speed * 1000; // msec
    if (state.departureTime) {
      const arrivalTime = new Date(state.departureTime.valueOf() + duration);
      createAgendaItem(state.employee, `Travelling at ${options.speedKmh}km/h`, state.departureTime, arrivalTime, options.activityType, state.destination);
    } else if (state.arrivalTime) {
      const departureTime = new Date(state.arrivalTime.valueOf() - duration);
      createAgendaItem(state.employee, `Travelling at ${options.speedKmh}km/h`, departureTime, state.arrivalTime, options.activityType, state.destination);
    }
  };

  return RuleEngineFactory<ITransporationState, ITransportationOptions>(config.transportation, { assignTransportation });
};
