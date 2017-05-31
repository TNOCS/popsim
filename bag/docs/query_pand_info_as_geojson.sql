-- Voor een bepaald gebied, bepaal voor ieder pand de volgende gegevens:
-- straat, min_nummer, max_nummer, totaal_opp, bouwjaar, aant_won, opp_won, won_opp, aant_win, opp_win, aant_kan, opp_kan, aant_sport, opp_sport, aant_ind, opp_ind, aant_logies, opp_logies, aant_les, opp_les, aant_bij, opp_bij, aant_zorg, opp_zorg, aant_cel, opp_cel, aant_overig, opp_overig, ST_AsGeoJSON(geopunt, 7) as geopunt
WITH summary AS (SELECT
  FIRST(identificatie) as id,
  -- Pak de eerste straatnaam
  FIRST(openbareruimtenaam) as straat,
  -- Bereik van de huisnummers
  MIN(huisnummer) as min_nummer,
  MAX(huisnummer) as max_nummer,
  -- Totale oppervlakte van het pand
  SUM(opp) as totaal_opp,
  -- En het bouwjaar: aangezien we aggregeren op contour is dit correct
  MIN(bouwjaar) as bouwjaar,
  -- Tel het aantal woningen
  SUM(CASE WHEN functie='woonfunctie' THEN 1 ELSE 0 END) as aant_won,
  -- Tel het woonoppervlakte
  SUM(CASE WHEN functie='woonfunctie' THEN opp ELSE 0 END) as opp_won,
  -- Verzamel het woonoppervlakte van ieder verblijfsobject: bv 80, 0, 0, 80
  ARRAY_AGG(CASE WHEN functie='woonfunctie' THEN opp ELSE -1 END) as won_opp,
  SUM(CASE WHEN functie='winkelfunctie' THEN 1 ELSE 0 END) as aant_win,
  SUM(CASE WHEN functie='winkelfunctie' THEN opp ELSE 0 END) as opp_win,
  SUM(CASE WHEN functie='kantoorfunctie' THEN 1 ELSE 0 END) as aant_kan,
  SUM(CASE WHEN functie='kantoorfunctie' THEN opp ELSE 0 END) as opp_kan,
  SUM(CASE WHEN functie='sportfunctie' THEN 1 ELSE 0 END) as aant_sport,
  SUM(CASE WHEN functie='sportfunctie' THEN opp ELSE 0 END) as opp_sport,
  SUM(CASE WHEN functie='industriefunctie' THEN 1 ELSE 0 END) as aant_ind,
  SUM(CASE WHEN functie='industriefunctie' THEN opp ELSE 0 END) as opp_ind,
  SUM(CASE WHEN functie='logiesfunctie' THEN 1 ELSE 0 END) as aant_logies,
  SUM(CASE WHEN functie='logiesfunctie' THEN opp ELSE 0 END) as opp_logies,
  SUM(CASE WHEN functie='onderwijsfunctie' THEN 1 ELSE 0 END) as aant_les,
  SUM(CASE WHEN functie='onderwijsfunctie' THEN opp ELSE 0 END) as opp_les,
  SUM(CASE WHEN functie='bijeenkomstfunctie' THEN 1 ELSE 0 END) as aant_bij,
  SUM(CASE WHEN functie='bijeenkomstfunctie' THEN opp ELSE 0 END) as opp_bij,
  SUM(CASE WHEN functie='gezondheidszorgfunctie' THEN 1 ELSE 0 END) as aant_zorg,
  SUM(CASE WHEN functie='gezondheidszorgfunctie' THEN opp ELSE 0 END) as opp_zorg,
  SUM(CASE WHEN functie='celfunctie' THEN 1 ELSE 0 END) as aant_cel,
  SUM(CASE WHEN functie='celfunctie' THEN opp ELSE 0 END) as opp_cel,
  SUM(CASE WHEN functie='overige gebruiksfunctie' THEN 1 ELSE 0 END) as aant_overig,
  SUM(CASE WHEN functie='overige gebruiksfunctie' THEN opp ELSE 0 END) as opp_overig,
  -- Het eerste adrespunt (de aangenomen ingang)
  FIRST(geopunt) as geopunt,
  -- De contour van de woning
  contour
FROM (
  -- Subquery om alle tabellen aan elkaar te knopen: deze kun je ook zelfstandig runnen, maar dan krijg je een pand
  -- meerdere keer terug in je query (voor ieder adres opnieuw)
	SELECT
        openbareruimtenaam,
        huisnummer,
        huisletter,
        huisnummertoevoeging,
        postcode,
        woonplaatsnaam,
        adres.geopunt as geopunt,
        v.oppervlakteverblijfsobject as opp,
        d.gebruiksdoelverblijfsobject as functie,
        p.bouwjaar as bouwjaar,
    	p.identificatie as identificatie,
        p.geovlak as contour
    FROM adres
    -- Koppelen van andere tabellen
    JOIN verblijfsobjectactueelbestaand v ON v.identificatie = adres.adresseerbaarobject
    JOIN verblijfsobjectgebruiksdoelactueelbestaand d ON d.identificatie = adres.adresseerbaarobject
    JOIN verblijfsobjectpandactueelbestaand vp ON vp.identificatie = adres.adresseerbaarobject
    JOIN pandactueelbestaand p ON p.identificatie = vp.gerelateerdpand
) as bar
WHERE ST_WITHIN(geopunt, ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992))
GROUP BY contour
ORDER BY straat, min_nummer)

SELECT row_to_json(fc)
 FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
 FROM (SELECT 'Feature' As type
    , ST_AsGeoJSON(ST_Force2D(ST_Transform(lg.contour, 4326)), 7)::json As geometry
    , row_to_json(lp) As properties
   FROM summary As lg 
         INNER JOIN (SELECT straat, 
                     min_nummer, 
                     max_nummer, 
                     totaal_opp, 
                     bouwjaar, 
                     aant_won, 
                     opp_won, 
                     won_opp, 
                     aant_win, 
                     opp_win, 
                     aant_kan, 
                     opp_kan, 
                     aant_sport, 
                     opp_sport, 
                     aant_ind, 
                     opp_ind, 
                     aant_logies, 
                     opp_logies, 
                     aant_les, 
                     opp_les, 
                     aant_bij, 
                     opp_bij, 
                     aant_zorg, 
                     opp_zorg, 
                     aant_cel, 
                     opp_cel, 
                     aant_overig, 
                     opp_overig,
                     id,
                     ST_AsGeoJSON(ST_Force2D(ST_Transform(geopunt, 4326)), 7)::json as geopunt FROM summary) As lp 
       ON lg.id = lp.id  ) As f )  As fc;