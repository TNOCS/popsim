# Workforce service

Based on open data sources as the BAG and DUO, determine how many people are working, studying, etc in a certain area, and where.

## Offices

### Office Requirements
Based on [Flexas](https://www.flexas.nl/blog/hoeveel-m2-kantoorruimte-heb-je-nodig), about half (55%) of an office space is needed as workplace, whereas the other 45% is used for the construction, elevator, corridors, and meeting rooms. An actual workplace (desk with PC etc.) requires between 10 and 15m2.

### Empty offices
According to [Compendium voor de Leefomgeving](http://www.clo.nl/indicatoren/nl2152-leegstand-kantoren), about 17% of all offices were empty in 2016.

### Workforce computation
In the BAG, we can find number of offices, as well as their area. So to compute the expected workforce, we will use the following formula:

`total_office_area_m2` is obtained by summing all office areas from the BAG.
`used_workspace_m2 = 0.17 * total_office_area_m2`
`effective_workspace_m2 = 0.55 * used_workspace_m2`
`workforce = effective_workspace_m2 / 12.5` number of people

## Schools

According to [thuisonderwijs](http://www.thuisinonderwijs.nl/hoe-groot-mag-een-groep-zijn-op-de-basisschool/), there are 23.3% children on average in a classroom (primary school). Also, there is a minimum requirement that each student should at least get [3.5m2 bruto](https://www.rijksoverheid.nl/onderwerpen/basisonderwijs/vraag-en-antwoord/zijn-er-minimale-ruimtenormen-per-leerling-in-het-onderwijs), i.e. measured over the whole school. So if you have 200 children, the school area should at least be 700m2.

We also have information from [DUO](https://duo.nl/open_onderwijsdata/databestanden/po/leerlingen-po/po-totaal/bo-gewicht-leeftijd.jsp), containing children per school. If we combine the numbers with their [addresses](https://duo.nl/open_onderwijsdata/databestanden/po/adressen/adressen-po-4.jsp) and the BAG (to get the coordinates), we are able to obtain geo-specific children counts.

With respect to staff, we can find the information [here](https://duo.nl/open_onderwijsdata/databestanden/po/onderwijspersoneel) too.

## Care & Cure

Using the information from [Zorg op de kaart](zorgopdekaart.nl), we can find the available number of residents in care institutions. The number for cure locations is less accurate, and only an approximate number of beds is available.

## Shops and stores

About clothing stores, we can find some numbers at [Detailhandel.info](http://detailhandel.info/index.cfm/branches/kleding-sport/modewinkels/dames-en-herenmode). Here, we can see that in 2016, 4.502 shops had 31.172 FTE employed, using 1.587.000m2.

For supermarkets, [these numbers](http://detailhandel.info/index.cfm/branches/levensmiddelenzaken/supermarkten/) are 6.136 shops, 119.357 FTE, 4.349.000m2

For [consumer electronics](http://detailhandel.info/index.cfm/branches/consumentenelectronica/):

[Excel version](file://../docs/DetailhanderInfo.xslx)
Branche;                    shops;    m2;           FTE;
clothing & sport;           22796;   4662000;    80195;
supermarkets & food;        10886;   4431000;    132575;
special food;               13290;   666000;      26084;
home & garden;              13389;   6280000;    47329;
consumer electronics;       4410;    729000;      17473;
education & spare time;     7865;    1254000;    20839;
personal care;              7237;    933000;      32351;
home decorating;            9750;    6403000;    36322;

## Distance between work and house
According to [CBS](http://statline.cbs.nl/Statweb/publication/?DM=SLNL&PA=82918ned&D1=0&D2=0&D3=a&D4=0-1,4&D5=0&D6=a&VW=T), in 2016, of the 8403000 people working, 1318+393+752+172=2635000 people work from or nearby home. 2635 / 8403 = 31.36% of the working population!

The average travelling distance is 30km for men, and 16km for women according to [CBS](https://www.cbs.nl/nl-nl/nieuws/2016/25/hoogopgeleide-man-maakt-de-meeste-woon-werkkilometers). See also the [transport and mobility report 2016](https://www.cbs.nl/nl-nl/publicatie/2016/25/transport-en-mobiliteit-2016).
Mostly by car, but distances <5km by bike (about 1000km per year per person).

The average [travel distance](http://statline.cbs.nl/Statweb/publication/?DM=SLNL&PA=81251ned&D1=a&D2=0&D3=0&D4=l&HDR=G2,T&STB=G1,G3&VW=T) was 14.6km.

http://statline.cbs.nl/Statweb/publication/?DM=SLNL&PA=81431NED&D1=0&D2=a&D3=0&D4=l&VW=T

	OnderwerpenPas de indeling van de tabel aan. Verplaats variabele naar rijen.	Werkgelegenheid
Banen
Kenmerken baan / werknemer / bedrijf	x 1 000
Totaal	A-U Alle economische activiteiten	2015	7 783
Geslacht: Mannen	A-U Alle economische activiteiten	2015	4 092
Geslacht: Vrouwen	A-U Alle economische activiteiten	2015	3 691
Leeftijd: 0 tot 15 jaar	A-U Alle economische activiteiten	2015	9
Leeftijd: 15 tot 20 jaar	A-U Alle economische activiteiten	2015	534
Leeftijd: 20 tot 25 jaar	A-U Alle economische activiteiten	2015	804
Leeftijd: 25 tot 30 jaar	A-U Alle economische activiteiten	2015	850
Leeftijd: 30 tot 35 jaar	A-U Alle economische activiteiten	2015	791
Leeftijd: 35 tot 40 jaar	A-U Alle economische activiteiten	2015	759
Leeftijd: 40 tot 45 jaar	A-U Alle economische activiteiten	2015	847
Leeftijd: 45 tot 50 jaar	A-U Alle economische activiteiten	2015	940
Leeftijd: 50 tot 55 jaar	A-U Alle economische activiteiten	2015	901
Leeftijd: 55 tot 60 jaar	A-U Alle economische activiteiten	2015	750
Leeftijd: 60 tot 65 jaar	A-U Alle economische activiteiten	2015	480
Leeftijd: 65 tot 75 jaar	A-U Alle economische activiteiten	2015	106
Leeftijd: 75 jaar of ouder	A-U Alle economische activiteiten	2015	10
Dienstverband: voltijd	A-U Alle economische activiteiten	2015	3 571
Dienstverband: deeltijd	A-U Alle economische activiteiten	2015	4 211
Arbeidsduur: minder dan 12 uur per week	A-U Alle economische activiteiten	2015	1 213
Arbeidsduur: 12 tot 20 uur per week	A-U Alle economische activiteiten	2015	781
Arbeidsduur: 20 tot 25 uur per week	A-U Alle economische activiteiten	2015	784
Arbeidsduur: 25 tot 30 uur per week	A-U Alle economische activiteiten	2015	570
Arbeidsduur: 30 tot 35 uur per week	A-U Alle economische activiteiten	2015	831
Arbeidsduur: 35 uur of meer per week	A-U Alle economische activiteiten	2015	3 603
Bedrijfsgrootte:minder dan 10 werknemers	A-U Alle economische activiteiten	2015	1 173
Bedrijfsgrootte: 10 tot 100 werknemers	A-U Alle economische activiteiten	2015	1 831
Bedrijfsgrootte: 100 werknemers of meer	A-U Alle economische activiteiten	2015	4 779
Cao-sector: particuliere bedrijven	A-U Alle economische activiteiten	2015	5 439
Cao-sector: gesubsidieerde instellingen	A-U Alle economische activiteiten	2015	1 326
Cao-sector: overheid	A-U Alle economische activiteiten	2015	1 017
