Gewenste informatie van de BAG

Binnen een gebied wil je alle panden, en voor ieder pand hun:
- contour: dit zijn obstakels waar je op straat niet kunt bewegen
- adrespunt: hier ga je een gebouw naar binnen. Bron: bagactueel.adres
- adres (optioneel): om de data te verifiëren
- aantal en oppervlakte verblijfsobjecten met functie wonen
- aantal en oppervlakte verblijfsobjecten met functie kantoor
- aantal en oppervlakte verblijfsobjecten met functie winkel
- aantal en oppervlakte verblijfsobjecten met functie overig
- bouwjaar (optioneel)

Brontabellen/views in bagactueel
- adrespunt/geopunt: adres
- adres: adres
- oppervlakte verblijfsobject: verblijfsobjectactueelbestaand
- gebruiksdoel/functie: verblijfsobjectgebruiksdoelactueelbestaand
- pand <-> verblijfsobject koppeltabel: verblijfsobjectpandactueelbestaand
- bouwjaar: pandactueelbestaand
- contour/geovlak: pandactueelbestaand

Koppelvlakken
- adres.addresseerbaarobject = (nummeraanduidingactueelbestaand.identificatie) = verblijfsobjectactueelbestaand.hoofdadres
- verblijfsobjectgebruiksdoelactueelbestaand.identificatie =?=
  verblijfsobjectactueelbestaand.identificatie =?=
  verblijfsobjectpandactueelbestaand.identificatie
- verblijfsobjectpandactueelbestaand.gerelateerdpand = pandactueelbestaand.identificatie

Mogelijk nuttig:
- verblijfsobjectactueelbestaand: bevat ook een geopunt
- 1 adres = 1 verblijfsobject
- 1 pand = 0..n verblijfsobjecten

SQL tips
- Check SRID:
  SELECT Find_SRID('bagactueel', 'adres', 'geopunt');
- Een JOIN voegt twee tabellen samen: alleen de rijen die in beide zitten blijven over
SELECT *
FROM dbo.[Left]
 JOIN [Right] ON [Right].[EmployeeId] = [Left].[EmployeeId];
- Een LEFT OUTER JOIN retourneert alles van de linker tabel, en eventueel aangevuld met matching values van de rechter
SELECT *
FROM dbo.[Left]
 LEFT OUTER JOIN [Right] ON [Right].[EmployeeId] =
[Left].[EmployeeId];
- Een RIGHT OUTER JOIN retourneert alles van de rechter tabel, en eventueel aangevuld met matching values van de linker
- Subqueries zijn normale queries, binnen een grotere query, die je eenmalig  kunt gebruiken
SELECT OrderCounts.CustomerId ,
 OrderCounts.NumberOfOrders
FROM ( SELECT CustomerId ,
 COUNT(1) NumberOfOrders
 FROM dbo.[Order]
 GROUP BY CustomerId ) OrderCounts
WHERE OrderCounts.NumberOfOrders > 20;
- Common Table Expressions zijn vergelijkbaar met subqueries, maar krachtiger, want je kunt er meerdere malen naar verwijzen
WITH CTE AS (SELECT statement)

WITH Summary (NumberOfItems, OrderTotal, OrderID)
 AS ( SELECT SUM(Quantity) NumberOfItems ,
 SUM(Quantity * Price) OrderTotal ,
 OrderId
 FROM dbo.OrderDetail
 JOIN dbo.Item ON Item.ItemId = OrderDetail.ItemId
 GROUP BY OrderId)
The WITH clause names the CTE and specifies the names for the columns that will be included
in the result set. You don’t have to include the list of columns as long as all of the columns are
explicitly named in the query.
We can include multiple CTEs in a query. Each CTE is separated by commas. We could rewrite
the UPDATE statement using two CTEs

- SQL functie om het eerste element te retourneren tijdens aggregeren, bv straatnaam:
  Zie ook: https://wiki.postgresql.org/wiki/First/last_(aggregate)

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

- De postgis functies kun je niet benaderen aangezien de bag niet in het public schema staat, maar bagactueel (dat is echter goed voor backups). Voeg het public schema dus toe aan je search path:
SET search_path TO bagactueel,public;

