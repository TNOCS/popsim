export interface ISimRequestMessage {
  /**
   * Request ID
   *
   * @type {number}
   * @memberof 'ISimRequestMessage'
   */
  id: number;
  /**
   * Simultation start time
   *
   * @type {ISimTime}
   * @memberof 'ISimRequestMessage'
   */
  simulationStartTime: Date;
  /**
   * Simulation end time
   *
   * @type {ISimTime}
   * @memberof 'ISimRequestMessage'
   */
  simulationEndTime: Date;
  /**
   * Bounding box in WGS84 (top-left, bottom-right):
   * [longitude, latitude, longitude, latitude]
   *
   * @type {number[]}
   * @memberof 'ISimRequestMessage'
   */
  bbox: number[];
}
