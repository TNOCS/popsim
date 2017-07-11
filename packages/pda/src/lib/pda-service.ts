import { AgendaForChild } from './agenda-for-child';
import { AgendaForSingle } from './agenda-for-single';
import { getChildren, ISimRequestMessage, IPopulationMsg, IPerson, isParent, isSingle } from '@popsim/common';
import { AgendaForParent } from './agenda-for-parent';

export class PdaService {
  constructor(private sim: ISimRequestMessage, private pop: IPopulationMsg) { }

  public createAgendasAsync() {
    return new Promise<IPerson[]>((resolve) => {
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
    const persons: IPerson[] = [];

    const simStartTime = new Date(this.sim.simulationStartTime);
    const simEndTime = new Date(this.sim.simulationEndTime);

    const agendaForChild = AgendaForChild(simStartTime, simEndTime);
    const agendaForParent = AgendaForParent(simStartTime, simEndTime);
    const agendaForSingle = AgendaForSingle(simStartTime, simEndTime);

    this.pop.households.forEach(h => {
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
      agendaForSingle(p);
    });

    return persons;
  }
}
