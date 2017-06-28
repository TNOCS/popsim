import { Operator } from './operator';

/**
 * Rule condition, should evaluate to either true or false.
 * For example: age < 15, where:
 *  property: age
 *  operator: <
 *  operand: 15
 *
 * @export
 * @interface ICondition
 */
export interface ICondition {
  /**
   * Key of the property to check.
   *
   * @type {string}@memberof ICondition
   */
  property: string;
  /**
   * Condition operator, e.g. < or 'EXISTS'.
   *
   * @type {Operator}@memberof ICondition
   */
  operator: Operator;
  /**
   * If the operand is missing, we just check for the presence of the property.
   *
   * @type {(number | string)}@memberof ICondition
   */
  operand?: number | string | boolean;
}
