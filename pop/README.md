# Computing households
Assuming you have the following census data:
{
  "aant_inw": 2399,
  "aant_man": 1370,
  "aant_vrouw": 1026,
  "aantal_hh": 1709,
  "aant_00_14_jr": 134,
  "aant_15_24_jr": 488,
  "aant_25_44_jr": 1128,
  "aant_45_64_jr": 411,
  "aant_65_eo_jr": 243,
  "aant_ongehuwd": 1739,
  "aant_gescheid": 150,
  "aant_verweduw": 50,
  "aant_eenp_hh": 1212,
  "aant_hh_z_k": 371,
  "aant_hh_m_k": 117,
  "aant_west_al": 446,
  "aant_n_w_al": 444,
  "aant_marokko": 24,
  "aant_turkije": 24,
  "aant_ant_aru": 23,
  "aant_surinam": 23,
  "aant_over_nw": 349
}

Note the following relationships:
total population = `aant_inw` = 2399, of which
  singles: `aant_eenp_hh` = 1212 persons
  relationship: `aant_hh_z_k` = 371 * 2 persons
  pairs: `aant_hh_m_k` = 117 * 1.8 + #children persons
2399 - 1212 - 371 * 2 - 117 * 2 = #children


[Average #children/woman in NL: 1.7](http://www.clo.nl/indicatoren/nl2110-gemiddeld-kindertal-per-vrouw)
[Kinderen naar aanwezigheid ouders; leeftijd, herkomstgroepering
](http://statline.cbs.nl/Statweb/publication/?DM=SLNL&PA=81485NED&D1=a&D2=1-6&D3=1,l&D4=0&D5=1,5-9&D6=0&D7=0,l&VW=T)

[Households with children](http://statline.cbs.nl/Statweb/publication/?DM=SLNL&PA=71487NED&D1=0-3,12-15&D2=0-6&D3=0&D4=0,4,9,14-15&HDR=T&STB=G1,G2,G3&VW=T)

Pairs (tot, 1k, 2k, 3+ kinderen)
2578670	1099810	1074838	404022
In percentage
100 42.65 41.68 15.67

Single parent hh (tot, 1k, 2k, 3+ kinderen)
557426	345502	162146	49778
In percentage
100 61.98 29.09 8.93

Single parent percentage
557426 / 2578670 = 21.62 %
<!--
We also have the following:
total population = `aant_inw` = 2399, of which
  never maried: `aant_ongehuwd` = 1739 persons
  divorced: `aant_gescheid` = 150 persons
  widowed: `aant_verweduw` = 50 persons
  other (i.e. children < 21 years): ?
2399 - 1739 - 150 - 200 = 460 #children-->

