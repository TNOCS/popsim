import { CreateWorkScheduler } from './work-scheduler';
import { IPerson, isUnemployed, IHousehold, getChildren } from '@popsim/common';

export const msecPerHour = 24 * 60 * 60 * 1000;

export const AgendaForParent = (startTime: Date, endTime: Date) => {

  const workSchedulers: { (p: IPerson): number | undefined }[] = [];

  let day = 0;
  let time: Date;
  do {
    time = new Date(startTime.valueOf() + day * msecPerHour);
    workSchedulers.push(CreateWorkScheduler(time));
    day++;
  } while (time < endTime);

  /**
   * Create an agenda for a parent.
   *
   * A parent's agenda during the week looks something like this:
   * - Get up early, eat
   * - Optionally, bring children to school or daycare.
   * - If employed, travel to work.
   * 	- Work
   * 	- Optionally, during lunch, take a walk (if the weather is nice)
   * 	- Optionally, do some shopping (less likely than a single)
   * 	- Travel back home
   * - Otherwise
   * 	- Do housework, attend children
   * 	- Optionally, do some shopping
   * - Optionally, get children from school or daycare
   * - Optionally, bring children to sport or other activity
   * - Optionally, do some sports or go out (less likely than a single)
   *
   * In the weekend, it may look like
   * - Get up (late), eat, clean the house.
   * - Optionally, bring children to sports (e.g. watch a game of soccer)
   * - Optionally, do some shopping (more likely than a single)
   * - Optionally, meet with friends
   * - Optionally, do something cultural
   * - Optionally, do some sports or go out
   *
   * @param {IPerson} p
   * @param {IHousehold} household
   * @returns Original person with a full agenda for the whole period
   */
  const agendaForParent = (parent: IPerson, household: IHousehold) => {
    parent.agenda = [];
    const isEmployed = !isUnemployed(parent);
    if (isEmployed) { workSchedulers.forEach(workScheduler => workScheduler(parent)); }
    return parent;
  };

  return agendaForParent;
};