Voor onderstaande WKT queries heb ik [Wicket](http://arthur-e.github.io/Wicket/sandbox-gmaps3.html) gebruikt.

WKT (Karpen)
POLYGON((5.5030131340026855 51.45465557530773,5.512111186981201 51.45465557530773,5.512111186981201 51.45059061006682,5.5030131340026855 51.45059061006682,5.5030131340026855 51.45465557530773))

WKT (Eindhoven centrum)
POLYGON((5.474495887756348 51.44190471270124,5.483808517456055 51.44190471270124,5.483808517456055 51.43532386882376,5.474495887756348 51.43532386882376,5.474495887756348 51.44190471270124))

WKT (Woensel)
POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))

WKT in lat/lon (4326)
SELECT ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326);

WKT in lat/lon (4326) converted to geovlak in RD
SELECT ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28892);

#### Stap 1: selecteer adressen in gebied (3397)
SELECT
	openbareruimtenaam,
  huisnummer,
  huisletter,
  huisnummertoevoeging,
  postcode,
  woonplaatsnaam
FROM adres
WHERE ST_WITHIN(adres.geopunt, ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992));

#### Stap 2: voeg vbo data toe (3429)
SELECT
	openbareruimtenaam,
  huisnummer,
  huisletter,
  huisnummertoevoeging,
  postcode,
  woonplaatsnaam,
  adres.geopunt as geopunt,
  v.oppervlakteverblijfsobject as opp
FROM adres
JOIN verblijfsobjectactueelbestaand v ON v.identificatie = adres.adresseerbaarobject
WHERE ST_WITHIN(adres.geopunt, ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992))

#### Stap 3: voeg functie toe (3429)
SELECT
	openbareruimtenaam,
  huisnummer,
  huisletter,
  huisnummertoevoeging,
  postcode,
  woonplaatsnaam,
  adres.geopunt as geopunt,
  v.oppervlakteverblijfsobject as opp,
  d.gebruiksdoelverblijfsobject as functie
FROM adres
JOIN verblijfsobjectactueelbestaand v ON v.identificatie = adres.adresseerbaarobject
JOIN verblijfsobjectgebruiksdoelactueelbestaand d ON d.identificatie = adres.adresseerbaarobject

#### Stap 4: voeg pandcontour en bouwjaar toe (3408, 1369 panden)
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
  p.bouwjaar,
  p.geovlak as contour
FROM adres
JOIN verblijfsobjectactueelbestaand v ON v.identificatie = adres.adresseerbaarobject
JOIN verblijfsobjectgebruiksdoelactueelbestaand d ON d.identificatie = adres.adresseerbaarobject
JOIN verblijfsobjectpandactueelbestaand vp ON vp.identificatie = adres.adresseerbaarobject
JOIN pandactueelbestaand p ON p.identificatie = vp.gerelateerdpand
WHERE ST_WITHIN(adres.geopunt, ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992))

 overige gebruiksfunctie

## Aggregating stuff

Definieer eerst de FIRST functie (zie hierboven) om de eerste waarde te selecteren in een aggregatie.

#### Stap 1: Aggregeer de gegevens van hierboven, waarbij de bovenstaande data als subquery wordt gebruikt om een soort van virtuele tabel te maken.

SELECT
	SUM(CASE WHEN functie='woonfunctie' THEN 1 ELSE 0 END) as aant_won,
  SUM(CASE WHEN functie='woonfunctie' THEN opp ELSE 0 END) as opp_won,
	SUM(CASE WHEN functie='winkelfunctie' THEN 1 ELSE 0 END) as aant_win,
  SUM(CASE WHEN functie='winkelfunctie' THEN opp ELSE 0 END) as opp_win,
	SUM(CASE WHEN functie='kantoorfunctie' THEN 1 ELSE 0 END) as aant_kan,
  SUM(CASE WHEN functie='kantoorfunctie' THEN opp ELSE 0 END) as opp_kan,
	SUM(CASE WHEN (functie='woonfunctie' OR functie='winkelfunctie' OR functie='kantoorfunctie') THEN 0 ELSE 1 END) as aant_overig,
  SUM(CASE WHEN (functie='woonfunctie' OR functie='winkelfunctie' OR functie='kantoorfunctie') THEN 0 ELSE opp END) as opp_overig,
	FIRST(openbareruimtenaam) as straat,
  MIN(huisnummer) as min_nummer,
  MAX(huisnummer) as max_nummer,
	SUM(opp) as totaal_opp,
	MIN(bouwjaar),
  FIRST(geopunt) as geopunt,
  contour
