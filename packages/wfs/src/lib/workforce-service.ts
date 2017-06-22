import { Point } from 'geojson';
import * as area from '@turf/area';
import * as distance from '@turf/distance';
import { IBuildingFeatureCollection, IBuildingProps, bboxToFeature, range, random, WorkplaceType, ILocation, IWorkplace, IPopulationMsg, IPerson, Gender, PersonRole, LocationType, RelationType, IRoleAtLocation } from '@popsim/common';
import { config } from './configuration';

export class WorkforceService {
  constructor(private buildings: IBuildingFeatureCollection, private pop: IPopulationMsg) {
    if (!this.pop.others) { this.pop.others = []; }
  }

  public getWorkforceAsync() {
    return new Promise<IWorkplace[]>((resolve) => {
      const workplaces = this.createWorkplaces();
      resolve(workplaces);
    });
  }

  /**
   * Compute the probability that we have a local worker.
   *
   * It is based on the propertion of the total area vs the travelling distance.
   * y = ax + b
   * where
   * y is the probability,
   * x is the totalArea/travellingArea
   *
   * And we assume two points x, y: (0.1, 0.2) and (10, 0.9) => a = 0.071 and b = 0.193;
   *
   * @private
   * @param {number} totalArea
   * @param {number} travellingDistance
   * @returns
   *
   * @memberof WorkforceService
   */
  private probabilityOfLocalPersons(totalArea: number, travellingDistance: number) {
    const proportion = totalArea / Math.PI * (1000 * travellingDistance);
    return proportion > 10 ? 0.9 : proportion < 0.1 ? 0.2 : 0.071 * proportion + 0.193;
  }

