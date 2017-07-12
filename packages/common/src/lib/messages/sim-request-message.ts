export interface ISimRequestMessage {
  /**
   * Request ID
   *
   * @type {number}
   * @memberof 'ISimRequestMessage'
   */
  id: number;
  /**
   * Simultation start time in UTC
   *
   * @type {ISimTime}
   * @memberof 'ISimRequestMessage'
   */
  simulationStartTime: string;
  /**
   * Simulation end time in UTC
   *
   * @type {ISimTime}
   * @memberof 'ISimRequestMessage'
   */
  simulationEndTime: string;
  /**
   * Bounding box in WGS84 (top-left, bottom-right):
   * [longitude, latitude, longitude, latitude]
   *
   * @type {number[]}
   * @memberof 'ISimRequestMessage'
   */
  bbox: number[];
}