FROM (
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
        p.bouwjaar,
        p.geovlak as contour
    FROM adres
    JOIN verblijfsobjectactueelbestaand v ON v.identificatie = adres.adresseerbaarobject
    JOIN verblijfsobjectgebruiksdoelactueelbestaand d ON d.identificatie = adres.adresseerbaarobject
    JOIN verblijfsobjectpandactueelbestaand vp ON vp.identificatie = adres.adresseerbaarobject
    JOIN pandactueelbestaand p ON p.identificatie = vp.gerelateerdpand
	WHERE ST_WITHIN(adres.geopunt, ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992))
) as bar
GROUP BY contour
ORDER BY straat, min_nummer;

#### Stap 2: We kunnen de WHERE clausule nu ook naar buiten halen (aangezien we het eerste geopunt hebben genomen). Als alternatief kunnen we ook ST_WITHIN of ST_INTERSECTS toepassen op de contour. In het eerste geval krijgen we wat minder woningen, in het tweede geval wat meer.

SELECT
	SUM(CASE WHEN functie='woonfunctie' THEN 1 ELSE 0 END) as aant_won,
  SUM(CASE WHEN functie='woonfunctie' THEN opp ELSE 0 END) as opp_won,
	SUM(CASE WHEN functie='winkelfunctie' THEN 1 ELSE 0 END) as aant_win,
  SUM(CASE WHEN functie='winkelfunctie' THEN opp ELSE 0 END) as opp_win,
	SUM(CASE WHEN functie='kantoorfunctie' THEN 1 ELSE 0 END) as aant_kan,
  SUM(CASE WHEN functie='kantoorfunctie' THEN opp ELSE 0 END) as opp_kan,
	SUM(CASE WHEN (functie='woonfunctie' OR functie='winkelfunctie' OR functie='kantoorfunctie') THEN 0 ELSE 1 END) as aant_overig,
  SUM(CASE WHEN (functie='woonfunctie' OR functie='winkelfunctie' OR functie='kantoorfunctie') THEN 0 ELSE opp END) as opp_overig,
	FIRST(openbareruimtenaam) as straat,
  MIN(huisnummer) as min_nummer,
  MAX(huisnummer) as max_nummer,
	SUM(opp) as totaal_opp,
	MIN(bouwjaar),
  FIRST(geopunt) as geopunt,
  contour
FROM (
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
        p.bouwjaar,
        p.geovlak as contour
    FROM adres
    JOIN verblijfsobjectactueelbestaand v ON v.identificatie = adres.adresseerbaarobject
    JOIN verblijfsobjectgebruiksdoelactueelbestaand d ON d.identificatie = adres.adresseerbaarobject
    JOIN verblijfsobjectpandactueelbestaand vp ON vp.identificatie = adres.adresseerbaarobject
    JOIN pandactueelbestaand p ON p.identificatie = vp.gerelateerdpand
) as bar
WHERE ST_WITHIN(geopunt, ST_Transform(ST_GeomFromText('POLYGON((5.468873977661133 51.45217535436696,5.487070083618164 51.45217535436696,5.487070083618164 51.444900555158895,5.468873977661133 51.444900555158895,5.468873977661133 51.45217535436696))', 4326), 28992))
GROUP BY contour
ORDER BY straat, min_nummer;

#### Stap 3: Voeg meer functies toe (sportfunctie, industriefunctie, logiesfunctie, celfunctie, onderwijsfunctie, bijeenkomstfunctie, gezondheidszorgfunctie)

