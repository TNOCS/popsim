import { IWorkplace, IPopulationMsg } from '@popsim/common';
import { IBuildingFeatureCollection } from '@popsim/common';

export class WorkforceService {
  constructor(private bag: IBuildingFeatureCollection, private pop: IPopulationMsg) {}

  public getWorkforceAsync() {
    return new Promise<IWorkplace[]>((resolve) => {
      // const groupedHouseholds = this.createHouseholds();
      // const population = this.createPopulation();
      // const households = this.assignPeopleToHouseholds(groupedHouseholds, population);
      // resolve(households);
    });
  }
}
