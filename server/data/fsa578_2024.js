// FSA-578 Report of Commodities, Farm and Tract Detail Listing, program year
// 2024 (Logan, Phillips and Sedgwick counties, Colorado). Scanned Jul 30, 2024
// (Scan240730110408.pdf, 42 pages): producer reports for McConnell Enterprises
// LLC, M77 AG LLC and Kyle McConnell dated Jul 15, 2024, and operator reports
// by farm dated Jul 11 and Jul 15, 2024; e-signed by Brandi McConnell, POA,
// Jul 15, 2024. Generated from the page transcription; every CLU line agrees
// across all the reports it appears on (pages listed per line).
//
// cards: the field card(s) the CLU is on, matched by legal description, acres
// and the 2024 crop on the card (crop history and the 2025 rotation); [card,
// acres] when one CLU covers several cards. openOn: a CLU that could not be
// placed on one card; it is shown on every card listed, for Kyle to place.
// The farm and tract numbers are FSA's 2024 numbers; the cards keep their own.
// Intended use 1-GZ / 2-GR on the same CLU is wheat or triticale grazed and
// then taken for grain, reported once per use.

const REPORT = {
  programYear: 2024, form: 'FSA-578', reportDates: ['2024-07-11', '2024-07-15'],
  signed: 'e-Signed by Brandi McConnell, POA, 07-15-24', source: 'Scan240730110408.pdf'
};

const TRACTS = [
 {
  "farm": "3702",
  "tract": "6937",
  "legal": "SE4 14-7Logan-48",
  "cropland": 159.9,
  "farmland": 159.9
 },
 {
  "farm": "3703",
  "tract": "6941",
  "legal": "E2 7 & W2W2 8-9Sedgwick-46",
  "cropland": 288.52,
  "farmland": 491.67
 },
 {
  "farm": "3704",
  "tract": "6943",
  "legal": "SE4 35-7-47",
  "cropland": 157.88,
  "farmland": 157.88
 },
 {
  "farm": "3704",
  "tract": "6944",
  "legal": "NE4 28-7Logan-48",
  "cropland": 157.56,
  "farmland": 157.56
 },
 {
  "farm": "3705",
  "tract": "6945",
  "legal": "W2 12-8-47",
  "cropland": 316.35,
  "farmland": 316.35
 },
 {
  "farm": "3705",
  "tract": "6946",
  "legal": "NE4 32-8-47",
  "cropland": 154.85,
  "farmland": 159.59
 },
 {
  "farm": "3705",
  "tract": "6947",
  "legal": "S2 20-8-47",
  "cropland": 117.25,
  "farmland": 118.9
 },
 {
  "farm": "3705",
  "tract": "6948",
  "legal": "N2 8-8-47",
  "cropland": 167.03,
  "farmland": 312.33
 },
 {
  "farm": "3705",
  "tract": "6949",
  "legal": "NE4 11-8-47",
  "cropland": 156.78,
  "farmland": 156.78
 },
 {
  "farm": "3710",
  "tract": "6954",
  "legal": "SW4 33-7-46",
  "cropland": 155.99,
  "farmland": 155.99
 },
 {
  "farm": "3712",
  "tract": "6956",
  "legal": "S2SE4 & SW4 13-9Sedgwick-47",
  "cropland": 241.43,
  "farmland": 246.72
 },
 {
  "farm": "3701",
  "tract": "6935",
  "legal": "Sec 17-6-47",
  "cropland": 514.69,
  "farmland": 629.14
 },
 {
  "farm": "3702",
  "tract": "6936",
  "legal": "NE4 2-6-47",
  "cropland": 158.5,
  "farmland": 158.5
 },
 {
  "farm": "3702",
  "tract": "6938",
  "legal": "SW4 14-7Logan-48",
  "cropland": 157.1,
  "farmland": 157.1
 },
 {
  "farm": "3702",
  "tract": "6939",
  "legal": "SW4 31-7-47",
  "cropland": 160.08,
  "farmland": 165.32
 },
 {
  "farm": "3703",
  "tract": "6942",
  "legal": "NE4 13-9Sedgwick-47",
  "cropland": 159.68,
  "farmland": 159.91
 },
 {
  "farm": "3707",
  "tract": "6951",
  "legal": "SW 35-7-47, Phillips Co",
  "cropland": 158.4,
  "farmland": 158.4
 },
 {
  "farm": "3708",
  "tract": "6952",
  "legal": "NE 15-7-48",
  "cropland": 157.53,
  "farmland": 157.53
 },
 {
  "farm": "3709",
  "tract": "6953",
  "legal": "N2NW N2S2NW4 14-7Logan-48",
  "cropland": 98.21,
  "farmland": 98.21
 },
 {
  "farm": "3669",
  "tract": "906",
  "legal": "13-9-47 NW4",
  "cropland": 108.87,
  "farmland": 165.74
 },
 {
  "farm": "3701",
  "tract": "6934",
  "legal": "NW 17-7Logan-48",
  "cropland": 109.36,
  "farmland": 157.19
 },
 {
  "farm": "3702",
  "tract": "6940",
  "legal": "E2E2 & SW4SE4 1-8Logan-48",
  "cropland": 184.76,
  "farmland": 184.76
 },
 {
  "farm": "3706",
  "tract": "6950",
  "legal": "SE4 8-9Sedgwick-47",
  "cropland": 124.38,
  "farmland": 159.38
 },
 {
  "farm": "3711",
  "tract": "6955",
  "legal": "NE4 6-6-46",
  "cropland": 158.71,
  "farmland": 158.71
 }
];

