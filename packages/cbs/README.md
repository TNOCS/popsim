# Gewenste informatie van het CBS

Binnen een gebied wil je alle buurten, en voor ieder buurt hun inwoner data: daarbij wil je per buurt alleen het proportionele deel meenemen, d.w.z. dat je er van uitgaat dat alle bewoners uniform verdeeld zijn over de WONINGEN in de buurt. Echter, het CBS heeft geen woning gegevens, dus daarvoor moet je bij de BAG zijn. Vooralsnog houd ik het even op het oppervlakte, en neem de BAG dus niet mee, want voor dit project is een dergelijke precisie niet vereist.

We krijgen daarmee het volgende stappenplan:

1. Bepaal de buurten in het gebied van interesse, waarvan aant_inw > 0.
2. Voor iedere buurt, query de inwoners data en bepaal de geometrie van de overlap.
3. Vertaal percentages naar aantallen, bv `p_00_14_js` vermenigvuldig je met `aant_inw`
4. Maak er een GeoJSON van
5. Van de uit de DB ontvangen GeoJSON, voeg een aggregatie toe over de bbox.

## SQL query voor stap 1 t/m 3

```
WITH areaOfInterest AS (SELECT ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992) as geom)
SELECT
    aant_inw
    , aant_man
    , aant_vrouw
    , aantal_hh
    , bev_dichth
    , round(p_00_14_jr * aant_inw / 100, 2) as aant_00_14_jr
    , round(p_15_24_jr * aant_inw / 100, 2) as aant_15_24_jr
    , round(p_25_44_jr * aant_inw / 100, 2) as aant_25_44_jr
    , round(p_45_64_jr * aant_inw / 100, 2) as aant_45_64_jr
    , round(p_65_eo_jr * aant_inw / 100, 2) as aant_65_eo_jr
    , round(p_ongehuwd * aant_inw / 100, 2) as aant_ongehuwd
    , round(p_gescheid * aant_inw / 100, 2) as aant_gescheid
    , round(p_verweduw * aant_inw / 100, 2) as aant_verweduw
    , round(p_eenp_hh * aant_inw / 100, 2) as aant_eenp_hh
    , round(p_hh_z_k * aant_inw / 100, 2) as aant_hh_z_k
    , round(p_hh_m_k * aant_inw / 100, 2) as aant_hh_m_k
    , round(p_west_al * aant_inw / 100, 2) as aant_west_al
    , round(p_n_w_al * aant_inw / 100, 2) as aant_n_w_al
    , round(p_marokko * aant_inw / 100, 2) as aant_marokko
    , round(p_turkije * aant_inw / 100, 2) as aant_turkije
    , round(p_ant_aru * aant_inw / 100, 2) as aant_ant_aru
    , round(p_surinam * aant_inw / 100, 2) as aant_surinam
    , round(p_over_nw * aant_inw / 100, 2) as aant_over_nw
    , ST_AsGeoJSON(ST_Force2D(ST_Transform(b.geom, 4326)), 7)::json As buurt_geom
    , ST_AsGeoJSON(ST_Force2D(ST_Transform(CASE WHEN ST_CoveredBy(b.geom, a.geom) THEN b.geom ELSE ST_Multi(ST_Intersection(b.geom, a.geom)) END, 4326)), 7)::json AS geom
FROM buurt_2016 as b, areaOfInterest as a
WHERE
	water = 'NEE' AND
    aant_inw > 0 AND
    ST_INTERSECTS(b.geom, a.geom);
```

## Vertaal query resultaat naar GeoJSON

```
WITH summary AS (
  WITH areaOfInterest AS (SELECT ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992) as geom)
  SELECT bu_code
      , bu_naam
      , aant_inw
      , aant_man
      , aant_vrouw
      , aantal_hh
      , bev_dichth
      , round(p_00_14_jr * aant_inw / 100, 2) as aant_00_14_jr
      , round(p_15_24_jr * aant_inw / 100, 2) as aant_15_24_jr
      , round(p_25_44_jr * aant_inw / 100, 2) as aant_25_44_jr
      , round(p_45_64_jr * aant_inw / 100, 2) as aant_45_64_jr
      , round(p_65_eo_jr * aant_inw / 100, 2) as aant_65_eo_jr
      , round(p_ongehuwd * aant_inw / 100, 2) as aant_ongehuwd
      , round(p_gescheid * aant_inw / 100, 2) as aant_gescheid
      , round(p_verweduw * aant_inw / 100, 2) as aant_verweduw
      , round(p_eenp_hh * aant_inw / 100, 2) as aant_eenp_hh
      , round(p_hh_z_k * aant_inw / 100, 2) as aant_hh_z_k
      , round(p_hh_m_k * aant_inw / 100, 2) as aant_hh_m_k
      , round(p_west_al * aant_inw / 100, 2) as aant_west_al
      , round(p_n_w_al * aant_inw / 100, 2) as aant_n_w_al
      , round(p_marokko * aant_inw / 100, 2) as aant_marokko
      , round(p_turkije * aant_inw / 100, 2) as aant_turkije
      , round(p_ant_aru * aant_inw / 100, 2) as aant_ant_aru
      , round(p_surinam * aant_inw / 100, 2) as aant_surinam
      , round(p_over_nw * aant_inw / 100, 2) as aant_over_nw
      , ST_AsGeoJSON(ST_Force2D(ST_Transform(b.geom, 4326)), 7)::json As buurt_geom
      , ST_AsGeoJSON(ST_Force2D(ST_Transform(CASE WHEN ST_CoveredBy(b.geom, a.geom) THEN b.geom ELSE ST_Multi(ST_Intersection(b.geom, a.geom)) END, 4326)), 7)::json AS geom
  FROM buurt_2016 as b, areaOfInterest as a
  WHERE
    water = 'NEE' AND
      aant_inw > 0 AND
      ST_INTERSECTS(b.geom, a.geom))

SELECT row_to_json(fc)
 FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
 FROM (SELECT 'Feature' As type
    , lg.geom As geometry
    , row_to_json(lp) As properties
   FROM summary As lg
     INNER JOIN (SELECT bu_code
      , aant_inw
      , aant_man
      , aant_vrouw
      , aantal_hh
      , bev_dichth
      , aant_00_14_jr
      , aant_15_24_jr
      , aant_25_44_jr
      , aant_45_64_jr
      , aant_65_eo_jr
      , aant_ongehuwd
      , aant_gescheid
      , aant_verweduw
      , aant_eenp_hh
      , aant_hh_z_k
      , aant_hh_m_k
      , aant_west_al
      , aant_n_w_al
      , aant_marokko
      , aant_turkije
      , aant_ant_aru
      , aant_surinam
      , aant_over_nw
      , buurt_geom
     FROM summary) As lp
     ON lg.bu_code = lp.bu_code  ) As f )  As fc;
```