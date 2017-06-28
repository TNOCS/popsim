import { Point } from 'geojson';
import * as distance from '@turf/distance';
import { childrenInHousehold, ISimRequestMessage, randomString, IActivity, IHousehold, random, WorkplaceType, ILocation, IWorkplace, IPopulationMsg, IPerson, Gender, PersonRole, LocationType, RelationType, IRoleAtLocation } from '@popsim/common';
import { config } from './configuration';
import { RuleEngineFactory, IState } from '@popsim/rules';

export class PdaService {
  constructor(private sim: ISimRequestMessage, private workplaces: IWorkplace[], private pop: IPopulationMsg) {
    if (!this.pop.others) { this.pop.others = []; }
  }

  public createAgendasAsync() {
    return new Promise<IPerson[]>((resolve) => {
      const persons = this.createAgendas();
      resolve(persons);
    });
  }

  /**
   * Creates agendas for our population.
   *
   * @private
   * @returns
   *
   * @memberof PdaService
   */
  private createAgendas() {
    const persons: IPerson[] = [];

    const createEmptyAgenda = (h: IHousehold) => h.persons.forEach(p => p.agenda = []);

    const createAgendaItem = (p: IPerson, name: string, location: ILocation, startTime: Date, endTime: Date) => {
      const activity = <IActivity>{
        name: name,
        location: location,
        start: startTime,
        end: endTime
      };
      if (p.agenda) { p.agenda.push(activity); }
      return activity;
    };

    const findSchoolLocations = (child: IPerson) => child.roles.filter(p => p.role === PersonRole.student);

    const stringToDate = (timeStr: string) => {
      const t = timeStr.split(':');
      const time = new Date(this.sim.simulationStartTime);
      time.setHours(+t[0], +t[1]);
      return time;
    };

    const planSchool = (child: IPerson, school: ILocation) => {
      const now = this.sim.simulationStartTime.toUTCString();
      const day = now.substr(0, 3);
      if (school.locType === LocationType.primarySchool) {
        if (config.statistics.primarySchools.schedule.hasOwnProperty(day)) {
          const schedule = config.statistics.primarySchools.schedule[day];
          const start = stringToDate(randomString(schedule.starts));
          const end = stringToDate(randomString(schedule.ends));
          return createAgendaItem(child, 'Attending primary school', school, start, end);
        }
      } else if (school.locType === LocationType.secondarySchool) {
        if (config.statistics.secondarySchools.schedule.hasOwnProperty(day)) {
          const schedule = config.statistics.secondarySchools.schedule[day];
          const start = stringToDate(randomString(schedule.starts));
          const end = stringToDate(randomString(schedule.ends));
          return createAgendaItem(child, 'Attending secondary school', school, start, end);
        }
      }
      return null;
    };

    const bringToSchoolRuleEngine = RuleEngineFactory(config.accompanyChild.toSchool, { bringToSchool: (state: IState) => {
      console.log('Bring me to school');
    } });

    this.pop.households.forEach(h => {
      createEmptyAgenda(h);
      const children = childrenInHousehold(h);
      if (children.length > 0) {
        children.forEach(child => {
          const school = findSchoolLocations(child);
          if (school.length < 0) { return; }
          const activity = planSchool(child, child.locations[school[0].location]);
          if (activity === null) { return; }
          // Does child need to be brought to school?
          bringToSchoolRuleEngine.run({ age: child.age, distance: distance(child.locations[0].geo, child.locations[school[0].location].geo, 'meters') });
        });
      }
    });

    return persons;
  }
}
