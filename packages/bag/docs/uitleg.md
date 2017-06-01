# Toelichting

Ik heb een beetje zitten spelen met de BAG database (van mrt 2017). Ik wilde weten binnen een bepaald gebied welke panden er staan, en voor ieder pand een feature aanmaken met de pandcontour als geometry, en de volgende eigenschappen:

- Pand identificatie
- bouwjaar,
- straatnaam,
- min/max_nummer (huisnummer),
- aantal woningen/kantoren/zorg/cel/bijeenkomst/ind/etc uit de verblijfsobjectfunctie, .
- totaal oppervlakte per verblijfsobjectfunctie
- voor de woningen retourneer ik alle oppervlaktes, dus als er een pand is met meerdere functies, bv 2 appt boven een winkel, dan krijg je het opp van ieder appt.
- Geopunt (dit is het geopunt dat hoort bij het eerste adres in het gebouw)

Dit retourneer ik als GeoJSON.

Mocht je geïnteresseerd zijn in de SQL hiervoor, dan kun je onderstaande SQL runnen (bv in pgadmin v4): hiermee krijg je alle panden die een adrespunt binnen je gebied hebben liggen. Mocht je dit willen runnen voor je eigen locatie, dan kun je eenvoudig de ST_Within Polygon etc. aanpassen door een andere WKT in te voeren (bv gemaakt met Wicket). Dit werkt alleen op bovenstaande db. Mocht je het op je eigen db willen gebruiken, zie dan hieronder voor meer instructies.

Vb pand met 1 winkel (125m2), 10 woningen (1235m2) en 2 kantoren (946m2)
NB: de -1 in de won_opp array geeft aan dat het hier geen woning betrof
{
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [5.4725607, 51.4510254],
          [5.4726731, 51.4510525],
          [5.4727399, 51.4510533],
          [5.4728222, 51.4510517],
          [5.472879, 51.4510509],
          [5.472878, 51.4510527],
          [5.47301, 51.4510826],
          [5.4729556, 51.451126],
          [5.4729035, 51.4512141],
          [5.4728752, 51.4512088],
          [5.4728669, 51.4512069],
          [5.4725006, 51.451124],
          [5.4725607, 51.4510254]
        ]
      ]
    },
    "type": "Feature",
    "properties": {
      "aant_sport": 0,
      "opp_ind": 0,
      "aant_logies": 0,
      "opp_les": 0,
      "opp_won": 1235,
      "geopunt": {
        "type": "Point",
        "coordinates": [5.4729311, 51.4511316]
      },
      "id": 772100000303648,
      "aant_ind": 0,
      "opp_win": 125,
      "aant_overig": 0,
      "aant_kan": 2,
      "aant_les": 0,
      "opp_cel": 0,
      "bouwjaar": 1998,
      "opp_zorg": 0,
      "opp_sport": 0,
      "opp_bij": 0,
      "aant_won": 10,
      "aant_bij": 0,
      "opp_kan": 946,
      "won_opp": [116, 119, 94, 135, 140, -1, 135, 110, -1, 140, 106, -1, 140],
      "aant_win": 1,
      "min_nummer": 11,
      "aant_cel": 0,
      "straat": "Woenselse Markt",
      "aant_zorg": 0,
      "opp_overig": 0,
      "max_nummer": 14,
      "totaal_opp": 2306,
      "opp_logies": 0
    }
  }

Groeten,
Erik

SQL query

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


Indien je het zelf wil opzetten in je eigen DB, dan moet je iets meer doen:
•	Je search path aanpassen (aangezien de BAG in schema bagactueel staat, kun je niet bij de postgis functies die in public staan)

SET search_path TO bagactueel,public;

•	Een nieuwe functie toevoegen aan de db zdd je FIRST kunt gebruiken bij aggregeren

-- Create a function that always returns the first non-NULL item
CREATE OR REPLACE FUNCTION public.first_agg ( anyelement, anyelement )
RETURNS anyelement LANGUAGE SQL IMMUTABLE STRICT AS $$
        SELECT $1;
$$;

-- And then wrap an aggregate around it
CREATE AGGREGATE public.FIRST (
        sfunc    = public.first_agg,
        basetype = anyelement,
        stype    = anyelement
);
