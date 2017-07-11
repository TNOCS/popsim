import { IRule } from './rule';
import { IState } from './state';
import { ICondition } from './condition';
import { IRuleSet } from './rule-set';
import { Action, IActionOptions } from './action';

/**
 * Rule evaluation function, which takes an object and returns a value.
 * It supplies the methods to evaluate condition properties which are not an inherent part of the original object.
 */
export type RuleEvaluator = (state: IState) => number | string | boolean;

/**
 * The rule engine factury returns a rule engine which evaluates all rules, optionally
 * using the evaluators to determine missing properties, and executes appropriate actions
 * if the rule conditions evaluate to true.
 *
 * The actions which can be invoked need to be supplied in the constructor.
 * If the required action is a boolean, the handler will be called instead.
 *
 * @param {IRuleSet} ruleSet An set of rules
 * @param {{ [name: string]: Action }} actions Action handlers
 * @param {{ [property: string]: RuleEvaluator }} [evaluators] Dedicated functions to resolve unknown properties of the object
 * @returns
 */
export const RuleEngineFactory = <T extends IState, U extends IActionOptions>(ruleSet: IRuleSet,
  actions: { [name: string]: Action },
  evaluators?: { [property: string]: RuleEvaluator }) => {

  /**
   * Evaluate a condition and return true (condition is fulfilled) or false.
   *
   * @param {IState} state
   * @param {ICondition} condition
   * @returns
   */
  const evalCondition = (state: IState, condition: ICondition) => {
    const prop = state.hasOwnProperty(condition.property)
      ? state[condition.property]
      : evaluators && evaluators.hasOwnProperty(condition.property)
        ? evaluators[condition.property](state)
        : undefined;
    if (typeof prop === 'undefined') {
      if (condition.operand === 'EXISTS') { return true; }
      if (condition.operand === 'DOES_NOT_EXIST') { return false; }
      throw new Error(`Error evaluating condition ${JSON.stringify(condition, null, 2)}: Unknown property!`);
    }
    const operand = condition.operand || false;
    switch (condition.operator) {
      case '<':
        return prop < operand;
      case '<=':
        return prop <= operand;
      case '>':
        return prop > operand;
      case '>=':
        return prop >= operand;
      case '===':
        // tslint:disable-next-line:triple-equals
        return prop == operand;
      case '!==':
        // tslint:disable-next-line:triple-equals
        return prop != operand;
      default:
        throw new Error(`Error evaluating condition ${JSON.stringify(condition, null, 2)}: Unknown operator!`);
    }
  };

  const triggerAction = (state: T, actionName: string, options?: U) => {
    if (!actions.hasOwnProperty(actionName)) {
      console.warn(`Warning: Cannot resolve action ${actionName}.`);
      return;
    }
    const action = actions[actionName];
    action(Object.assign({}, state), options); // Pass a copy of the state to the action, so the handler cannot change it.
  };

  const processRule = (state: IState, rule: IRule) => {
    return rule.combinator === 'OR'
      ? rule.conditions.reduce((prev, cur) => {
        return prev || evalCondition(state, cur);
      }, false)
      : rule.conditions.reduce((prev, cur) => {
        return prev && evalCondition(state, cur);
      }, true);
  };

  /**
   * Process all the rules
   *
   * @param {T} state
   * @returns how many rules were triggered.
   */
  const processRules = (state: T) => {
    let rulesTriggeredCount = 0;
    ruleSet.policy === 'first'
      ? ruleSet.rules.some(r => {
        const evaluationResult = processRule(state, r);
        if (evaluationResult === true) {
          rulesTriggeredCount++;
          triggerAction(state, r.action, <U>r.actionProperties);
        }
        return evaluationResult;
      })
      : ruleSet.rules.forEach(r => {
        const evaluationResult = processRule(state, r);
        if (evaluationResult === true) {
          rulesTriggeredCount++;
          triggerAction(state, r.action, <U>r.actionProperties);
        }
      });
    return rulesTriggeredCount;
  };

  return {
    /**
     * Process all the rules
     *
     * @param {IState} state
     * @returns how many rules were triggered.
     */
    run: (state: T) => {
      return processRules(Object.assign({}, state));
    }
  };
};
