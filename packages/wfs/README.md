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



