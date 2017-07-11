import { CreateSchoolScheduler } from './school-scheduler';
import { IPerson, IHousehold } from '@popsim/common';

export const msecPerHour = 24 * 60 * 60 * 1000;

export const AgendaForChild = (startTime: Date, endTime: Date) => {

  const schoolSchedulers: { (p: IPerson, h: IHousehold): void }[] = [];

  let day = 0;
  let time: Date;
  do {
    time = new Date(startTime.valueOf() + day * msecPerHour);
    schoolSchedulers.push(CreateSchoolScheduler(time));
    day++;
  } while (time < endTime);

  /**
   * Create an agenda for a child.
   *
   * A child's agenda during the week looks something like this:
   * - Get up early, eat
   * - Go to school or daycare: this may require an adult or older sibling to accompany the child
   * - TODO Study or play.
   * 	- Optionally, during lunch, take a walk on the school terrain
   * 	- Optionally, go to gym
   * - Go home or after school care: this may require support as well
   * 	- Optionally, do homework or play
   * - TODO Optionally, go to sport or other activity (this may require support again)
   *
   * TODO In the weekend, it may look like
   * - Get up (late), eat.
   * - Optionally, do some sport activity (e.g. play a game of soccer)
   * - Optionally, do some shopping
   * - Optionally, meet with friends
   * - Optionally, do something cultural
   * - Optionally, do some sports or go out
   *
   * @param {IPerson} child
   * @param {Date} startTime
   * @param {Date} endTime
   * @returns Original child with a full agenda for the whole period
   */
  const agendaForChild = (child: IPerson, household: IHousehold) => {
    schoolSchedulers.forEach(schoolScheduler => schoolScheduler(child, household));
    return child;
  };

  return agendaForChild;
};