  /**
   * Creates work areas for our population.
   *
   * @private
   * @returns
   *
   * @memberof WorkforceService
   */
  private createWorkplaces() {
    const bbox = this.buildings.bbox || [5, 50, 6, 52];
    const totalArea = area(bboxToFeature(bbox));
    const workplaces: IWorkplace[] = [];

    const probMenWorkingLocally = this.probabilityOfLocalPersons(totalArea, config.statistics.travellingDistance.avgKm.men);
    const probWomenWorkingLocally = this.probabilityOfLocalPersons(totalArea, config.statistics.travellingDistance.avgKm.women);
    const probMaleFemaleWorker = config.statistics.maleFemaleWorkerPerc / 100;
    const probMenVisitingLocally = this.probabilityOfLocalPersons(totalArea, config.statistics.visitingDistance.avgKm.men);
    const probWomenVisitingLocally = this.probabilityOfLocalPersons(totalArea, config.statistics.visitingDistance.avgKm.women);
    const probMaleFemaleVisitor = config.statistics.maleFemaleVisitorPerc / 100;

    const findLocalPerson = (isMale: boolean, personFilter?: (p: IPerson) => boolean) => {
      const gender = isMale ? Gender.male : Gender.female;
      let tries = 10;
      do {
        tries--;
        const hh = this.pop.households[random(0, this.pop.households.length - 1)];
        const persons = hh.persons.filter(personFilter || (p => p.gender === gender && p.age > 17));
        if (persons.length > 0) {
          return persons[random(0, persons.length - 1)];
        }
      } while (tries > 0);
      return createLongDistancePerson(isMale);
    };

    const findLongDistancePerson = (isMale: boolean) => {
      const gender = isMale ? Gender.male : Gender.female;
      let tries = 10;
      let person: IPerson;
      do {
        tries--;
        person = this.pop.others[random(0, this.pop.others.length - 1)];
        if (person.gender === gender) { return person; }
      } while (tries > 0);
      return createLongDistancePerson(isMale);
    };

    const outerBbox = [
      bbox[0] - config.outerBboxDelta[0], bbox[1] - config.outerBboxDelta[0],
      bbox[2] + config.outerBboxDelta[1], bbox[3] + config.outerBboxDelta[1]
    ];
    const isInBbox = (lon: number, lat: number) => (bbox[0] < lon && lon < bbox[2] && bbox[1] < lat && lat < bbox[3]);

    /**
     * Creates a geo point outside the bounding box
     *
     * @returns
     */
    const createLongDistanceHome = () => {
      let lon: number;
      let lat: number;
      do {
        lon = outerBbox[0] + Math.random() * (outerBbox[2] - outerBbox[0]);
        lat = outerBbox[3] + Math.random() * (outerBbox[3] - outerBbox[1]);
      } while (isInBbox(lon, lat));
      return <ILocation>{
        locType: LocationType.residence,
        relType: RelationType.live,
        geo: <Point>{
          type: 'Point',
          coordinates: [lon, lat]
        }
      };
    };

    const createLongDistancePerson = (isMale: boolean, age?: number) => {
      const person = <IPerson>{
        age: age || random(17, 65),
        gender: isMale ? Gender.male : Gender.female,
        isLocal: false,
        roles: [{ role: PersonRole.unknown, location: 0, fte: 1 }],
        locations: [createLongDistanceHome()]
      };
      this.pop.others.push(person);
      return person;
    };

    const createEmployees = (buildingId: number, area: number, point: Point, count: number, type: WorkplaceType) => {
      const workplace = <IWorkplace>{
        bId: buildingId,
        area: area,
        workplaceType: type,
        geo: point,
        persons: <IPerson[]>[]
      };
      workplaces.push(workplace);
      const location = <ILocation>{
        bId: buildingId,
        geo: point,
        locType: LocationType.workplace,
        relType: RelationType.work
      };
      range(1, count).forEach(r => {
        const isMaleWorker = Math.random() < probMaleFemaleWorker;
        const isLocalWorker = Math.random() < (isMaleWorker ? probMenWorkingLocally : probWomenWorkingLocally);
        const person = isLocalWorker ? findLocalPerson(isMaleWorker) : createLongDistancePerson(isMaleWorker);
        person.locations.push(location);
        person.roles.push({ role: PersonRole.employee, location: person.locations.length - 1, fte: 1 });
        workplace.persons.push(person);
      });
    };

    const createVisitors = (buildingId: number, area: number, point: Point, count: number, type: LocationType) => {
      const location = <ILocation>{
        bId: buildingId,
        geo: point,
        locType: type,
        relType: RelationType.visit
      };
      range(1, count).forEach(r => {
        const isMaleVisitor = Math.random() < probMaleFemaleVisitor;
        const isLocalVisitor = Math.random() < (isMaleVisitor ? probMenVisitingLocally : probWomenVisitingLocally);
        const person = isLocalVisitor
          ? findLocalPerson(isMaleVisitor)
          : Math.random() < config.statistics.reuseProbability
            ? findLongDistancePerson(isMaleVisitor)
            : createLongDistancePerson(isMaleVisitor);
        person.locations.push(location);
        person.roles.push({ role: PersonRole.visitor, location: person.locations.length - 1, fte: 0 });
      });
    };

    // const primarySchoolFilter = (isMale: boolean) => (p: IPerson) => p.gender === (isMale ? Gender.male : Gender.female) && p.age >= 5 && p.age <= 12;
    // const secondarySchoolFilter = (isMale: boolean) => (p: IPerson) => p.gender === (isMale ? Gender.male : Gender.female) && p.age >= 12 && p.age <= 18;
    // const createStudents = (buildingId: number, area: number, point: Point, count: number) => {
    //   const isPrimarySchool = count < config.statistics.schools.maxPrimarySchoolSize;
    //   const personFilter = isPrimarySchool ? primarySchoolFilter : secondarySchoolFilter;
    //   const location = <ILocation>{
    //     bId: buildingId,
    //     geo: point,
    //     locType: isPrimarySchool ? LocationType.primarySchool : LocationType.secondarySchool,
    //     relType: RelationType.learn
    //   };
    //   range(1, count).forEach(r => {
    //     const isMaleStudent = Math.random() < 0.49;
    //     const person = findLocalPerson(isMaleStudent, personFilter(isMaleStudent));
    //     person.locations.push(location);
    //     person.roles.push({ role: PersonRole.student, location: person.locations.length - 1, fte: 0 });
    //   });
    // };

    const createSporters = (buildingId: number, area: number, point: Point, count: number) => {
      const location = <ILocation>{
        bId: buildingId,
        geo: point,
        locType: LocationType.sport,
        relType: RelationType.relax
      };
      const personFilter = (isMale: boolean) => (p: IPerson) => p.gender === (isMale ? Gender.male : Gender.female) && p.age >= 7 && p.age <= 65;
      range(1, count).forEach(r => {
        const isMale = Math.random() < config.statistics.sports.maleFemaleRatio;
        const person = findLocalPerson(isMale, personFilter(isMale));
        person.locations.push(location);
        person.roles.push({ role: PersonRole.sporter, location: person.locations.length - 1, fte: 0 });
      });
    };

    const officeInfo = config.statistics.offices;

    const addOffices = (buildingInfo: IBuildingProps) => {
      if (buildingInfo.aant_kan === 0 || Math.random() < officeInfo.emptyProbability) { return; }
      const workArea = buildingInfo.opp_kan * officeInfo.workAreaProbability;
      const workspaces = Math.round(workArea / officeInfo.workspaceM2);
      createEmployees(buildingInfo.id, buildingInfo.opp_kan, buildingInfo.geopunt, workspaces, WorkplaceType.office);
    };

    const shopInfo = config.statistics.shops;

    const addStoreEmployeesAndCustomers = (buildingInfo: IBuildingProps) => {
      if (buildingInfo.aant_win === 0) { return; }
      const employees = Math.round(buildingInfo.opp_win * shopInfo.ftePerM2);
      createEmployees(buildingInfo.id, buildingInfo.opp_win, buildingInfo.geopunt, employees, WorkplaceType.shop);
      const visitors = Math.round(buildingInfo.opp_win * shopInfo.customersPerM2);
      createVisitors(buildingInfo.id, buildingInfo.opp_win, buildingInfo.geopunt, visitors, LocationType.shop);
    };

    const schoolInfo = config.statistics.schools;
    const schools: { students: number; location: ILocation }[] = [];
    const addSchools = (buildingInfo: IBuildingProps) => {
      if (buildingInfo.aant_les === 0) { return; }
      const employees = Math.round(buildingInfo.opp_les * schoolInfo.ftePerM2);
      createEmployees(buildingInfo.id, buildingInfo.opp_les, buildingInfo.geopunt, employees, WorkplaceType.school);
      const students = Math.round(buildingInfo.opp_les * schoolInfo.studentsPerM2);
      const isPrimarySchool = students < schoolInfo.maxPrimarySchoolSize;
      schools.push({
        students: students, location: <ILocation>{
          bId: buildingInfo.id,
          locType: isPrimarySchool ? LocationType.primarySchool : LocationType.secondarySchool,
          relType: RelationType.learn,
          geo: buildingInfo.geopunt
        }
      });
      // createStudents(buildingInfo.id, buildingInfo.opp_les, students);
    };

    const assignChildrenToSchools = () => {
      const findNearestSchool = (s: { students: number; location: ILocation }[], home: Point, type: LocationType) => {
        switch (s.length) {
          case 0:
            // No local schools available
            return {
              students: 0, location: <ILocation>{
                locType: type,
                relType: RelationType.learn,
                geo: createLongDistanceHome().geo
              }
            };
          case 1:
            return s[0];
          default:
            const nearest = s.reduce((prev, cur, index) => {
              const d = distance(cur.location.geo, home);
              return d < prev.distance ? { index: index, distance: d } : prev;
            }, { index: 0, distance: Number.MAX_VALUE });
            return s[nearest.index];
        }
      };
      const primarySchools: { students: number; location: ILocation }[] = [];
      const secondarySchools: { students: number; location: ILocation }[] = [];
      schools.forEach(s => s.location.locType === LocationType.primarySchool ? primarySchools.push(s) : secondarySchools.push(s));
      this.pop.households.forEach(h => {
        const children = h.persons.filter(p => p.roles[0].role === PersonRole.child);
        if (children.length < 0) { return; }
        let nearestPrimarySchool: { students: number; location: ILocation };
        let nearestSecondarySchool: { students: number; location: ILocation };
        children.forEach(c => {
          const isPrimarySchoolStudent = c.age <= 12;
          if (isPrimarySchoolStudent) {
            if (!nearestPrimarySchool) { nearestPrimarySchool = findNearestSchool(primarySchools, h.geo, LocationType.primarySchool); }
            c.roles.push(<IRoleAtLocation>{ location: c.locations.length, role: PersonRole.student });
            c.locations.push(nearestPrimarySchool.location);
          } else {
            if (!nearestSecondarySchool) { nearestSecondarySchool = findNearestSchool(secondarySchools, h.geo, LocationType.secondarySchool); }
            c.roles.push(<IRoleAtLocation>{ location: c.locations.length, role: PersonRole.student });
            c.locations.push(nearestSecondarySchool.location);
          }
        });
      });
    };

    const sportsInfo = config.statistics.sports;

    const addSportFacilities = (buildingInfo: IBuildingProps) => {
      if (buildingInfo.aant_sport === 0) { return; }
      const employees = Math.round(buildingInfo.opp_sport * sportsInfo.ftePerM2);
      createEmployees(buildingInfo.id, buildingInfo.opp_sport, buildingInfo.geopunt, employees, WorkplaceType.sport);
      const sporters = Math.round(buildingInfo.opp_sport * sportsInfo.sportersPerM2);
      createSporters(buildingInfo.id, buildingInfo.opp_sport, buildingInfo.geopunt, sporters);
    };

    this.buildings.features.forEach(f => {
      const buildingInfo = f.properties;
      addOffices(buildingInfo);
      addStoreEmployeesAndCustomers(buildingInfo);
      addSchools(buildingInfo);
      addSportFacilities(buildingInfo);
    });
    assignChildrenToSchools();
    return workplaces;
  }
}
