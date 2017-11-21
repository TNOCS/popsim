import { IState } from './state';

/**
 * Options for the Action.
 *
 * @export
 * @interface IActionOptions
 */
export interface IActionOptions {
  [key: string]: string | string[] | number | number[] | boolean | IActionOptions;
}

/**
 * Specifies a function that can be invoked when a rule is triggered.
 */
export type Action<T extends IState, U extends IActionOptions> = (state: T, options: U) => void;
