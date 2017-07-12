import { AgendaForChild } from './agenda-for-child';
import { AgendaForSingle } from './agenda-for-single';
import { getChildren, ISimRequestMessage, IPopulationMsg, IPerson, isParent, isSingle, PersonManager } from '@popsim/common';
import { AgendaForParent } from './agenda-for-parent';

export class PdaService {
  constructor(private sim: ISimRequestMessage, private pop: IPopulationMsg) { }

  public createAgendasAsync() {
    // return new Promise<{ persons: { [guid: string]: IPerson | undefined }, activities: { [guid: string]: IActivity | undefined } }>((resolve) => {
    return new Promise<{ [guid: string]: IPerson | undefined }>((resolve) => {
      const persons = this.createAgendas();
      resolve(persons);
    });
  }

  /**
   * Creates agendas for our population.
   *
   * @private
   * @returns
   *
   * @memberof PdaService
   */
  private createAgendas() {
    const personManager = PersonManager.getInstance();

    const simStartTime = new Date(this.sim.simulationStartTime);
    const simEndTime = new Date(this.sim.simulationEndTime);

    const agendaForChild = AgendaForChild(simStartTime, simEndTime);
    const agendaForParent = AgendaForParent(simStartTime, simEndTime);
    const agendaForSingle = AgendaForSingle(simStartTime, simEndTime);

    this.pop.households.forEach(h => {
      h.persons.forEach(p => p.id = personManager.add(p));
      const children = getChildren(h);
      children.forEach(child => agendaForChild(child, h));
      h.persons.forEach(p => {
        if (isParent(p)) {
          agendaForParent(p, h);
        } else if (isSingle(p)) {
          agendaForSingle(p);
        }
      });
    });

    this.pop.others.forEach(p => {
      p.id = personManager.add(p);
      agendaForSingle(p);
    });

    return personManager.getAll();
  }
}
