import { ActivityManager } from './activity-manager';
import { makeGuid } from './utils';
import { IPerson, Gender } from './person';

export const PersonManager = (() => {
  const acitivityManager = ActivityManager.getInstance();

  let isInit = false;
  let persons: { [guid: string]: IPerson | undefined } = {};

  let instance: {
    isInitialized: () => boolean;
    init: (persons: { [guid: string]: IPerson }) => void;
    add: (person: IPerson) => string;
    update: (person: IPerson) => boolean;
    get: (guid: string) => IPerson | undefined;
    getGroup: (guids: string[]) => IPerson[];
    getAll: () => { [guid: string]: IPerson | undefined } | undefined;
    remove: (guid: string) => void;
    printPerson: (guid: string) => string;
    printGroup: (guids: string[]) => string;
  };

  /**
   * Is the PersonManager initialized already?
   */
  const isInitialized = () => isInit;

  /**
   * Initialize the PersonManager
   * @param persons Set of persons
   */
  const init = (a: { [guid: string]: IPerson } = {}) => {
    if (isInit) { return; }
    persons = a;
    isInit = true;
  };

  /**
   * Get (a clone of) an person
   * @param guid
   */
  const get = (guid: string) => persons.hasOwnProperty(guid) ? Object.assign(<IPerson>{ id: guid }, persons[guid]) : undefined;

  /**
   * Get a list of (cloned) persons.
   * @param guid
   */
  const getGroup = (guids: string[]): IPerson[] => guids
    .filter(guid => persons.hasOwnProperty(guid) && persons[guid])
    .map(guid => Object.assign(<IPerson>{ id: guid }, persons[guid]));

  /**
   * Returns (a clone of) all persons;
   */
  const getAll = () => Object.assign({}, persons);

  /**
   * Replace an existing person with an updated version.
   *
   * @param {IPerson} person
   * @returns true if successfull, false otherwise.
   */
  const update = (person: IPerson) => {
    if (person.id && persons.hasOwnProperty(person.id)) {
      persons[person.id] = Object.assign({}, person, { id: '' }); // remove the id when storing it internally.
      return true;
    }
    return false;
  };

  /**
   * Add an person to the manager
   * @param person
   * @returns GUID of new person.
   */
  const add = (person: IPerson) => {
    const guid = makeGuid();
    persons[guid] = person;
    return guid;
  };

  /**
   * Remove an person from the manager
   * Actually, we set it to undefined, since deleting the activtiy is a slow operation.
   * @param guid
   */
  const remove = (guid: string) => {
    persons[guid] = undefined;
  };

  const printPerson = (guid: string) => {
    const person = get(guid);
    return person ? `${guid}:\n${Gender[person.gender]}, ${person.age}\nAGENDA\n${acitivityManager.printAgenda(person.agenda)}` : `Person with id ${guid} not found`;
  };

  const printGroup = (guids?: string[]) => guids ? '\n' + guids.map(guid => printPerson(guid)).join('\n') : ' - no agenda - ';

  const createInstance = () => {
    return { init, isInitialized, get, getGroup, getAll, add, update, remove, printPerson, printGroup };
  };

  const getInstance = () => {
    if (!instance) { instance = createInstance(); }
    return instance;
  };

  return { getInstance };
})();