SELECT
  -- Pak de eerste straatnaam
	FIRST(openbareruimtenaam) as straat,
  -- Bereik van de huisnummers
  MIN(huisnummer) as min_nummer,
  MAX(huisnummer) as max_nummer,
  -- Totale oppervlakte van het pand
	SUM(opp) as totaal_opp,
  -- En het bouwjaar: aangezien we aggregeren op contour is dit correct
	MIN(bouwjaar),
  -- Tel het aantal woningen
	SUM(CASE WHEN functie='woonfunctie' THEN 1 ELSE 0 END) as aant_won,
  -- Tel het woonoppervlakte
  SUM(CASE WHEN functie='woonfunctie' THEN opp ELSE 0 END) as opp_won,
  -- Verzamel het woonoppervlakte van ieder verblijfsobject: bv 80, 0, 0, 80
  ARRAY_AGG(CASE WHEN functie='woonfunctie' THEN opp ELSE 0 END) as won_opp,
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
        p.bouwjaar,
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
ORDER BY straat, min_nummer;

#### Stap 4: Maak een view
Onderstaand werkt (als postgres user), maar is heel traag zonder WHERE clause.

CREATE OR REPLACE VIEW bagactueel.samenvatting AS
SELECT
	SUM(CASE WHEN functie='woonfunctie' THEN 1 ELSE 0 END) as aant_won,
  SUM(CASE WHEN functie='woonfunctie' THEN opp ELSE 0 END) as opp_won,
	SUM(CASE WHEN functie='winkelfunctie' THEN 1 ELSE 0 END) as aant_win,
  SUM(CASE WHEN functie='winkelfunctie' THEN opp ELSE 0 END) as opp_win,
	SUM(CASE WHEN functie='kantoorfunctie' THEN 1 ELSE 0 END) as aant_kan,
  SUM(CASE WHEN functie='kantoorfunctie' THEN opp ELSE 0 END) as opp_kan,
	SUM(CASE WHEN (functie='woonfunctie' OR functie='winkelfunctie' OR functie='kantoorfunctie') THEN 0 ELSE 1 END) as aant_overig,
  SUM(CASE WHEN (functie='woonfunctie' OR functie='winkelfunctie' OR functie='kantoorfunctie') THEN 0 ELSE opp END) as opp_overig,
	FIRST(openbareruimtenaam) as straat,
  MIN(huisnummer) as min_nummer,
  MAX(huisnummer) as max_nummer,
	SUM(opp) as totaal_opp,
	MIN(bouwjaar),
  FIRST(geopunt) as geopunt,
  contour
FROM (
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
        p.bouwjaar,
        p.geovlak as contour
    FROM bagactueel.adres
    JOIN bagactueel.verblijfsobjectactueelbestaand v ON v.identificatie = bagactueel.adres.adresseerbaarobject
    JOIN bagactueel.verblijfsobjectgebruiksdoelactueelbestaand d ON d.identificatie = bagactueel.adres.adresseerbaarobject
    JOIN bagactueel.verblijfsobjectpandactueelbestaand vp ON vp.identificatie = bagactueel.adres.adresseerbaarobject
    JOIN bagactueel.pandactueelbestaand p ON p.identificatie = vp.gerelateerdpand
) as bar
GROUP BY contour;

#### Stap 5: Converteer naar GeoJSON
Specifiek, verwijder daartoe eerst de z-coordinaat (die doet er toch niet toe) gebruikmakend van ST_Force2D, en beperk de precisie tot 7 cijfers achter de komma. Doe hetzelfde voor de geopunt. Je krijgt dan de volgende SQL query (de conversie naar GeoJSON routine heb ik van [hier](http://www.postgresonline.com/journal/archives/267-Creating-GeoJSON-Feature-Collections-with-JSON-and-PostGIS-functions.html)):

-- Voor een bepaald gebied, bepaal voor ieder pand de volgende gegevens:
-- straat, min_nummer, max_nummer, totaal_opp, bouwjaar, aant_won, opp_won, won_opp, aant_win, opp_win, aant_kan, opp_kan, aant_sport, opp_sport, aant_ind, opp_ind, aant_logies, opp_logies, aant_les, opp_les, aant_bij, opp_bij, aant_zorg, opp_zorg, aant_cel, opp_cel, aant_overig, opp_overig, ST_AsGeoJSON(geopunt, 7) as geopunt
WITH summary AS (SELECT
  -- Pand identificatie
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

