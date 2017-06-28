import { IRule } from './rule';
import { RuleEvaluationPolicy } from './rule-evaluation-policy';

export interface IRuleSet {
  /**
   * Optional description.
   *
   * @type {string}@memberof IRuleSet
   */
  description?: string;

  /**
   * Specifies how we want to evaluate the rules: should we only process the first, or all.
   *
   * @type {RuleEvaluationPolicy}@memberof IRuleSet
   */
  policy: RuleEvaluationPolicy;

  /**
   * Rules that make up this rule set.
   *
   * @type {IRule[]}@memberof IRuleSet
   */
  rules: IRule[];
}
