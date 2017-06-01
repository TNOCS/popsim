WITH areaOfInterest AS (SELECT ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992) as geom)
SELECT
	aant_inw,
    aant_man,
    aant_vrouw,
    aantal_hh,
    bev_dichth,
    round(p_00_14_jr * aant_inw / 100, 2) as aant_00_14_jr,
    round(p_15_24_jr * aant_inw / 100, 2) as aant_15_24_jr,
    round(p_25_44_jr * aant_inw / 100, 2) as aant_25_44_jr,
    round(p_45_64_jr * aant_inw / 100, 2) as aant_45_64_jr,
    round(p_65_eo_jr * aant_inw / 100, 2) as aant_65_eo_jr,
    round(p_ongehuwd * aant_inw / 100, 2) as aant_ongehuwd,
    round(p_gescheid * aant_inw / 100, 2) as aant_gescheid,
    round(p_verweduw * aant_inw / 100, 2) as aant_verweduw,
    round(p_eenp_hh * aantal_hh / 100, 2) as aant_eenp_hh,
    round(p_hh_z_k * aantal_hh / 100, 2) as aant_hh_z_k,
    round(p_hh_m_k * aantal_hh / 100, 2) as aant_hh_m_k,
    round(p_west_al * aant_inw / 100, 2) as aant_west_al,
    round(p_n_w_al * aant_inw / 100, 2) as aant_n_w_al,
    round(p_marokko * aant_inw / 100, 2) as aant_marokko,
    round(p_turkije * aant_inw / 100, 2) as aant_turkije,
    round(p_ant_aru * aant_inw / 100, 2) as aant_ant_aru,
    round(p_surinam * aant_inw / 100, 2) as aant_surinam,
    round(p_over_nw * aant_inw / 100, 2) as aant_over_nw
    , ST_AsGeoJSON(ST_Force2D(ST_Transform(b.geom, 4326)), 7)::json As buurt_geom
    , CASE WHEN ST_CoveredBy(b.geom, a.geom) THEN b.geom ELSE ST_Multi(ST_Intersection(b.geom, a.geom)) END AS geom
FROM buurt_2016 as b, areaOfInterest as a
WHERE
	water = 'NEE' AND
    aant_inw > 0 AND
    ST_INTERSECTS(b.geom, a.geom)