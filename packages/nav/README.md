# NAV service

The navigation service listens to the BAG channel for building information, and creates a navigation 'map' for walking.

- Buildings become obstacles
- Highways become obstacles too - no persons are allowed to walk there
- Roads should be difficult to cross, except at priority crossings.

To create these roads dynamically, I have used the [OVERPASS API](http://overpass-api.de).

A typical query to get the paths for pedestrians may look like this:
```console
[bbox:51.436400343137905,5.473718047142029,51.43789496378734,5.476245615959167]
[out:json];
(
  relation["route"="foot"]->.cr;
  relation["route"="bicycle"]->.cr;
  way["highway"="pedestrian"];
  way["highway"="cycleway"];
  way["highway"="footway"];
  way["highway"="cycleway"];
  way["highway"="path"];
  way["highway"="bridleway"];
  way["highway"="track"];
  way["highway"="steps"];
  way["highway"="service"];
  way["highway"="residential"];
  way["highway"="unclassified"];
  way["highway"="tertiary"];
);
out;>;
out skel qt;
```
The actual query that is used can be found in the `config/config.json` file, where `{{bbox}}` is replaced with the actual bounding box of the request.