import { range, random, shuffle, householdKey } from '@popsim/common';
import { IHousehold, HouseholdType, IBuildingProps, ICensusProps } from '@popsim/common';
import { IPerson, Gender, PersonRole, IPopulation, IChildDistribution } from '@popsim/common';
import { FeatureCollection, GeometryObject } from 'geojson';
import { config } from './configuration';

const log = config.logging ? console.log : () => undefined;

/**
 * Create a population by distributing the people (statistics) over the buildings.
 * - Creates persons with a household and relationships
 *
 * Based on Combinatorial Optimisation (CO) techniques.
 * 1. Use national data to create (5x more than needed) households => group of persons
 * 2. Houses are filled with households
 * 3. Compute the error w.r.t. local data, and iteratively swap households to reduce the error
 *
 * Alternative approach
 * 1. Use local data to create households.
 * 2. Assign households to houses
 * 3. Try to fix errors, e.g. empty houses or too many households
 *
 * @export
 * @class PopulationService
 */
export class PopulationService {
  constructor(private stats: FeatureCollection<GeometryObject>, private buildings: FeatureCollection<GeometryObject>) { }

  public async getPopulationAsync() {
    return new Promise<IHousehold[]>((resolve) => {
      const groupedHouseholds = this.createHouseholds();
      const population = this.createPopulation();
      const households = this.assignPeopleToHouseholds(groupedHouseholds, population);
      resolve(households);
    });
  }

  /**
   * Creates households for our population.
   *
   * @private
   * @returns
   *
   * @memberof PopulationService
   */
  private createHouseholds() {
    const hhDist = config.guesstimates.householdDistribution;
    const households = hhDist.map(hh => { return <IHousehold[]>[]; });
    const areaToIndexFunc = () => {
      const areas = hhDist.map(hh => hh.maxAreaM2);
      const last = hhDist.length - 1;
      return (area: number) => {
        const i = areas.findIndex(a => area <= a);
        return i === -1 ? last : i;
      };
    };
    const areaToIndex = areaToIndexFunc();
    this.buildings.features.forEach(f => {
      const props = <IBuildingProps>f.properties;
      if (!props || props.aant_won === 0) { return; }
      props.won_opp.filter(w => w > 0).forEach((w, i) => {
        households[areaToIndex(w)].push(<IHousehold>{
          bId: props.id,
          rId: i,
          area: w,
          householdType: HouseholdType.unknown,
          persons: []
        });
      });
    });
    return households;
  }

