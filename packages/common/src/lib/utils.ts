import { IPerson, PersonRole } from './person';
import { Feature, Polygon } from 'GeoJSON';
import { IHousehold } from './household';

/**
 * Generate a sequence of numbers between from and to with step size: [from, to].
 *
 * @static
 * @param {number} from
 * @param {number} to : inclusive
 * @param {number} [count=to-from+1]
 * @param {number} [step=1]
 * @returns
 */
export const range = (from: number, to: number, count = to - from + 1, step = 1) => {
  // See here: http://stackoverflow.com/questions/3746725/create-a-javascript-array-containing-1-n
  // let a = Array.apply(null, {length: n}).map(Function.call, Math.random);
  const a: number[] = new Array(count);
  const min = from;
  const max = to - (count - 1) * step;
  const theRange = max - min;
  let x0 = Math.round(from + theRange * Math.random());
  for (let i = 0; i < count; i++) {
    a[i] = x0 + i * step;
  }
  return a;
};

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 *
 * @param {number} min
 * @param {number} max
 */
export const random = (min: number, max: number): number => {
  return min >= max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
};

export const clone = (org: Object) => {
  return JSON.parse(JSON.stringify(org));
};

/**
 * Shuffle the items randomly
 *
 * @static
 * @param {any[]} array
 * @returns a shuffled list of items
 * see also http://stackoverflow.com/a/2450976/319711
 */
export const shuffle = <T>(array: T[]) => {
  let currentIndex = array.length;
  let temporaryValue: T;
  let randomIndex: number;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};

// /**
//  * Create a key for persons so they can reference their household.
//  * Concatenate building ID and residence ID.
//  *
//  * @param {IHousehold} household
//  */
// export const householdKey = (household: IHousehold) => `${household.bId}-${household.rId}`;

/**
 * Convert a bounding box to a GeoJSON feature.
 *
 * @param {number[]} bbox
 * @returns
 */
export const bboxToFeature = (bbox: number[]) => {
  return <Feature<Polygon>>{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [bbox[0], bbox[1]],
        [bbox[2], bbox[1]],
        [bbox[2], bbox[3]],
        [bbox[0], bbox[3]],
        [bbox[0], bbox[1]]
      ]]
    }
  };
};

/**
 * Draw a random string from a list of strings.
 * In case the input is a single string, return that.
 *
 * @param {(string | string[])} str
 * @returns
 */
export const randomString = (str: string | string[]) => {
  if (!str) { throw new Error('No input defined!'); }
  let mode: string;
  if (str instanceof Array) {
    mode = str[random(0, str.length - 1)];
  } else {
    mode = str;
  }
  return mode;
};

export const isUnemployed = (person: IPerson) => person.roles.filter(p => p.role === PersonRole.employee).length === 0;

export const childrenInHousehold = (household: IHousehold) => household.persons.filter(p => p.roles[0].role === PersonRole.child);

export const householdHasChildren = (household: IHousehold) => childrenInHousehold.length > 0;
