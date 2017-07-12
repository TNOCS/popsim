import { IActivity } from './activity';
import { makeGuid } from './utils';
import { IPerson } from './person';
import { LocationType } from './location';

/**
 * The ActivityManager is a Singleton responsible for managing all activities.
 *
 */
export const ActivityManager = (() => {
  let isInit = false;
  let activities: { [guid: string]: IActivity | undefined } = {};

  let instance: {
    isInitialized: () => boolean;
    init: (activities: { [guid: string]: IActivity }) => void;
    add: (activity: IActivity) => string;
    update: (activity: IActivity) => boolean;
    get: (guid: string) => IActivity | undefined;
    getActivities: (guids: string[]) => IActivity[];
    getAll: () => { [guid: string]: IActivity | undefined } | undefined;
    remove: (guid: string) => void;
    hasTime: (p: IPerson, start: Date, end: Date) => boolean;
    printActivity: (guid: string) => string;
    printAgenda: (guids?: string[]) => string;
  };

  /**
   * Is the ActivityManager initialized already?
   */
  const isInitialized = () => isInit;

  /**
   * Initialize the ActivityManager
   * @param activities Set of activities
   */
  const init = (a: { [guid: string]: IActivity } = {}) => {
    if (isInit) { return; }
    activities = a;
    isInit = true;
  };

  /**
   * Get (a clone of) an activity
   * @param guid
   */
  const get = (guid: string) => (activities.hasOwnProperty(guid) && activities[guid])
    ? Object.assign(<IActivity>{ id: guid }, activities[guid])
    : undefined;

  /**
   * Get a list of (cloned) activities.
   * @param guid
   */
  const getActivities = (guids: string[]): IActivity[] => guids
    .filter(guid => activities.hasOwnProperty(guid) && activities[guid])
    .map(guid => Object.assign(<IActivity>{ id: guid }, activities[guid]));

  /**
   * Returns (a clone of) all activities, removing empty entries.
   */
  const getAll = () => {
    const all: { [guid: string]: IActivity } = {};
    for (const guid in activities) {
      if (!activities.hasOwnProperty(guid)) { continue; }
      const activity = activities[guid];
      if (activity) {
        all[guid] = Object.assign({}, activity);
      }
    }
    return all;
  };

  /**
   * Replace an existing activity with an updated version.
   *
   * @param {IActivity} activity
   * @returns true if successfull, false otherwise.
   */
  const update = (activity: IActivity) => {
    if (activity.id && activities.hasOwnProperty(activity.id)) {
      activities[activity.id] = Object.assign({}, activity, { id: '' }); // remove the id when storing it internally.
      return true;
    }
    return false;
  };

  /**
   * Add an activity to the manager
   * @param activity
   * @returns GUID of new activity.
   */
  const add = (activity: IActivity) => {
    if (activity.id) { return activity.id; }
    const guid = makeGuid();
    activities[guid] = activity;
    return guid;
  };

  /**
   * Remove an activity from the manager.
   * Actually, we set it to undefined, since deleting the activtiy is a slow operation.
   * @param guid
   */
  const remove = (guid: string) => {
    activities[guid] = undefined;
  };

  /**
   * Determine whether a person has time.
   *
   * @param {IPerson} p
   * @param {Date} start
   * @param {Date} end
   * @returns
   */
  const hasTime = (p: IPerson, start: Date, end: Date) => {
    if (!p.agenda) { p.agenda = []; }
    if (p.agenda.length === 0) { return true; }
    let ok = false;
    let lastActivity: IActivity;
    p.agenda.some(guid => {
      const a = activities[guid];
      if (a) {
        ok = end <= a.start && (!lastActivity || start > lastActivity.end);
        lastActivity = a;
      }
      return ok;
    });
    return ok;
  };

  const printActivity = (guid: string) => {
    const activity = get(guid);
    return activity ? `${activity.start.toLocaleTimeString()} - ${activity.end.toLocaleTimeString()} @ ${LocationType[activity.location.locType]}: ${activity.name}` : ' - missing - ';
  };

  const printAgenda = (guids?: string[]) => guids ? '\n' + guids.map(guid => printActivity(guid)).join('\n') : ' - no agenda - ';

  const createInstance = () => {
    return { init, isInitialized, get, getActivities, getAll, add, update, remove, hasTime, printActivity, printAgenda };
  };

  const getInstance = () => {
    if (!instance) { instance = createInstance(); }
    return instance;
  };

  return { getInstance };
})();
