/**
 * Interface to denote any object that we rule engine can process.
 *
 * @export
 * @interface IState
 */
export interface IState {
  [key: string]: number | string | boolean | Object | Object[];
};
