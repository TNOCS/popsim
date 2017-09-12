import * as distance from '@turf/distance';
import { stringToDate, createAgendaItem, addPersonToActivity } from './utils';
import { IActivity, IHousehold, ILocation, IPerson, PersonRole, LocationType, getFather, getMother, isUnemployed, ActivityType, ActivityManager, randomString } from '@popsim/common';
import { config } from './configuration';
import { RuleEngineFactory, IState, IActionOptions } from '@popsim/rules';

interface ISchoolState extends IState {
  child: IPerson;
  school: ILocation;
  household: IHousehold;
}

interface ISchoolOptions extends IActionOptions {
  startShift: string[];
  maxWorkHours: number[];
  shiftRatios: number[];
  end: string;
  fulltime: number;
  deltaStartMinutes: number;
  deltaDurationMinutes: number;
  partTimeRatio: number;
}

export const CreateSchoolScheduler = (startTime: Date) => {

  const activityManager = ActivityManager.getInstance();

  const findSchoolLocation = (child: IPerson) => child.roles.filter(p => p.role === PersonRole.student).shift();

  const alreadyGoingToSchool = (parent: IPerson, child: IPerson, school: ILocation) => {
    if (!parent.agenda) { return false; }
    const activityAgenda = activityManager.getActivities(parent.agenda);
    const a = activityAgenda.reduce((prev, cur) => prev === null && cur.location.bId === school.bId ? cur : prev, undefined);
    if (!a) { return false; }
    addPersonToActivity(child, a);
    return true;
  };

  const bringToSchoolRuleEngine = RuleEngineFactory<ISchoolState, ISchoolOptions>(config.accompanyChild.toSchool, {
    bringToSchool: (state: ISchoolState) => {
      const settings = config.accompanyChild;
      const school = state.school;
      const household = state.household;
      const child = state.child;
      const mother = getMother(household);
      if (mother && alreadyGoingToSchool(mother, child, school)) { return; }
      const father = getFather(household);
      if (father && alreadyGoingToSchool(father, child, school)) { return; }

      const distance = <number>state.distance;
      let activityType: ActivityType;
      let speed: number;
      if (distance < settings.maxWalkingDistance) {
        activityType = ActivityType.walking;
        speed = settings.walkingSpeedKmh;
      } else if (distance < settings.maxCyclingDistance) {
        activityType = ActivityType.cycling;
        speed = settings.cyclingSpeedKmh;
      } else {
        activityType = ActivityType.driving;
        speed = settings.drivingSpeedKmh;
      }
      const speedMs = speed * 1000 / 3600;
      const timeInSec = <number>state.distance / speedMs;
      const activity = <IActivity>state.activity;
      const startsAt = new Date(activity.start.valueOf() - timeInSec * 1000);
      const endsAt = activity.start;
      const motherUnemployed = isUnemployed(mother);
      const fatherUnemployed = isUnemployed(father);
      if (mother && activityManager.hasTime(mother, startsAt, endsAt) && (!father || motherUnemployed || (father && !fatherUnemployed))) {
        // Mother will do it
        createAgendaItem('Travelling to school', speed, startsAt, endsAt, activityType, school, [ mother, child ]);
      } else if (father && activityManager.hasTime(father, startsAt, endsAt)) {
        // Father will do it
        createAgendaItem('Travelling to school', speed, startsAt, endsAt, activityType, school, [ father, child ]);
      } else {
        createAgendaItem('Travelling to school alone', speed, startsAt, endsAt, activityType, school, [ child ]);
      }
    }
  });

  const planSchool = (child: IPerson, school: ILocation) => {
    const simStart = new Date(startTime);
    const day = simStart.toString().substr(0, 3);
    if (school.locType === LocationType.primarySchool) {
      if (config.primarySchools.schedule.hasOwnProperty(day)) {
        const schedule = config.primarySchools.schedule[day];
        const start = stringToDate(startTime, randomString(schedule.starts));
        const end = stringToDate(startTime, randomString(schedule.ends));
        return createAgendaItem('Attending primary school', 0, start, end, ActivityType.working, school, [ child ]);
      }
    } else if (school.locType === LocationType.secondarySchool) {
      if (config.secondarySchools.schedule.hasOwnProperty(day)) {
        const schedule = config.secondarySchools.schedule[day];
        const start = stringToDate(startTime, randomString(schedule.starts));
        const end = stringToDate(startTime, randomString(schedule.ends));
        return createAgendaItem('Attending secondary school', 0, start, end, ActivityType.working, school, [ child ]);
      }
    }
    return null;
  };

  const attendSchool = (child: IPerson, h: IHousehold) => {
    const schools = findSchoolLocation(child);
    if (!schools) { return; }
    const school = child.locations[schools.location];
    const activity = planSchool(child, school);
    if (activity === null) { return; }
    // Does child need to be brought to school? If so, assign the task and time to child and parent
    const travelDistance = distance(child.locations[0].geo, school.geo, 'meters');
    const bringToSchoolScheduler = bringToSchoolRuleEngine.run({
      age: child.age,
      distance: travelDistance,
      household: h,
      child, activity, school
    });
    if (!bringToSchoolScheduler) {
      let activityType: ActivityType;
      let speed: number;
      if (travelDistance < config.accompanyChild.maxWalkingDistance) {
        activityType = ActivityType.walking;
        speed = config.accompanyChild.walkingSpeedKmh;
      } else {
        activityType = ActivityType.cycling;
        speed = config.accompanyChild.cyclingSpeedKmh;
      }
      const speedMs = speed * 1000 / 3600;
      const timeInSec = travelDistance / speedMs;
      const startsAt = new Date(activity.start.valueOf() - timeInSec * 1000);
      const endsAt = activity.start;
      createAgendaItem('Travelling to school alone', speed, startsAt, endsAt, activityType, school, [ child ]);
    }
  };

  return attendSchool;
};
