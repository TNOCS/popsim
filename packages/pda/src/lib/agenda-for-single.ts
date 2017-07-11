import { CreateWorkScheduler } from './work-scheduler';
import { IPerson, isUnemployed } from '@popsim/common';

export const msecPerHour = 24 * 60 * 60 * 1000;

export const AgendaForSingle = (startTime: Date, endTime: Date) => {
  const workSchedulers: { (p: IPerson): number | undefined }[] = [];
  let day = 0;
  let time: Date;
  do {
    time = new Date(startTime.valueOf() + day * msecPerHour);
    workSchedulers.push(CreateWorkScheduler(time));
    day++;
  } while (time < endTime);

  /**
   * Create an agenda for a single person.
   *
   * A single's agenda during the week looks something like this:
   * - Get up early, eat
   * - If employed, travel to work.
   * 	- Work
   * 	- Optionally, during lunch, take a walk (if the weather is nice)
   * 	- Optionally, do some shopping
   * 	- Travel back home
   * - Otherwise
   * 	- Hang-out
   * 	- Optionally, do some shopping
   * - Optionally, do some sports or go out
   *
   * In the weekend, it may look like
   * - Get up (late), eat, clean the house.
   * - Optionally, do some shopping
   * - Optionally, meet with friends
   * - Optionally, do some sports or go out
   *
   * When working part-time, it may be in the morning, afternoon or evening (e.g. in a shop).
   *
   * @param {IPerson} p
   * @param {Date} startTime
   * @param {Date} endTime
   * @returns Original person with a full agenda for the whole period
   */
  const agendaForSingle = (p: IPerson) => {
    p.agenda = [];
    const isEmployed = !isUnemployed(p);
    if (isEmployed) { workSchedulers.forEach(workScheduler => workScheduler(p)); }
    return p;
  };

  return agendaForSingle;
};
