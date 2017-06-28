# Rule engine module

A simple rule engine that allows you to perform any action when certain conditions are met.

## Introduction

Using the `RuleEngineFactory`, you create a rule engine: supply it with the `IRule` rules, a list of action functions, and, optionally, a list of property resolvers, and it returns a new rule engine. This rule engine can subsequently be used to execute one or more of the actions in the supplied list of actions.

## Usage

For example, assume that you want to see whether you need to bring your child to school (or that it will go by himself). Further assume that this is dependend on the child's age, as you don't expect a todler to go their himself, and the distance to school.

We create the following set of rules (`IRuleSet`):

```js
accompanyChildToSchool: {
  policy: first,
  rules: [{
    action: "bringToSchool",
    conditions: [{
      property: "age",
      operator: "<",
      operand: 10
    }]
  }, {
    action: "bringToSchool",
    combinator: AND,
    conditions: [{
      property: "age",
      operator: "<",
      operand: 12
    }, {
      property: "distance",
      operator: ">",
      operand: 1000
    }]
  }, {
    action: "bringToSchool",
    conditions: [{
      property: "distance",
      operator: ">",
      operand: 5000
    }]
  }]
}
```

As you can see, in this case, each rule has the same action, `bringToSchool`. As the policy is `first`, as opposed to `all`, we stop evaluating the rules as soon as a rule is executed (we only need to bring the child once). The first rule has a simple condition, checking if its age is < 10. The second rule checks if the age < 12 and the distance to school > 1000 meter. The final rule specifies that we bring a child to school if the distance exceeds 5000 meters.

Now, create a rule engine that can perform this logic:

```ts
// Create the actions:
// Note that we can receive IActionOptions if we specify them in the rule (optional property `actionOptions`)
const actions: { [key: string]: Action } = {
  bringToSchool: (state: IState, options?: IActionOptions) => {
      console.log('Bring me to school');
    }
  });
const bringToSchoolRuleEngine = RuleEngineFactory(accompanyChildToSchool, actions);

bringToSchoolRuleEngine.run({ age: 5, distance: 10000 }); // console logs: 'Bring me to school'
bringToSchoolRuleEngine.run({ age: 11, distance: 10000 }); // console logs: 'Bring me to school'
bringToSchoolRuleEngine.run({ age: 13, distance: 100 }); // console logs nothing
```
