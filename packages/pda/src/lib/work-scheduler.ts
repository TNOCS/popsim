import { createTransportationScheduler } from './transportation-scheduler';
import * as distance from '@turf/distance';
import { stringToDate, createAgendaItem } from './utils';
import { IPerson, ILocation, random, ActivityType, PersonRole, LocationType } from '@popsim/common';
import { config } from './configuration';
import { RuleEngineFactory, IState, IActionOptions } from '@popsim/rules';

interface IWorkState extends IState {
  employee: IPerson;
  workplace: ILocation;
  role: PersonRole;
  locType: LocationType;
}

interface IWorkOptions extends IActionOptions {
  startShift: string[];
  maxWorkHours: number[];
  shiftRatios: number[];
  end: string;
  fulltime: number;
  deltaStartMinutes: number;
  deltaDurationMinutes: number;
  partTimeRatio: number;
}

export const CreateWorkScheduler = (startTime: Date) => {

  const transportationScheduler = createTransportationScheduler();

  const assignHours = (state: IWorkState, options: IWorkOptions) => {
    const { employee, workplace } = state;
    const selectedShift = Math.max(0, (options.shiftRatios.reduce((prev, cur, i) => {
      if (prev.i > -1 || prev.rand > cur) { return prev; }
      return { rand: prev.rand, i };
    }, { rand: Math.random(), i: -1 })).i);
    const isPartimeWorker = Math.random() < options.partTimeRatio;
    const workHours = (isPartimeWorker
      ? random(1, options.maxWorkHours[selectedShift] - 1)
      : options.maxWorkHours[selectedShift]) +
      random(-options.deltaDurationMinutes, options.deltaDurationMinutes) / 60;
    const deltaStartTimeMSec = random(-options.deltaStartMinutes, options.deltaStartMinutes) * 60000;
    const start = options.startShift[selectedShift];
    const startsAt = new Date(stringToDate(startTime, start).valueOf() + deltaStartTimeMSec);
    const endsAt = new Date(startsAt.valueOf() + workHours * 3600000);
    const travelDistance = distance(employee.locations[0].geo, workplace.geo, 'meters');

    transportationScheduler.run({
      employee, travelDistance,
      age: employee.age,
      destination: workplace,
      arrivalTime: startsAt
    });
    createAgendaItem('At work', 0, startsAt, endsAt, ActivityType.working, workplace, [ employee ]);
    transportationScheduler.run({
      employee, travelDistance,
      age: employee.age,
      destination: employee.locations[0],
      departureTime: endsAt
    });
  };

  /**
   * Create a work scheduler which plans a person's working hours.
   */
  const workScheduler = RuleEngineFactory<IWorkState, IWorkOptions>(config.work.schedule, { assignHours }, {});

  const findWorkLocation = (p: IPerson) => p.roles.filter(p2 => p2.role === PersonRole.employee).shift();

  const attendWork = (p: IPerson) => {
    const workplaceRoleAtLocation = findWorkLocation(p);
    if (workplaceRoleAtLocation) {
      const workplace = p.locations[workplaceRoleAtLocation.location];
      return workScheduler.run({ employee: p, workplace, locType: workplace.locType, role: workplaceRoleAtLocation.role });
    }
  };

  return attendWork;
};