  /**
   * Convert the population statistics to persons and households.
   * For now, just use the average population in the selected area. To improve it, we could do it for each neighbourhood
   * separately.
   *
   * @private
   * @returns {IPerson[]}
   *
   * @memberof PopulationService
   */
  private createPopulation() {
    const stats = config.statistics;
    const sp = stats.singleParent;
    const p = stats.pairs;
    const props = <ICensusProps>this.stats.features[0].properties;
    log(JSON.stringify(props, null, 2));

    const spMother = sp.aloneWithMother.boy + sp.aloneWithMother.girl;
    const spFather = sp.aloneWithFather.boy + sp.aloneWithFather.girl;
    /** Percentage of single parents that is female */
    const spFemalePerc = spMother / (spMother + spFather);

    const spBoy = sp.aloneWithMother.boy + sp.aloneWithFather.boy;
    const spGirl = sp.aloneWithMother.girl + sp.aloneWithFather.girl;
    /** Percentage of single parents that has boys */
    const spHavingBoysPerc = spBoy / (spBoy + spGirl);

    // const malePerc = props.aant_man / props.aant_inw;
    let totMale = props.aant_man;
    let totFemale = props.aant_vrouw;

    // Start with relationships (households w/o children, ignoring homosexuals)
    const relationships = props.aant_hh_z_k;
    totMale -= relationships;
    totFemale -= relationships;

    // Households with children, i.e. pairs and single parents
    const singleParent = Math.round(props.aant_hh_m_k * stats.singleParentPerc / 100);
    const pairs = props.aant_hh_m_k - singleParent;
    const femaleSingleParent = Math.round(singleParent * spFemalePerc / 100);
    const maleSingleParent = singleParent - femaleSingleParent;
    totMale -= maleSingleParent + pairs;
    totFemale -= femaleSingleParent + pairs;

    // Compute how many children we have to assign
    const children = (totMale + totFemale) - props.aant_eenp_hh;
    // 0.4 = percentage of children <= 18 assuming a uniform distribution, multiply by .5 to compensate for students
    // const childrenExpected = Math.round(props.aant_00_14_jr + 0.5 * 0.4 * props.aant_15_24_jr);
    // const deltaChildren = children - childrenExpected;
    const spChildrenFunc = (f: number) => Math.round(singleParent * (sp.oneChild + 2 * sp.twoChildren + sp.threeOrMoreFactor * f * sp.threeOrMoreChildren) / 100);
    const pChildrenFunc = (f: number) => Math.round(pairs * (p.oneChild + 2 * p.twoChildren + p.threeOrMoreFactor * f * p.threeOrMoreChildren) / 100);
    // Tweak the household size for hh with > 3 children (factor f) so all children get assigned
    // singleParent * (sp.oneChild + 2 * sp.twoChildren + sp.threeOrMoreFactor * f * sp.threeOrMoreChildren) + pairs * (p.oneChild + 2 * p.twoChildren + p.threeOrMoreFactor * f * p.threeOrMoreChildren) = 100 * children
    // singleParent * (sp.oneChild + 2 * sp.twoChildren) + pairs * (p.oneChild + 2 * p.twoChildren) + (singleParent * sp.threeOrMoreFactor * sp.threeOrMoreChildren + pairs * p.threeOrMoreFactor * p.threeOrMoreChildren) * f = 100 * children
    // (singleParent * sp.threeOrMoreFactor * sp.threeOrMoreChildren + pairs * p.threeOrMoreFactor * p.threeOrMoreChildren) * f = 100 * children - singleParent * (sp.oneChild + 2 * sp.twoChildren) - pairs * (p.oneChild + 2 * p.twoChildren)
    // f = (100 * children - singleParent * (sp.oneChild + 2 * sp.twoChildren) - pairs * (p.oneChild + 2 * p.twoChildren)) / (singleParent * sp.threeOrMoreFactor * sp.threeOrMoreChildren + pairs * p.threeOrMoreFactor * p.threeOrMoreChildren)
    const tweakThreeOrMoreFactor = (100 * children - singleParent * (sp.oneChild + 2 * sp.twoChildren) - pairs * (p.oneChild + 2 * p.twoChildren)) / (singleParent * sp.threeOrMoreFactor * sp.threeOrMoreChildren + pairs * p.threeOrMoreFactor * p.threeOrMoreChildren);
    // Assign children: single parents (ignore possible distinction between fathers and mothers)
    const spChildren = spChildrenFunc(tweakThreeOrMoreFactor);
    // Assign children: pairs
    const pChildren = pChildrenFunc(tweakThreeOrMoreFactor);
    const spBoys = Math.round(spHavingBoysPerc * spChildren);
    const spGirls = spChildren - spBoys;
    const boysUnder20Perc = stats.male.under20 / (stats.male.under20 + stats.female.under20);
    const pBoys = Math.round(boysUnder20Perc * pChildren);
    const pGirls = pChildren - pBoys;
    const boys = spBoys + pBoys;
    const girls = spGirls + pGirls;
    totMale -= boys;
    totFemale -= girls;

    // Finish with assigning singles
    const maleSingles = totMale;
    const femaleSingles = totFemale;
    totMale -= maleSingles;
    totFemale -= femaleSingles;
    // Finally, assign children to the parents
    const singleParentChildren = <IChildDistribution>{
      count: spChildren,
      oneChild: {
        male: Math.round(spBoys * sp.oneChild / 100),
        female: Math.round(spGirls * sp.oneChild / 100)
      },
      twoChildren: {
        male: Math.round(spBoys * sp.twoChildren / 100),
        female: Math.round(spGirls * sp.twoChildren / 100)
      },
      threeOrMoreChildren: {
        male: Math.round(spBoys * (100 - sp.oneChild - sp.twoChildren) / 100),
        female: Math.round(spGirls * (100 - sp.oneChild - sp.twoChildren) / 100)
      }
    };
    const pairsChildren = <IChildDistribution>{
      count: pChildren,
      oneChild: {
        male: Math.round(pBoys * p.oneChild / 100),
        female: Math.round(pGirls * p.oneChild / 100)
      },
      twoChildren: {
        male: Math.round(pBoys * p.twoChildren / 100),
        female: Math.round(pGirls * p.twoChildren / 100)
      },
      threeOrMoreChildren: {
        male: Math.round(pBoys * (100 - p.oneChild - p.twoChildren) / 100),
        female: Math.round(pGirls * (100 - p.oneChild - p.twoChildren) / 100)
      }
    };
    const age = (...ranges: { minAge: number, maxAge: number, count: number }[]) => {
      const total = ranges.reduce((prev, cur) => prev + cur.count, 0);
      const ageDistributions = ranges.map(r => r.count / total);
      return () => {
        const r = Math.random();
        let index = 0;
        ageDistributions.some((a, i) => {
          if (r > a) { return false; }
          index = i;
          return true;
        });
        const range = ranges[index];
        return random(range.minAge, range.maxAge);
      };
    };
    const adultAge = age(
      { minAge: 18, maxAge: 24, count: props.aant_15_24_jr * 0.8 },
      { minAge: 25, maxAge: 44, count: props.aant_25_44_jr },
      { minAge: 45, maxAge: 64, count: props.aant_45_64_jr },
      { minAge: 65, maxAge: 84, count: props.aant_65_eo_jr }
    );
    const adultWithChildrenAge = age(
      { minAge: 18, maxAge: 24, count: props.aant_15_24_jr * 0.8 * 0.2 },
      { minAge: 25, maxAge: 44, count: props.aant_25_44_jr },
      { minAge: 45, maxAge: 64, count: props.aant_45_64_jr }
    );
    const childAge = age(
      { minAge: 0, maxAge: 14, count: props.aant_00_14_jr },
      { minAge: 18, maxAge: 24, count: props.aant_15_24_jr * 0.2 }
    );
    const personsChildren: IPerson[] =
      range(1, boys).map(() => {
        return <IPerson>{
          age: childAge(),
          gender: Gender.male,
          roles: [PersonRole.child]
        };
      }).concat(range(1, girls).map(() => {
        return <IPerson>{
          age: childAge(),
          gender: Gender.female,
          roles: [PersonRole.child]
        };
      }));
    const personsSingle: IPerson[] =
      range(1, maleSingles).map(() => {
        return <IPerson>{
          age: adultAge(),
          gender: Gender.male,
          roles: [PersonRole.single]
        };
      }).concat(range(1, femaleSingles).map(() => {
        return <IPerson>{
          age: adultAge(),
          gender: Gender.female,
          roles: [PersonRole.single]
        };
      }));
    const personsInRelationship: IPerson[] =
      range(1, relationships).map(() => {
        return <IPerson>{
          age: adultWithChildrenAge(),
          gender: Gender.male,
          roles: [PersonRole.father]
        };
      }).concat(range(1, relationships).map(() => {
        return <IPerson>{
          age: adultAge(),
          gender: Gender.female,
          roles: [PersonRole.mother]
        };
      }));
    const personsPairs: IPerson[] =
      range(1, pairs).map(() => {
        return <IPerson>{
          age: adultAge(),
          gender: Gender.male,
          roles: [PersonRole.father]
        };
      }).concat(range(1, pairs).map(() => {
        return <IPerson>{
          age: adultWithChildrenAge(),
          gender: Gender.female,
          roles: [PersonRole.mother]
        };
      }));
    const personsSingleParent: IPerson[] =
      range(1, maleSingleParent).map(() => {
        return <IPerson>{
          age: adultAge(),
          gender: Gender.male,
          roles: [PersonRole.father]
        };
      }).concat(range(1, femaleSingleParent).map(() => {
        return <IPerson>{
          age: adultAge(),
          gender: Gender.female,
          roles: [PersonRole.mother]
        };
      }));
    return <IPopulation>{
      children: personsChildren,
      singles: personsSingle,
      relationships: personsInRelationship,
      pairs: personsPairs,
      singleParents: personsSingleParent,
      singeParentChildDistribution: singleParentChildren,
      pairsChildDistribution: pairsChildren
    };
  }

