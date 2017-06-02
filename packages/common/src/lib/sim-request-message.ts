export interface ISimTime {
  hour: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;
  min: 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55 | 60;
  day: 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
}

export interface ISimRequestMessage {
  /**
   * Request ID
   *
   * @type {number}
   * @memberof IAreaMessage
   */
  id: number;
  /**
   * Simultation start time
   *
   * @type {ISimTime}
   * @memberof IAreaMessage
   */
  simulationStartTime: ISimTime;
  /**
   * Simulation end time
   *
   * @type {ISimTime}
   * @memberof IAreaMessage
   */
  simulationEndTime: ISimTime;
  /**
   * Bounding box in WGS84 (top-left, bottom-right):
   * [longitude, latitude, longitude, latitude]
   *
   * @type {number[]}
   * @memberof IAreaMessage
   */
  bbox: number[];
}