const LINES = [
 {
  "farm": "3702",
  "tract": "6937",
  "clu": "1",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 25.36,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "1363",
  "cards": [
   "13.E BAM E"
  ],
  "openOn": null,
  "note": "CLUs 1 and 3B (fallow, 74.00 ac) make up 13.E (74.9 ac on the card).",
  "pages": [
   1,
   39
  ]
 },
 {
  "farm": "3702",
  "tract": "6937",
  "clu": "3A",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 75.4,
  "cropland": true,
  "plantingDate": "06/12/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "1363",
  "cards": [
   "13.W BAM E"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   1,
   39
  ]
 },
 {
  "farm": "3702",
  "tract": "6937",
  "clu": "3B",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 48.64,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "1363",
  "cards": [
   "13.E BAM E"
  ],
  "openOn": null,
  "note": "CLUs 1 and 3B (fallow, 74.00 ac) make up 13.E (74.9 ac on the card).",
  "pages": [
   1,
   39
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "1B",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 62.85,
  "cropland": true,
  "plantingDate": "06/03/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": [
   "16.M BIG FIELD"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   1,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "1C",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 48.2,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": [
   "16.E BIG FIELD"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   1,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "3",
  "crop": "MIXFG",
  "varType": "IGS",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 5.57,
  "cropland": true,
  "plantingDate": "07/13/2018",
  "endYear": "2030",
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": null,
  "openOn": [
   "102 ROSCOE BIG PAST",
   "102 ROSCOE HOME",
   "1001 ROSCOE HOME"
  ],
  "note": "",
  "pages": [
   1,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "4",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 47.16,
  "cropland": false,
  "plantingDate": null,
  "endYear": "2025",
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": null,
  "openOn": [
   "102 ROSCOE BIG PAST",
   "102 ROSCOE HOME",
   "1001 ROSCOE HOME"
  ],
  "note": "",
  "pages": [
   1,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "6",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 17.94,
  "cropland": true,
  "plantingDate": null,
  "endYear": "2025",
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": null,
  "openOn": [
   "102 ROSCOE BIG PAST",
   "102 ROSCOE HOME",
   "1001 ROSCOE HOME"
  ],
  "note": "",
  "pages": [
   1,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "7",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 40.69,
  "cropland": false,
  "plantingDate": null,
  "endYear": "2025",
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": null,
  "openOn": [
   "102 ROSCOE BIG PAST",
   "102 ROSCOE HOME",
   "1001 ROSCOE HOME"
  ],
  "note": "",
  "pages": [
   1,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "8",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 7.42,
  "cropland": true,
  "plantingDate": null,
  "endYear": "2025",
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": null,
  "openOn": [
   "102 ROSCOE BIG PAST",
   "102 ROSCOE HOME",
   "1001 ROSCOE HOME"
  ],
  "note": "",
  "pages": [
   1,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "9",
  "crop": "MIXFG",
  "varType": "IGS",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 41.41,
  "cropland": true,
  "plantingDate": "07/13/2018",
  "endYear": "2030",
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": null,
  "openOn": [
   "102 ROSCOE BIG PAST",
   "102 ROSCOE HOME",
   "1001 ROSCOE HOME"
  ],
  "note": "",
  "pages": [
   2,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "19",
  "crop": "MIXFG",
  "varType": "IGS",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 25.04,
  "cropland": true,
  "plantingDate": "07/06/2022",
  "endYear": "2035",
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": null,
  "openOn": [
   "102 ROSCOE BIG PAST",
   "102 ROSCOE HOME",
   "1001 ROSCOE HOME"
  ],
  "note": "",
  "pages": [
   2,
   35
  ]
 },
 {
  "farm": "3704",
  "tract": "6943",
  "clu": "1B",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 78.98,
  "cropland": true,
  "plantingDate": "06/12/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "1363",
  "cards": [
   "61.S HIGHLAND E"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   2
  ]
 },
 {
  "farm": "3704",
  "tract": "6944",
  "clu": "1A",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 78.8,
  "cropland": true,
  "plantingDate": "06/13/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "1363",
  "cards": [
   "60.W DAILEYRD"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   2
  ]
 },
 {
  "farm": "3704",
  "tract": "6944",
  "clu": "1B",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 78.76,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "1363",
  "cards": [
   "60.E DAILEYRD"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   2
  ]
 },
 {
  "farm": "3705",
  "tract": "6945",
  "clu": "1B",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 79.1,
  "cropland": true,
  "plantingDate": "05/19/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "1363",
  "cards": [
   "42.E E/2 N/4"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   2,
   29
  ]
 },
 {
  "farm": "3705",
  "tract": "6946",
  "clu": "1A",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 77.42,
  "cropland": true,
  "plantingDate": "05/19/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 50,
    "name": "M77 AG LLC"
   },
   {
    "percent": 50,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3558",
  "cards": [
   "44.W S. TOWN"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   2,
   8,
   29
  ]
 },
 {
  "farm": "3705",
  "tract": "6947",
  "clu": "1",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 113.62,
  "cropland": true,
  "plantingDate": "05/15/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "1363",
  "cards": [
   "45 W. TOWN"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   3,
   30
  ]
 },
 {
  "farm": "3705",
  "tract": "6948",
  "clu": "6",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 98.77,
  "cropland": true,
  "plantingDate": "05/29/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "1363",
  "cards": [
   "47 HOME E"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   3,
   30
  ]
 },
 {
  "farm": "3705",
  "tract": "6949",
  "clu": "1A",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 78.4,
  "cropland": true,
  "plantingDate": "06/04/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "1363",
  "cards": [
   "41.E E/4"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   3,
   31
  ]
 },
 {
  "farm": "3705",
  "tract": "6949",
  "clu": "1B",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 78.38,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "1363",
  "cards": [
   "41.W E/4"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   3,
   31
  ]
 },
 {
  "farm": "3710",
  "tract": "6954",
  "clu": "1A",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 74.8,
  "cropland": true,
  "plantingDate": "06/12/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "1363",
  "cards": [
   "54.S PAULS"
  ],
  "openOn": null,
  "note": "FSA 74.80 ac; card 68.01 ac.",
  "pages": [
   3,
   23
  ]
 },
 {
  "farm": "3710",
  "tract": "6954",
  "clu": "1B",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 74.8,
  "cropland": true,
  "plantingDate": "05/24/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "1363",
  "cards": [
   "54.N PAULS"
  ],
  "openOn": null,
  "note": "FSA 74.80 ac; card 78.39 ac.",
  "pages": [
   3,
   23
  ]
 },
 {
  "farm": "3712",
  "tract": "6956",
  "clu": "1A",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 161.88,
  "cropland": true,
  "plantingDate": "05/20/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 50,
    "name": "M77 AG LLC"
   },
   {
    "percent": 50,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3558",
  "cards": [
   [
    "26.E SW MICHAEL",
    null
   ],
   [
    "26.W SW MICHAEL",
    null
   ]
  ],
  "openOn": null,
  "note": "One corn CLU over 26.E and 26.W SW Michael; the cards carry no acres, so it is not split.",
  "pages": [
   4,
   9,
   19
  ]
 },
 {
  "farm": "3712",
  "tract": "6956",
  "clu": "1B",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 39.1,
  "cropland": true,
  "plantingDate": "06/27/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": [
   "29.S MICHAEL"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   4,
   19
  ]
 },
 {
  "farm": "3712",
  "tract": "6956",
  "clu": "3",
  "crop": "MILET",
  "varType": "PRL",
  "intendedUse": "FG",
  "irrigation": "N",
  "acres": 40.45,
  "cropland": true,
  "plantingDate": "06/27/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "MCCONNELL ENTERPRISES LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "1363",
  "cards": [
   "29.N MICHAEL"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   4,
   19
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1C",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 77.2,
  "cropland": true,
  "plantingDate": "10/02/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3527",
  "cards": null,
  "openOn": [
   "20 NORTH",
   "21 SMALL",
   "22 TOP HILL",
   "23.E SW PAULI",
   "23.W SW PAULI",
   "24.E SE PAULI",
   "24.W SE PAULI",
   "202 SECTION"
  ],
  "note": "",
  "pages": [
   7
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1D",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 128.4,
  "cropland": true,
  "plantingDate": "10/02/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3527",
  "cards": [
   [
    "24.E SE PAULI",
    64.2
   ],
   [
    "24.W SE PAULI",
    64.2
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   7
  ]
 },
 {
  "farm": "3702",
  "tract": "6936",
  "clu": "1B",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 79.25,
  "cropland": true,
  "plantingDate": "10/06/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3527",
  "cards": [
   "10.S OURS"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   7,
   39
  ]
 },
 {
  "farm": "3702",
  "tract": "6938",
  "clu": "1B",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 78.55,
  "cropland": true,
  "plantingDate": "05/26/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 50,
    "name": "KYLE MCCONNELL"
   },
   {
    "percent": 50,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3528",
  "cards": [
   "12.E BAM W"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   7,
   12,
   40
  ]
 },
 {
  "farm": "3702",
  "tract": "6939",
  "clu": "1",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 153,
  "cropland": true,
  "plantingDate": "10/07/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 50,
    "name": "KYLE MCCONNELL"
   },
   {
    "percent": 50,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3528",
  "cards": [
   [
    "14.N BAM S",
    76.5
   ],
   [
    "14.S BAM S",
    76.5
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   7,
   13,
   40
  ]
 },
 {
  "farm": "3703",
  "tract": "6942",
  "clu": "2",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 159.7,
  "cropland": true,
  "plantingDate": "10/11/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3527",
  "cards": [
   [
    "17.E MULVIHILL",
    79.85
   ],
   [
    "17.W MULVIHILL",
    79.85
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   8,
   36
  ]
 },
 {
  "farm": "3705",
  "tract": "6945",
  "clu": "1C",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 79.09,
  "cropland": true,
  "plantingDate": "10/14/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3527",
  "cards": [
   "43.E E/2 S/4"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   8,
   29
  ]
 },
 {
  "farm": "3705",
  "tract": "6946",
  "clu": "1B",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 77.43,
  "cropland": true,
  "plantingDate": "10/14/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3527",
  "cards": [
   "44.E S. TOWN"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   8,
   29
  ]
 },
 {
  "farm": "3707",
  "tract": "6951",
  "clu": "1B",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 79.2,
  "cropland": true,
  "plantingDate": "10/05/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3527",
  "cards": [
   "32.S HIGHLAND W"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   9,
   25
  ]
 },
 {
  "farm": "3708",
  "tract": "6952",
  "clu": "1",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 157.53,
  "cropland": true,
  "plantingDate": "10/04/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3527",
  "cards": [
   [
    "30.W POLE RD SEC 15",
    78
   ],
   [
    "30.E POLE RD SEC 15",
    78.7
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   9
  ]
 },
 {
  "farm": "3709",
  "tract": "6953",
  "clu": "1",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 101.9,
  "cropland": true,
  "plantingDate": "10/04/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 50,
    "name": "KYLE MCCONNELL"
   },
   {
    "percent": 50,
    "name": "M77 AG LLC"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3528",
  "cards": [
   [
    "31.W POLE RD SEC 14",
    51.9
   ],
   [
    "31.E POLE RD SEC 14",
    50
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   9,
   16
  ]
 },
 {
  "farm": "3669",
  "tract": "906",
  "clu": "1A",
  "crop": "MILET",
  "varType": "PRL",
  "intendedUse": "FG",
  "irrigation": "N",
  "acres": 46,
  "cropland": true,
  "plantingDate": "06/27/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3526",
  "cards": [
   "25.C NW MICHAEL CROP"
  ],
  "openOn": null,
  "note": "CLUs 1A and 1B (108.87 ac cropland) make up 25.C (107.9 ac on the card).",
  "pages": [
   11,
   33
  ]
 },
 {
  "farm": "3669",
  "tract": "906",
  "clu": "1B",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 62.87,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3526",
  "cards": [
   "25.C NW MICHAEL CROP"
  ],
  "openOn": null,
  "note": "CLUs 1A and 1B (108.87 ac cropland) make up 25.C (107.9 ac on the card).",
  "pages": [
   11,
   33
  ]
 },
 {
  "farm": "3701",
  "tract": "6934",
  "clu": "1",
  "crop": "MIXFG",
  "varType": "IGS",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 109.36,
  "cropland": true,
  "plantingDate": "11/02/2017",
  "endYear": "2030",
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "201 BY NEAL'S",
   "299 BY NEALS"
  ],
  "note": "",
  "pages": [
   11
  ]
 },
 {
  "farm": "3701",
  "tract": "6934",
  "clu": "2",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 47.83,
  "cropland": false,
  "plantingDate": null,
  "endYear": "2030",
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "201 BY NEAL'S",
   "299 BY NEALS"
  ],
  "note": "",
  "pages": [
   11
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1A",
  "crop": "TRICL",
  "varType": "",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 80,
  "cropland": true,
  "plantingDate": "09/27/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "20 NORTH",
   "21 SMALL",
   "22 TOP HILL",
   "23.E SW PAULI",
   "23.W SW PAULI",
   "24.E SE PAULI",
   "24.W SE PAULI",
   "202 SECTION"
  ],
  "note": "",
  "pages": [
   11
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1A",
  "crop": "TRICL",
  "varType": "",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 80,
  "cropland": true,
  "plantingDate": "09/27/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "20 NORTH",
   "21 SMALL",
   "22 TOP HILL",
   "23.E SW PAULI",
   "23.W SW PAULI",
   "24.E SE PAULI",
   "24.W SE PAULI",
   "202 SECTION"
  ],
  "note": "",
  "pages": [
   11
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1B",
  "crop": "TRICL",
  "varType": "",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 160,
  "cropland": true,
  "plantingDate": "09/28/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "22 TOP HILL"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   11
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1B",
  "crop": "TRICL",
  "varType": "",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 160,
  "cropland": true,
  "plantingDate": "09/28/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "22 TOP HILL"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   11
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1C",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 77.2,
  "cropland": true,
  "plantingDate": "10/02/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "20 NORTH",
   "21 SMALL",
   "22 TOP HILL",
   "23.E SW PAULI",
   "23.W SW PAULI",
   "24.E SE PAULI",
   "24.W SE PAULI",
   "202 SECTION"
  ],
  "note": "",
  "pages": [
   11
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1D",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 128.4,
  "cropland": true,
  "plantingDate": "10/02/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   [
    "24.E SE PAULI",
    64.2
   ],
   [
    "24.W SE PAULI",
    64.2
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   12
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "1E",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 6.42,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "20 NORTH",
   "21 SMALL",
   "22 TOP HILL",
   "23.E SW PAULI",
   "23.W SW PAULI",
   "24.E SE PAULI",
   "24.W SE PAULI",
   "202 SECTION"
  ],
  "note": "",
  "pages": [
   12
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "2",
  "crop": "TRICL",
  "varType": "",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 73.28,
  "cropland": true,
  "plantingDate": "09/27/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "20 NORTH",
   "21 SMALL",
   "22 TOP HILL",
   "23.E SW PAULI",
   "23.W SW PAULI",
   "24.E SE PAULI",
   "24.W SE PAULI",
   "202 SECTION"
  ],
  "note": "",
  "pages": [
   12
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "2",
  "crop": "TRICL",
  "varType": "",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 73.28,
  "cropland": true,
  "plantingDate": "09/27/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "20 NORTH",
   "21 SMALL",
   "22 TOP HILL",
   "23.E SW PAULI",
   "23.W SW PAULI",
   "24.E SE PAULI",
   "24.W SE PAULI",
   "202 SECTION"
  ],
  "note": "",
  "pages": [
   12
  ]
 },
 {
  "farm": "3701",
  "tract": "6935",
  "clu": "3",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 98.53,
  "cropland": false,
  "plantingDate": null,
  "endYear": "2030",
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "20 NORTH",
   "21 SMALL",
   "22 TOP HILL",
   "23.E SW PAULI",
   "23.W SW PAULI",
   "24.E SE PAULI",
   "24.W SE PAULI",
   "202 SECTION"
  ],
  "note": "",
  "pages": [
   12
  ]
 },
 {
  "farm": "3702",
  "tract": "6936",
  "clu": "1A",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 79.25,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "10.N OURS"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   12,
   39
  ]
 },
 {
  "farm": "3702",
  "tract": "6936",
  "clu": "1B",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 79.25,
  "cropland": true,
  "plantingDate": "10/06/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "10.S OURS"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   12,
   39
  ]
 },
 {
  "farm": "3702",
  "tract": "6937",
  "clu": "2",
  "crop": "MIXFG",
  "varType": "IGS",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 10.5,
  "cropland": true,
  "plantingDate": "07/06/2022",
  "endYear": "2035",
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3526",
  "cards": [
   "198 BAM E"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   12,
   39
  ]
 },
 {
  "farm": "3702",
  "tract": "6938",
  "clu": "1A",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 78.55,
  "cropland": true,
  "plantingDate": "10/06/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3526",
  "cards": [
   "12.W BAM W"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   12,
   40
  ]
 },
 {
  "farm": "3702",
  "tract": "6938",
  "clu": "1A",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "2-GR",
  "irrigation": "N",
  "acres": 78.55,
  "cropland": true,
  "plantingDate": "10/06/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3526",
  "cards": [
   "12.W BAM W"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   12,
   40
  ]
 },
 {
  "farm": "3702",
  "tract": "6939",
  "clu": "1",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 153,
  "cropland": true,
  "plantingDate": "10/07/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   [
    "14.N BAM S",
    76.5
   ],
   [
    "14.S BAM S",
    76.5
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   13,
   40
  ]
 },
 {
  "farm": "3702",
  "tract": "6939",
  "clu": "2",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 7.08,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "14.N BAM S",
   "14.S BAM S",
   "199 BAM S"
  ],
  "note": "",
  "pages": [
   13,
   40
  ]
 },
 {
  "farm": "3702",
  "tract": "6940",
  "clu": "1",
  "crop": "MIXFG",
  "varType": "IGS",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 184.76,
  "cropland": true,
  "plantingDate": "07/14/2021",
  "endYear": "2030",
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3526",
  "cards": [
   "101 WEST L"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   13,
   41
  ]
 },
 {
  "farm": "3703",
  "tract": "6941",
  "clu": "1A",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 80.09,
  "cropland": true,
  "plantingDate": "05/13/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3526",
  "cards": [
   "16.W BIG FIELD"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   13,
   35
  ]
 },
 {
  "farm": "3703",
  "tract": "6942",
  "clu": "2",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 159.7,
  "cropland": true,
  "plantingDate": "10/11/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3526",
  "cards": [
   [
    "17.E MULVIHILL",
    79.85
   ],
   [
    "17.W MULVIHILL",
    79.85
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   13,
   36
  ]
 },
 {
  "farm": "3704",
  "tract": "6943",
  "clu": "1A",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 78.9,
  "cropland": true,
  "plantingDate": "05/24/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "61.N HIGHLAND E"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   14
  ]
 },
 {
  "farm": "3705",
  "tract": "6945",
  "clu": "1A",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 79.08,
  "cropland": true,
  "plantingDate": "06/04/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "42.W E/2 N/4"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   14,
   29
  ]
 },
 {
  "farm": "3705",
  "tract": "6945",
  "clu": "1C",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 79.09,
  "cropland": true,
  "plantingDate": "10/14/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "43.E E/2 S/4"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   14,
   29
  ]
 },
 {
  "farm": "3705",
  "tract": "6945",
  "clu": "1D",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 79.08,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "43.W E/2 S/4"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   14,
   29
  ]
 },
 {
  "farm": "3705",
  "tract": "6946",
  "clu": "1B",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 77.43,
  "cropland": true,
  "plantingDate": "10/14/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "44.E S. TOWN"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   14,
   29
  ]
 },
 {
  "farm": "3705",
  "tract": "6947",
  "clu": "2",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 3.63,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "45 W. TOWN"
  ],
  "openOn": null,
  "note": "113.62 ac corn plus 3.63 ac grass make up the 117.25 ac card.",
  "pages": [
   14,
   30
  ]
 },
 {
  "farm": "3705",
  "tract": "6948",
  "clu": "1",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 68.26,
  "cropland": true,
  "plantingDate": "05/23/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "46 HOME W"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   14,
   30
  ]
 },
 {
  "farm": "3705",
  "tract": "6948",
  "clu": "3",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 136.35,
  "cropland": false,
  "plantingDate": null,
  "endYear": "2031",
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "401 HOME PLACE"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   14,
   30
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "1",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 49.61,
  "cropland": true,
  "plantingDate": "05/22/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3526",
  "cards": [
   "53 DICKS S"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   15,
   27
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "5",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 4.58,
  "cropland": true,
  "plantingDate": "05/22/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3526",
  "cards": null,
  "openOn": [
   "53 DICKS N",
   "53 DICKS S"
  ],
  "note": "",
  "pages": [
   15,
   27
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "6",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 25.67,
  "cropland": true,
  "plantingDate": "05/22/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "3526",
  "cards": [
   "53 DICKS N"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   15,
   27
  ]
 },
 {
  "farm": "3707",
  "tract": "6951",
  "clu": "1A",
  "crop": "SORGH",
  "varType": "GRS",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 79.2,
  "cropland": true,
  "plantingDate": "06/12/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "32.N HIGHLAND W"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   15,
   25
  ]
 },
 {
  "farm": "3707",
  "tract": "6951",
  "clu": "1B",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 79.2,
  "cropland": true,
  "plantingDate": "10/05/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "32.S HIGHLAND W"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   15,
   25
  ]
 },
 {
  "farm": "3708",
  "tract": "6952",
  "clu": "1",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 157.53,
  "cropland": true,
  "plantingDate": "10/04/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3526",
  "cards": [
   [
    "30.W POLE RD SEC 15",
    78
   ],
   [
    "30.E POLE RD SEC 15",
    78.7
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   15
  ]
 },
 {
  "farm": "3709",
  "tract": "6953",
  "clu": "1",
  "crop": "WHEAT",
  "varType": "HRW",
  "intendedUse": "1-GZ",
  "irrigation": "N",
  "acres": 101.9,
  "cropland": true,
  "plantingDate": "10/04/2023",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Logan, Colorado",
  "napUnit": "3526",
  "cards": [
   [
    "31.W POLE RD SEC 14",
    51.9
   ],
   [
    "31.E POLE RD SEC 14",
    50
   ]
  ],
  "openOn": null,
  "note": "",
  "pages": [
   16
  ]
 },
 {
  "farm": "3710",
  "tract": "6954",
  "clu": "1C",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 6.39,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "599 PAULS"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   16,
   23
  ]
 },
 {
  "farm": "3711",
  "tract": "6955",
  "clu": "1A",
  "crop": "CORN",
  "varType": "YEL",
  "intendedUse": "GR",
  "irrigation": "N",
  "acres": 79.31,
  "cropland": true,
  "plantingDate": "05/24/2024",
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "33.N ORPHAS"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   16,
   21
  ]
 },
 {
  "farm": "3711",
  "tract": "6955",
  "clu": "1B",
  "crop": "FALOW",
  "varType": "",
  "intendedUse": "",
  "irrigation": "N",
  "acres": 79.4,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "KYLE MCCONNELL"
   }
  ],
  "location": "Phillips, Colorado",
  "napUnit": "3526",
  "cards": [
   "33.S ORPHAS"
  ],
  "openOn": null,
  "note": "",
  "pages": [
   16,
   21
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "2",
  "crop": "MIXFG",
  "varType": "IGS",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 7.27,
  "cropland": true,
  "plantingDate": "10/01/1990",
  "endYear": "2031",
  "shares": [
   {
    "percent": 100,
    "name": "RICHARD L HINDE"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "310",
  "cards": null,
  "openOn": [
   "53 DICKS N",
   "53 DICKS S"
  ],
  "note": "",
  "pages": [
   27
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "3",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 8.88,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "RICHARD L HINDE"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "310",
  "cards": null,
  "openOn": [
   "53 DICKS N",
   "53 DICKS S"
  ],
  "note": "",
  "pages": [
   27
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "4",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 12.83,
  "cropland": false,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "RICHARD L HINDE"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "310",
  "cards": null,
  "openOn": [
   "53 DICKS N",
   "53 DICKS S"
  ],
  "note": "",
  "pages": [
   27
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "7",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 11.36,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "RICHARD L HINDE"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "310",
  "cards": null,
  "openOn": [
   "53 DICKS N",
   "53 DICKS S"
  ],
  "note": "",
  "pages": [
   27
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "8",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 22.17,
  "cropland": false,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "RICHARD L HINDE"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "310",
  "cards": null,
  "openOn": [
   "53 DICKS N",
   "53 DICKS S"
  ],
  "note": "",
  "pages": [
   27
  ]
 },
 {
  "farm": "3706",
  "tract": "6950",
  "clu": "9",
  "crop": "GRASS",
  "varType": "NAG",
  "intendedUse": "GZ",
  "irrigation": "N",
  "acres": 17.01,
  "cropland": true,
  "plantingDate": null,
  "endYear": null,
  "shares": [
   {
    "percent": 100,
    "name": "RICHARD L HINDE"
   }
  ],
  "location": "Sedgwick, Colorado",
  "napUnit": "310",
  "cards": null,
  "openOn": [
   "53 DICKS N",
   "53 DICKS S"
  ],
  "note": "",
  "pages": [
   27
  ]
 }
];

module.exports = { REPORT, TRACTS, LINES };
