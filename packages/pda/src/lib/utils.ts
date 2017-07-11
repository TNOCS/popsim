import { IActivity } from './../../../common/dist/lib/activity.d';
import { IPerson, IActivity, ActivityType, ILocation, ActivityManager } from '@popsim/common';

const activityManager = ActivityManager.getInstance();

/**
 * Convert a string, such as '08.30' to a time.
 *
 * @param {Date} simStartTime
 * @param {string} timeStr
 * @returns
 */
export const stringToDate = (simStartTime: Date, timeStr: string) => {
  const t = timeStr.split(':');
  const time = new Date(simStartTime.valueOf());
  time.setHours(+t[0], +t[1]);
  return time;
};

/**
 * Insert a new activity in the agenda, if possible.
 *
 * There are several cases:
 * - The agenda is empty, so we can just add the new activity
 * - The agenda is full, and we cannot move existing items (e.g. because there are multiple participants)
 * - The item can be appended or inserted into the agenda (e.g. travelling to/from work)
 * - The item overlaps with an existing item: split the existing item in two parts, and insert the new one (e.g. lunch during work)
 *
 * @param {string[]} agenda
 * @param {IActivity} newActivity
 * @returns GUID of new activity or empty if we cannot plan the new item
 */
const insertActivityInAgenda = (agenda: string[], newActivity: IActivity) => {
  let newGuid: string = '';
  const activityAgenda = activityManager.getActivities(agenda);
  if (activityAgenda.length === 0) {
    newGuid = activityManager.add(newActivity);
    agenda.push(newGuid);
    return;
  }
  activityAgenda.some((a, i, activities) => {
    const tooFar = a.start >= newActivity.end;
    if (tooFar) {
      const fits = i === 0 || activities[i - 1].end <= newActivity.start;
      if (!fits) {
        // Reduce the current activity's duration (alternatively, we may reduce the existing activity's end time)
        const duration = newActivity.end.valueOf() - newActivity.start.valueOf();
        newActivity.start = activities[i - 1].end;
        const newActivityEndTime = new Date(newActivity.start.valueOf() + duration);
        newActivity.end = newActivityEndTime < a.start ? newActivityEndTime : a.start;
      }
      newGuid = activityManager.add(newActivity);
      agenda.splice(i, 0, newGuid);
      return true;
    }
    const addToEnd = i === activities.length - 1;
    if (addToEnd) {
      newGuid = activityManager.add(newActivity);
      agenda.push(newGuid);
      return true;
    }
    const overlaps = a.start <= newActivity.start && a.end >= newActivity.end;
    if (overlaps) {
      const canSplitActivity = (!a.group) || a.group.length === 1;
      if (canSplitActivity) {
        const partA: IActivity = Object.assign({}, a, { end: newActivity.start });
        const partB: IActivity = Object.assign({}, a, { start: newActivity.end, id: '' });
        activityManager.update(partA);
        agenda.splice(i, 0, activityManager.add(partB));
        newGuid = activityManager.add(newActivity);
        agenda.splice(i, 0, newGuid);
      }
      return true;
    }
    return false;
  });
  return newGuid;
};

/**
 * Create a new agenda item for a person.
 *
 * @param {IPerson} p
 * @param {string} name
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {ActivityType} activityType
 * @param {ILocation} [location]
 * @returns
 */
export const createAgendaItem = (p: IPerson, name: string, startTime: Date, endTime: Date, activityType: ActivityType, location?: ILocation, group?: string[]) => {
  const activity = <IActivity>{
    name: name,
    activity: activityType,
    location: location,
    start: startTime,
    end: endTime,
    group: group
  };
  if (p.agenda) { insertActivityInAgenda(p.agenda, activity); }
  return activity;
};