  private assignPeopleToHouseholds(groupedHouseholds: IHousehold[][], pop: IPopulation) {
    const hhDist = config.guesstimates.householdDistribution;
    const totalResidences = groupedHouseholds.reduce((prev, cur) => prev + cur.length, 0);
    const totalHouseholds = pop.singles.length + pop.relationships.length / 2 + pop.pairs.length / 2 + pop.singleParents.length;
    // If you have 1700 hh, and 1800 residences, only 17/18 residencies will be used.
    // const percResidencesUsed = Math.min(1, totalHouseholds / totalResidences);
    if (totalHouseholds > totalHouseholds) { log(`WARNING: We need more residences (res: ${totalResidences}, hh: ${totalHouseholds})`); }
    const addChildren = (personCount: number, childCount: 1 | 2 | 3, persons: IPerson[], children: IPerson[]) => {
      let addedChildren = 0;
      switch (childCount) {
        case 1:
          const c1 = children.shift();
          if (c1) { persons.push(c1); addedChildren++; };
          break;
        case 2:
          const c21 = children.shift();
          if (c21) { persons.push(c21); addedChildren++; };
          if (personCount < children.length) {
            const c22 = children.shift();
            // Ignore that children may have the same age (assume twins etc.)
            if (c22) { persons.push(c22); addedChildren++; };
          }
          break;
        default:
          const c31 = children.shift();
          if (c31) { persons.push(c31); addedChildren++; };
          if (personCount < children.length) {
            const c = children.shift();
            if (c) { persons.push(c); addedChildren++; };
          }
          if (personCount < children.length) {
            const c = children.shift();
            if (c) { persons.push(c); addedChildren++; };
          }
          break;
      }
      return addedChildren;
    };
    const findSuitablePartner = (person: IPerson, persons: IPerson[]) => {
      if (persons.length === 0) {
        console.error('WARNING, no more persons to use as partner!');
        return undefined;
      }
      let ageDifference: number;
      let index: number;
      let retries = 10;
      do {
        retries--;
        index = random(Math.floor(persons.length / 2), persons.length - 1); // woman are placed in the second half
        let partner = persons[index];
        ageDifference = (person.gender !== partner.gender) ? Math.abs(person.age - partner.age) : Number.MAX_VALUE;
      } while (retries >= 0 && ageDifference < 8);
      return persons.splice(index, 1)[0];
    };

    // Assign count people to households (removing them from the original object!)
    const p2hh = (count: number, type: HouseholdType, hh: IHousehold[], p: IPerson[], pair = false, children?: IPerson[], childCount = 0, childCountFunc?: () => 1 | 2 | 3) => {
      const assignedHouseholds = <IHousehold[]>[];
      let person: IPerson | undefined;
      do {
        count--;
        const ih = random(0, hh.length - 1);
        const household = hh.splice(ih, 1)[0];
        household.householdType = type;
        person = p.shift();
        if (person) {
          household.persons.push(person);
          person.householdId = householdKey(household);
          if (pair) {
            person = findSuitablePartner(person, p);
            if (person) { household.persons.push(person); }
          }
          if (children && childCountFunc) {
            const cc = childCountFunc();
            childCount -= addChildren(count, cc, household.persons, children);
          }
        }
        assignedHouseholds.push(household);
      } while (count > 0 && hh.length > 0 && p.length > 0);
      if (children && children.length && childCount > 0) {
        // Assign remaining children to households that already have 3 or more.
        do {
          let index: number;
          let personsInHH: IPerson[];
          let nmbrOfChildren: number;
          do {
            // randomly select a household, count its children, and add children to them if they already have 3
            index = random(0, assignedHouseholds.length - 1);
            personsInHH = assignedHouseholds[index].persons;
            nmbrOfChildren = personsInHH.filter(pp => pp.roles.indexOf(PersonRole.child) >= 0).length;
          } while (nmbrOfChildren < 3);
          childCount -= addChildren(-1, 1, personsInHH, children);
        } while (childCount > 0 && children.length > 0);
      }
      return assignedHouseholds;
    };
    const children = shuffle(pop.children);
    const singleParents = shuffle(pop.singleParents);

    // Requested households vs available households
    const requestedHouseholds = <{
      requested: number;
      available: number;
      pairs: number;
      singles: number;
      relationships: number;
      singleParents: number;
    }[]>[];
    groupedHouseholds.forEach((hh, i) => {
      const dist = hhDist[i];
      const req = {
        requested: 0,
        pairs: Math.round(pop.pairs.length * dist.pairs / 100),
        singles: Math.round(pop.singles.length * dist.singles / 100),
        relationships: Math.round(pop.relationships.length * dist.relationships / 100),
        singleParents: Math.round(pop.singleParents.length * dist.singleParents / 100),
        available: hh.length
      };
      req.requested = Math.round((req.pairs + req.relationships) / 2) + req.singles + req.singleParents;
      requestedHouseholds.push(req);
    });
    // check availability of households
    const surplus = requestedHouseholds.map(r => r.available - r.requested);
    const needsReallocation = surplus.filter(s => s < 0);
    if (needsReallocation.length > 0) {
      const isIssue = surplus.reduce((p, c) => p + c, 0);
      if (isIssue < 0) { console.error('WARNING: we need more households than available!'); }
      // positive delta values indicate new persons/assignments, negative means taking people away
      const delta: number[] = surplus.map(s => 0);
      surplus.forEach((s, j) => {
        if (s >= 0) { return; }
        // shortage: reallocate persons one by one, assigning them to where most space is available
        for (let d = -s; d >= 0; d--) {
          // const actualSituation = surplus.map((t, i) => t - delta[i] <= 0 ? 0 : t - delta[i]);
          const largestSpace = surplus.reduce((p, c, i) => {
            const curDelta = c - delta[i];
            return curDelta > p.d ? { d: curDelta, i: i } : p;
          }, { d: 0, i: 0 });
          delta[j]--;
          delta[largestSpace.i]++;
        }
      });
      // adjust requestedHouseholds by reassigning people: first, remove them
      const adjustments = { singles: 0, singleParents: 0, relationships: 0, pairs: 0 };
      requestedHouseholds.forEach((r, i) => {
        if (delta[i] > 0) { return; }
        const t = r.requested;
        const cumDistribution = [r.singles / t, r.singleParents / t, r.relationships / t, r.pairs / t]
          .map((d, j, arr) => d + (j === 0 ? 0 : arr[j - 1]));
        for (let k = -delta[i]; k >= 0; k--) {
          const rand = Math.random();
          const selection = cumDistribution.findIndex(v => rand < v);
          switch (selection) {
            default:
            case 0:
              adjustments.singles++;
              r.singles--;
              break;
            case 1:
              adjustments.singleParents++;
              r.singleParents--;
              break;
            case 2:
              adjustments.relationships++;
              r.relationships--;
              break;
            case 3:
              adjustments.pairs++;
              r.pairs--;
              break;
          }
          r.requested--;
        }
      });
      // Assign people to their new groups

      requestedHouseholds.forEach((r, i) => {
        if (delta[i] < 0) { return; }
        const t = r.requested;
        const cumDistribution = [r.singles / t, r.singleParents / t, r.relationships / t, r.pairs / t]
          .map((d, j, arr) => d + (j === 0 ? 0 : arr[j - 1]));
        for (let k = 0; k < delta[i]; k++) {
          let s: number;
          let available: number;
          do {
            const rand = Math.random();
            s = cumDistribution.findIndex(v => rand < v);
            available = s === 0 ? adjustments.singles : s === 1 ? adjustments.singleParents : s === 2 ? adjustments.relationships : adjustments.pairs;
          } while (available > 0);
          switch (s) {
            default:
            case 0:
              adjustments.singles--;
              r.singles++;
              break;
            case 1:
              adjustments.singleParents--;
              r.singleParents++;
              break;
            case 2:
              adjustments.relationships--;
              r.relationships++;
              break;
            case 3:
              adjustments.pairs--;
              r.pairs++;
              break;
          }
          r.requested++;
        }
      });
    }

    let singlesHH = <IHousehold[]>[];
    let relationshipsHH = <IHousehold[]>[];
    let pairsHH = <IHousehold[]>[];
    let spHH = <IHousehold[]>[];
    groupedHouseholds.forEach((hh, i) => {
      const req = requestedHouseholds[i];
      const singlesCount = req.singles;
      const singleParentsCount = req.singleParents;
      const pairsCount = req.pairs;
      const relationshipsCount = req.relationships;
      singlesHH = singlesHH.concat(p2hh(singlesCount, HouseholdType.single, hh, pop.singles));
      relationshipsHH = relationshipsHH.concat(p2hh(Math.floor(relationshipsCount / 2), HouseholdType.relationship, hh, pop.relationships, true));
      const childCount = (cd: IChildDistribution) => {
        const totalChildren =
          (cd.oneChild.male + cd.oneChild.female) +
          (cd.twoChildren.male + cd.twoChildren.female) +
          (cd.threeOrMoreChildren.male + cd.threeOrMoreChildren.female);
        const childrenPerc = [
          (cd.oneChild.male + cd.oneChild.female) / totalChildren,
          (cd.twoChildren.male + cd.twoChildren.female) / totalChildren,
          (cd.threeOrMoreChildren.male + cd.threeOrMoreChildren.female) / totalChildren];
        return () => {
          const r = Math.random();
          return r < childrenPerc[0] ? 1 : r < childrenPerc[1] ? 2 : 3;
        };
      };
      let childrenToAssign = Math.round((pairsCount / pop.pairs.length) * pop.pairsChildDistribution.count);
      pairsHH = pairsHH.concat(p2hh(Math.floor(pairsCount / 2), HouseholdType.pair, hh, pop.pairs, true, children, childrenToAssign, childCount(pop.pairsChildDistribution)));
      childrenToAssign = Math.round((singleParentsCount / pop.singleParents.length) * pop.singeParentChildDistribution.count);
      spHH = spHH.concat(p2hh(singleParentsCount, HouseholdType.singleParent, hh, singleParents, false, children, childrenToAssign, childCount(pop.singeParentChildDistribution)));
    });

    return singlesHH
      .concat(relationshipsHH)
      .concat(pairsHH)
      .concat(spHH);
  }
}
