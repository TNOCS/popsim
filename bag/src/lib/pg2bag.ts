import { query } from './db';
import * as SqlQueries from '../../config/sql.json';

const sql: { panden: string[] } = <any>SqlQueries;
const sqlPanden = sql.panden.join('\n');

/**
 * Query the BAG panden using the supplied bbox as WKT in WGS84 (SRID 4326).
 *
 * @see [Wicket](http://arthur-e.github.io/Wicket/sandbox-gmaps3.html) to easily create WKT.
 *
 * @param {string} bbox as WKT (Well known text)
 */
export const queryPanden = async (bbox?: string) => {
  try {
    bbox = bbox || `POLYGON(
      (
        5.468873977661133 51.45217535436696,
        5.487070083618164 51.45217535436696,
        5.487070083618164 51.444900555158895,
        5.468873977661133 51.444900555158895,
        5.468873977661133 51.45217535436696
      )
    )`;
    // var res = await query('SELECT $1::int AS number', ['5']);
    const res = await query(sqlPanden.replace(/bbox_4326/g, bbox), []);
    return res.rows[0].row_to_json;
  } catch (err) {
    console.error('error running query', err);
  }
};
