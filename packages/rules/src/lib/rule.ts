import { IActionOptions } from './action';
import { ICondition } from './condition';
import { ConditionCombinator } from './condition-combinator';

/**
 * Rule interface.
 *
 * @export
 * @interface IRule
 */
export interface IRule {
  /**
   * Optional ID.
   *
   * @type {(string | number)}@memberof IRule
   */
  id?: string | number;

  /**
   * Specifies how to combine multiple conditions, if any.
   *
   * @type {ConditionCombinator}@memberof IRule
   */
  combinator: ConditionCombinator;

  /**
   * Key to the action to invoke when the rule is triggered.
   * The rule engine should receive, upon initialisation, an object with functions that can be invoked.
   *
   * @type {string}@memberof IRule
   */
  action: string;

  /**
   * Optional options that can be passed to an action.
   *
   * @type {IActionOptions}@memberof IRule
   */
  actionProperties?: IActionOptions;

  /**
   * Conditions that must be fulfilled in order to trigger the rule.
   *
   * @type {ICondition[]}@memberof IRule
   */
  conditions: ICondition[];

  /**
   * Optional description.
   *
   * @type {string}@memberof IRule
   */
  description?: string;
}
