const r=`{\r
  "dataWorkspace": {\r
    "defaultSourceId": "src_data_41rfct",\r
    "sources": {\r
      "src_data_41rfct": {\r
        "data": {\r
          "aggregates": {\r
            "avg": {\r
              "flowgpm": 979,\r
              "motorloadpct": 63.75,\r
              "pressurepsi": 54.490151515151524,\r
              "sampleorder": 13.090909090909092,\r
              "stationalerts": 0.3333333333333333,\r
              "stationflow": 3916,\r
              "stationonline": 3.3333333333333335,\r
              "stationpressure": 65.23333333333318\r
            },\r
            "count": 132,\r
            "distinctCount": {\r
              "equipment": 4,\r
              "equipmentid": 4,\r
              "flowgpm": 9,\r
              "hour": 11,\r
              "motorloadpct": 9,\r
              "pressurepsi": 68,\r
              "readingid": 132,\r
              "recordtype": 2,\r
              "sampleorder": 13,\r
              "scenario": 3,\r
              "stationalerts": 2,\r
              "stationflow": 3,\r
              "stationonline": 2,\r
              "stationpressure": 2,\r
              "status": 3\r
            },\r
            "first": {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "Snapshot",\r
              "motorloadpct": 72,\r
              "pressurepsi": 68.4,\r
              "readingid": "0-P-101-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 100,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            "max": {\r
              "flowgpm": 1459,\r
              "motorloadpct": 94,\r
              "pressurepsi": 72.8,\r
              "sampleorder": 100,\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4\r
            },\r
            "min": {\r
              "flowgpm": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "sampleorder": 0,\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9\r
            },\r
            "sum": {\r
              "flowgpm": 129228,\r
              "motorloadpct": 8415,\r
              "pressurepsi": 7192.700000000001,\r
              "sampleorder": 1728,\r
              "stationalerts": 44,\r
              "stationflow": 516912,\r
              "stationonline": 440,\r
              "stationpressure": 8610.79999999998\r
            }\r
          },\r
          "fields": {\r
            "equipment": {\r
              "dataType": "text",\r
              "displayName": "equipment",\r
              "key": "equipment",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "equipmentid": {\r
              "dataType": "text",\r
              "displayName": "equipmentid",\r
              "key": "equipmentid",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "flowgpm": {\r
              "dataType": "number",\r
              "displayName": "flowgpm",\r
              "key": "flowgpm",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "hour": {\r
              "dataType": "text",\r
              "displayName": "hour",\r
              "key": "hour",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "motorloadpct": {\r
              "dataType": "number",\r
              "displayName": "motorloadpct",\r
              "key": "motorloadpct",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "pressurepsi": {\r
              "dataType": "number",\r
              "displayName": "pressurepsi",\r
              "key": "pressurepsi",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "readingid": {\r
              "dataType": "text",\r
              "displayName": "readingid",\r
              "key": "readingid",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "recordtype": {\r
              "dataType": "text",\r
              "displayName": "recordtype",\r
              "key": "recordtype",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "sampleorder": {\r
              "dataType": "number",\r
              "displayName": "sampleorder",\r
              "key": "sampleorder",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "scenario": {\r
              "dataType": "text",\r
              "displayName": "scenario",\r
              "key": "scenario",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "stationalerts": {\r
              "dataType": "number",\r
              "displayName": "stationalerts",\r
              "key": "stationalerts",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "stationflow": {\r
              "dataType": "number",\r
              "displayName": "stationflow",\r
              "key": "stationflow",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "stationonline": {\r
              "dataType": "number",\r
              "displayName": "stationonline",\r
              "key": "stationonline",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "stationpressure": {\r
              "dataType": "number",\r
              "displayName": "stationpressure",\r
              "key": "stationpressure",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "status": {\r
              "dataType": "text",\r
              "displayName": "status",\r
              "key": "status",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            }\r
          },\r
          "loadStatus": {\r
            "fetchInProgress": false,\r
            "loadedRowCount": 132,\r
            "moreRowsAvailable": false\r
          },\r
          "map": {\r
            "bindings": {\r
              "details": [],\r
              "tooltip": []\r
            },\r
            "coordinateCounts": {\r
              "dataViewRowCount": 132,\r
              "incompletePairCount": 0,\r
              "invalidPairCount": 0,\r
              "nonNumericPairCount": 0,\r
              "outOfRangePairCount": 0,\r
              "validPairCount": 0\r
            },\r
            "diagnostics": [],\r
            "hasAddress": false,\r
            "hasGeometry": false,\r
            "hasLatLon": false,\r
            "hasXY": false,\r
            "invalidFeatureCount": 132,\r
            "layers": [],\r
            "locationCounts": {\r
              "filteredRowCount": 0,\r
              "geometryParseFailureCount": 0,\r
              "incompletePairCount": 0,\r
              "nonNumericCount": 0,\r
              "outOfRangeCount": 0,\r
              "totalInputRows": 132,\r
              "validFeatureCount": 0\r
            },\r
            "mode": "none",\r
            "warnings": [\r
              "Choose geometry, coordinate, or address fields through the map layer source bindings. All source fields must be present in Values.",\r
              "132 row(s) have invalid or missing map locations."\r
            ]\r
          },\r
          "rowKeys": [\r
            "row_18xo1w7",\r
            "row_1cp5wzj",\r
            "row_1kaylkp",\r
            "row_axna3d",\r
            "row_f08d7z",\r
            "row_1ylec7k",\r
            "row_vwcbqk",\r
            "row_1rjl5xc",\r
            "row_czrl4q",\r
            "row_997qlh",\r
            "row_1lrkrn3",\r
            "row_14k3c23",\r
            "row_3cg9yw",\r
            "row_6l29ae",\r
            "row_1cjjb91",\r
            "row_1llcm0w",\r
            "row_17zjlho",\r
            "row_2zvr9u",\r
            "row_uqhl2b",\r
            "row_1switvb",\r
            "row_ce5u7i",\r
            "row_106exel",\r
            "row_6rwv7r",\r
            "row_my7t4p",\r
            "row_aja0ig",\r
            "row_tqxc5m",\r
            "row_1n8b9hx",\r
            "row_1863ofk",\r
            "row_rpt0e3",\r
            "row_1qxevj3",\r
            "row_1nsx7x",\r
            "row_nwkx7t",\r
            "row_1pjh8k7",\r
            "row_kjws17",\r
            "row_ewavui",\r
            "row_c37v67",\r
            "row_l8wzro",\r
            "row_118n79w",\r
            "row_1sw7p8f",\r
            "row_10h42aa",\r
            "row_195c3vh",\r
            "row_14i9ujs",\r
            "row_1gvks4r",\r
            "row_f3qvye",\r
            "row_7ocbdw",\r
            "row_12qqcrt",\r
            "row_17zef9c",\r
            "row_icmcvc",\r
            "row_19vntnq",\r
            "row_1blv7f3",\r
            "row_ekxxol",\r
            "row_1x3huxj",\r
            "row_zuvoy",\r
            "row_winw3j",\r
            "row_1edgs7v",\r
            "row_1gwjoh1",\r
            "row_j0vx4c",\r
            "row_167qkis",\r
            "row_cpevz7",\r
            "row_1eukcdf",\r
            "row_p3h4a1",\r
            "row_1ryxjnm",\r
            "row_127r9up",\r
            "row_w6utm5",\r
            "row_19eltbj",\r
            "row_19raidf",\r
            "row_179d1y4",\r
            "row_1s6blik",\r
            "row_1ty59y5",\r
            "row_y5ac6z",\r
            "row_jwouyc",\r
            "row_1usmmkd",\r
            "row_1umtqtc",\r
            "row_tce3um",\r
            "row_1oqahho",\r
            "row_12q9n7y",\r
            "row_1n7bii4",\r
            "row_e75zwj",\r
            "row_271iva",\r
            "row_28jxhy",\r
            "row_jlo4wj",\r
            "row_1391ocw",\r
            "row_ivkago",\r
            "row_1a106ul",\r
            "row_e7xmyd",\r
            "row_xdlavj",\r
            "row_18alp3f",\r
            "row_2hpwj8",\r
            "row_jqhpj8",\r
            "row_gixzro",\r
            "row_2ot6si",\r
            "row_1cewfhq",\r
            "row_4atcrs",\r
            "row_1l42zmf",\r
            "row_zdxhf3",\r
            "row_q41nbz",\r
            "row_v8lkjx",\r
            "row_tuphy2",\r
            "row_se5ogo",\r
            "row_1j00uvb",\r
            "row_11hfz2w",\r
            "row_11aeeol",\r
            "row_kfixg2",\r
            "row_1hmyhu6",\r
            "row_15l3iex",\r
            "row_1ox6ozw",\r
            "row_f5hp7r",\r
            "row_10z392q",\r
            "row_13ujnct",\r
            "row_18h9e4g",\r
            "row_1ovv55c",\r
            "row_17vruva",\r
            "row_f7z9ir",\r
            "row_2xc0q1",\r
            "row_c80kry",\r
            "row_1wu3ucf",\r
            "row_dedqk",\r
            "row_lmcdb0",\r
            "row_1dlkrjy",\r
            "row_68l29q",\r
            "row_18f1ikg",\r
            "row_avk2ln",\r
            "row_numvrv",\r
            "row_20bcnj",\r
            "row_nszhk4",\r
            "row_1ilzijb",\r
            "row_gxtoqh",\r
            "row_1l5j2ca",\r
            "row_1ecszti",\r
            "row_1a4vskz",\r
            "row_jwfkki",\r
            "row_19s5hf3"\r
          ],\r
          "rows": [\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "Snapshot",\r
              "motorloadpct": 72,\r
              "pressurepsi": 68.4,\r
              "readingid": "0-P-101-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 100,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "07:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 69.2,\r
              "readingid": "0-P-101-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "08:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 69.9,\r
              "readingid": "0-P-101-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "09:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 70.4,\r
              "readingid": "0-P-101-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "10:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 70.2,\r
              "readingid": "0-P-101-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "11:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 69.6,\r
              "readingid": "0-P-101-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "12:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 68.6,\r
              "readingid": "0-P-101-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "13:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 67.6,\r
              "readingid": "0-P-101-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "14:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 66.8,\r
              "readingid": "0-P-101-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "15:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 66.6,\r
              "readingid": "0-P-101-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "16:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 66.9,\r
              "readingid": "0-P-101-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "Snapshot",\r
              "motorloadpct": 67,\r
              "pressurepsi": 65.8,\r
              "readingid": "0-P-102-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 100,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "07:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 67.6,\r
              "readingid": "0-P-102-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "08:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 67.9,\r
              "readingid": "0-P-102-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "09:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 67.7,\r
              "readingid": "0-P-102-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "10:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 66.9,\r
              "readingid": "0-P-102-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "11:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 65.9,\r
              "readingid": "0-P-102-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "12:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 65,\r
              "readingid": "0-P-102-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "13:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 64.3,\r
              "readingid": "0-P-102-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "14:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 64.2,\r
              "readingid": "0-P-102-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "15:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 64.6,\r
              "readingid": "0-P-102-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1150,\r
              "hour": "16:00",\r
              "motorloadpct": 67,\r
              "pressurepsi": 65.3,\r
              "readingid": "0-P-102-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "Snapshot",\r
              "motorloadpct": 82,\r
              "pressurepsi": 62,\r
              "readingid": "0-P-103-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 100,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "07:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 64.1,\r
              "readingid": "0-P-103-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "08:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 63.8,\r
              "readingid": "0-P-103-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "09:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 63.1,\r
              "readingid": "0-P-103-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "10:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 62.1,\r
              "readingid": "0-P-103-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "11:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 61.2,\r
              "readingid": "0-P-103-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "12:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 60.7,\r
              "readingid": "0-P-103-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "13:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 60.8,\r
              "readingid": "0-P-103-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "14:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 61.2,\r
              "readingid": "0-P-103-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "15:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 61.9,\r
              "readingid": "0-P-103-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "16:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 62.5,\r
              "readingid": "0-P-103-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 100,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "07:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "08:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "09:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "10:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "11:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "12:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "13:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "14:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "15:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 0,\r
              "hour": "16:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-P-104-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Normal duty",\r
              "stationalerts": 0,\r
              "stationflow": 3440,\r
              "stationonline": 3,\r
              "stationpressure": 65.4,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "Snapshot",\r
              "motorloadpct": 81,\r
              "pressurepsi": 70.8,\r
              "readingid": "1-P-101-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 99,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "07:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 71.6,\r
              "readingid": "1-P-101-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "08:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 72.3,\r
              "readingid": "1-P-101-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "09:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 72.8,\r
              "readingid": "1-P-101-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "10:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 72.6,\r
              "readingid": "1-P-101-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "11:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 72,\r
              "readingid": "1-P-101-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "12:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 71,\r
              "readingid": "1-P-101-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "13:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 70,\r
              "readingid": "1-P-101-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "14:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 69.2,\r
              "readingid": "1-P-101-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "15:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 69,\r
              "readingid": "1-P-101-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1459,\r
              "hour": "16:00",\r
              "motorloadpct": 81,\r
              "pressurepsi": 69.3,\r
              "readingid": "1-P-101-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "Snapshot",\r
              "motorloadpct": 76,\r
              "pressurepsi": 68.2,\r
              "readingid": "1-P-102-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 99,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "07:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 70,\r
              "readingid": "1-P-102-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "08:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 70.3,\r
              "readingid": "1-P-102-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "09:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 70.1,\r
              "readingid": "1-P-102-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "10:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 69.3,\r
              "readingid": "1-P-102-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "11:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 68.3,\r
              "readingid": "1-P-102-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "12:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 67.4,\r
              "readingid": "1-P-102-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "13:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 66.7,\r
              "readingid": "1-P-102-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "14:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 66.6,\r
              "readingid": "1-P-102-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "15:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 67,\r
              "readingid": "1-P-102-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 1311,\r
              "hour": "16:00",\r
              "motorloadpct": 76,\r
              "pressurepsi": 67.7,\r
              "readingid": "1-P-102-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "Snapshot",\r
              "motorloadpct": 94,\r
              "pressurepsi": 55.9,\r
              "readingid": "1-P-103-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 99,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "07:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 58,\r
              "readingid": "1-P-103-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "08:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 57.7,\r
              "readingid": "1-P-103-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "09:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 57,\r
              "readingid": "1-P-103-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "10:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 56,\r
              "readingid": "1-P-103-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "11:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 55.1,\r
              "readingid": "1-P-103-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "12:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 54.6,\r
              "readingid": "1-P-103-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "13:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 54.7,\r
              "readingid": "1-P-103-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "14:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 55.1,\r
              "readingid": "1-P-103-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "15:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 55.8,\r
              "readingid": "1-P-103-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1151,\r
              "hour": "16:00",\r
              "motorloadpct": 94,\r
              "pressurepsi": 56.4,\r
              "readingid": "1-P-103-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Warning"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "Snapshot",\r
              "motorloadpct": 74,\r
              "pressurepsi": 66.7,\r
              "readingid": "1-P-104-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 99,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "07:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 68.4,\r
              "readingid": "1-P-104-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "08:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 67.6,\r
              "readingid": "1-P-104-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "09:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 66.7,\r
              "readingid": "1-P-104-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "10:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 65.9,\r
              "readingid": "1-P-104-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "11:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 65.6,\r
              "readingid": "1-P-104-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "12:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 65.8,\r
              "readingid": "1-P-104-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "13:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 66.4,\r
              "readingid": "1-P-104-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "14:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 67,\r
              "readingid": "1-P-104-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "15:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 67.5,\r
              "readingid": "1-P-104-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 1117,\r
              "hour": "16:00",\r
              "motorloadpct": 74,\r
              "pressurepsi": 67.5,\r
              "readingid": "1-P-104-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Peak demand",\r
              "stationalerts": 1,\r
              "stationflow": 5038,\r
              "stationonline": 4,\r
              "stationpressure": 65.4,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "Snapshot",\r
              "motorloadpct": 72,\r
              "pressurepsi": 68.4,\r
              "readingid": "2-P-101-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 98,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "07:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 69.2,\r
              "readingid": "2-P-101-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "08:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 69.9,\r
              "readingid": "2-P-101-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "09:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 70.4,\r
              "readingid": "2-P-101-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "10:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 70.2,\r
              "readingid": "2-P-101-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "11:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 69.6,\r
              "readingid": "2-P-101-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "12:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 68.6,\r
              "readingid": "2-P-101-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "13:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 67.6,\r
              "readingid": "2-P-101-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "14:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 66.8,\r
              "readingid": "2-P-101-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "15:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 66.6,\r
              "readingid": "2-P-101-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 01",\r
              "equipmentid": "P-101",\r
              "flowgpm": 1280,\r
              "hour": "16:00",\r
              "motorloadpct": 72,\r
              "pressurepsi": 66.9,\r
              "readingid": "2-P-101-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 98,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "07:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "08:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "09:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "10:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "11:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "12:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "13:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "14:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "15:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 02",\r
              "equipmentid": "P-102",\r
              "flowgpm": 0,\r
              "hour": "16:00",\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-P-102-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Stopped"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "Snapshot",\r
              "motorloadpct": 82,\r
              "pressurepsi": 62,\r
              "readingid": "2-P-103-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 98,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "07:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 64.1,\r
              "readingid": "2-P-103-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "08:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 63.8,\r
              "readingid": "2-P-103-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "09:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 63.1,\r
              "readingid": "2-P-103-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "10:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 62.1,\r
              "readingid": "2-P-103-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "11:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 61.2,\r
              "readingid": "2-P-103-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "12:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 60.7,\r
              "readingid": "2-P-103-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "13:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 60.8,\r
              "readingid": "2-P-103-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "14:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 61.2,\r
              "readingid": "2-P-103-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "15:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 61.9,\r
              "readingid": "2-P-103-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Booster 03",\r
              "equipmentid": "P-103",\r
              "flowgpm": 1010,\r
              "hour": "16:00",\r
              "motorloadpct": 82,\r
              "pressurepsi": 62.5,\r
              "readingid": "2-P-103-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "Snapshot",\r
              "motorloadpct": 65,\r
              "pressurepsi": 64.3,\r
              "readingid": "2-P-104-snapshot",\r
              "recordtype": "Snapshot",\r
              "sampleorder": 98,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "07:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 66,\r
              "readingid": "2-P-104-0",\r
              "recordtype": "Trend",\r
              "sampleorder": 0,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "08:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 65.2,\r
              "readingid": "2-P-104-1",\r
              "recordtype": "Trend",\r
              "sampleorder": 1,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "09:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 64.3,\r
              "readingid": "2-P-104-2",\r
              "recordtype": "Trend",\r
              "sampleorder": 2,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "10:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 63.5,\r
              "readingid": "2-P-104-3",\r
              "recordtype": "Trend",\r
              "sampleorder": 3,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "11:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 63.2,\r
              "readingid": "2-P-104-4",\r
              "recordtype": "Trend",\r
              "sampleorder": 4,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "12:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 63.4,\r
              "readingid": "2-P-104-5",\r
              "recordtype": "Trend",\r
              "sampleorder": 5,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "13:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 64,\r
              "readingid": "2-P-104-6",\r
              "recordtype": "Trend",\r
              "sampleorder": 6,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "14:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 64.6,\r
              "readingid": "2-P-104-7",\r
              "recordtype": "Trend",\r
              "sampleorder": 7,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "15:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 65.1,\r
              "readingid": "2-P-104-8",\r
              "recordtype": "Trend",\r
              "sampleorder": 8,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            },\r
            {\r
              "equipment": "Standby 04",\r
              "equipmentid": "P-104",\r
              "flowgpm": 980,\r
              "hour": "16:00",\r
              "motorloadpct": 65,\r
              "pressurepsi": 65.1,\r
              "readingid": "2-P-104-9",\r
              "recordtype": "Trend",\r
              "sampleorder": 9,\r
              "scenario": "Maintenance",\r
              "stationalerts": 0,\r
              "stationflow": 3270,\r
              "stationonline": 3,\r
              "stationpressure": 64.9,\r
              "status": "Running"\r
            }\r
          ]\r
        },\r
        "fileName": "data.csv",\r
        "id": "src_data_41rfct",\r
        "kind": "csv",\r
        "name": "data"\r
      }\r
    }\r
  },\r
  "editorState": {\r
    "studioLayout": "{\\"editorPercent\\":38,\\"bottomHeight\\":210,\\"bottomOpen\\":true,\\"advanced\\":false}"\r
  },\r
  "format": "hyperpbi-playground-project",\r
  "formatVersion": 1,\r
  "metadata": {\r
    "createdAt": "2026-07-25T00:00:00.000Z",\r
    "id": "example-scene3d-animation-studio",\r
    "name": "3D Animation Studio",\r
    "updatedAt": "2026-07-25T00:00:00.000Z"\r
  },\r
  "runtimeConfiguration": {\r
    "bindings": {\r
      "map": {}\r
    },\r
    "fields": {\r
      "aliases": {}\r
    },\r
    "interactions": {\r
      "crossFilter": true,\r
      "externalMode": "auto",\r
      "multiSelect": true\r
    },\r
    "motion": {\r
      "enabled": true,\r
      "maxConcurrentAnimations": 8,\r
      "reducedMotion": "respect-system"\r
    },\r
    "providers": {\r
      "basemap": {\r
        "enabled": false,\r
        "provider": "none"\r
      },\r
      "geocoder": {\r
        "autocomplete": false,\r
        "cache": true,\r
        "enabled": false,\r
        "minScore": 80,\r
        "provider": "none",\r
        "userTriggeredOnly": true\r
      },\r
      "mode": "core",\r
      "privacyAcknowledged": false\r
    },\r
    "renderer": {\r
      "showHeader": false,\r
      "showRowCount": false,\r
      "showStudioButton": true\r
    },\r
    "security": {\r
      "cssMode": "scoped",\r
      "htmlMode": "sanitized",\r
      "showSanitizerWarnings": false,\r
      "svgMode": "sanitized"\r
    },\r
    "version": "1.0"\r
  },\r
  "specification": {\r
    "app": {\r
      "brand": {\r
        "icon": "dashboard",\r
        "shortTitle": "NW",\r
        "subtitle": "Operations",\r
        "title": "Northbank Water"\r
      },\r
      "container": "fluid",\r
      "density": "compact",\r
      "enabled": true,\r
      "layout": "horizontal",\r
      "navbar": {\r
        "visible": true\r
      },\r
      "pageHeader": {\r
        "meta": [\r
          {\r
            "intent": "info",\r
            "label": "Telemetry",\r
            "value": "Simulated"\r
          }\r
        ],\r
        "subtitle": "Rotating cooling fans, reciprocating actuator, status beacons and live data bindings",\r
        "title": "Interactive 3D Animation Studio",\r
        "visible": true\r
      }\r
    },\r
    "components": [\r
      {\r
        "field": "scenario",\r
        "id": "operating_scenario",\r
        "interaction": {\r
          "externalMode": "none",\r
          "internalMode": "filter",\r
          "targets": [\r
            "station_scene",\r
            "station_online",\r
            "station_flow",\r
            "station_pressure",\r
            "station_alerts",\r
            "pressure_trend",\r
            "motor_load",\r
            "asset_register"\r
          ]\r
        },\r
        "label": "Operating scenario",\r
        "options": [\r
          "Normal duty",\r
          "Peak demand",\r
          "Maintenance"\r
        ],\r
        "type": "segmentedControl"\r
      },\r
      {\r
        "id": "motion_guide",\r
        "text": "Choose an operating scenario, then watch motor-driven fans spin, a warning light pulse, and a stopped pump's beacon blink. Select any 3D asset to filter the linked charts. Open Visual Inspector to edit or add animations without writing code.",\r
        "type": "text"\r
      },\r
      {\r
        "children": [\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "stationonline",\r
            "id": "station_online",\r
            "intent": "success",\r
            "span": 3,\r
            "title": "Pumps online",\r
            "type": "kpi"\r
          },\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "stationflow",\r
            "id": "station_flow",\r
            "span": 3,\r
            "title": "Station flow (GPM)",\r
            "type": "kpi"\r
          },\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "stationpressure",\r
            "id": "station_pressure",\r
            "span": 3,\r
            "title": "Discharge pressure (PSI)",\r
            "type": "kpi"\r
          },\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "stationalerts",\r
            "id": "station_alerts",\r
            "intent": "warning",\r
            "span": 3,\r
            "title": "Active alerts",\r
            "type": "kpi"\r
          }\r
        ],\r
        "columns": 12,\r
        "id": "station_kpis",\r
        "type": "grid"\r
      },\r
      {\r
        "dataset": "equipment_readings",\r
        "height": 490,\r
        "id": "station_scene",\r
        "interaction": {\r
          "clearOnSecondClick": true,\r
          "enabled": true,\r
          "externalMode": "selection",\r
          "field": "equipmentid",\r
          "internalMode": "filter",\r
          "internalScope": "others",\r
          "multiSelect": true,\r
          "selectionMode": "replace",\r
          "showSelector": false,\r
          "targets": [\r
            "pressure_trend",\r
            "motor_load",\r
            "asset_register"\r
          ],\r
          "trigger": "click"\r
        },\r
        "objectIdField": "equipmentid",\r
        "objects": [\r
          {\r
            "dataKey": "P-101",\r
            "id": "P-101",\r
            "kind": "pump",\r
            "label": "P-101",\r
            "position": [\r
              -3.3,\r
              0,\r
              0.55\r
            ]\r
          },\r
          {\r
            "dataKey": "P-102",\r
            "id": "P-102",\r
            "kind": "pump",\r
            "label": "P-102",\r
            "position": [\r
              -1.1,\r
              0,\r
              0.55\r
            ]\r
          },\r
          {\r
            "dataKey": "P-103",\r
            "id": "P-103",\r
            "kind": "pump",\r
            "label": "P-103",\r
            "position": [\r
              1.1,\r
              0,\r
              0.55\r
            ]\r
          },\r
          {\r
            "dataKey": "P-104",\r
            "id": "P-104",\r
            "kind": "pump",\r
            "label": "P-104",\r
            "position": [\r
              3.3,\r
              0,\r
              0.55\r
            ]\r
          },\r
          {\r
            "id": "vessel_0",\r
            "kind": "tank",\r
            "label": "V-201",\r
            "position": [\r
              -2.55,\r
              0,\r
              -2.35\r
            ],\r
            "size": [\r
              1.05,\r
              0.94,\r
              1.05\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "vessel_inlet_0",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -2.55,\r
              0.46,\r
              -1.17\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.31,\r
              0.76,\r
              0.31\r
            ]\r
          },\r
          {\r
            "id": "vessel_1",\r
            "kind": "tank",\r
            "label": "V-202",\r
            "position": [\r
              2.55,\r
              0,\r
              -2.35\r
            ],\r
            "size": [\r
              1.05,\r
              0.94,\r
              1.05\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "vessel_inlet_1",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              2.55,\r
              0.46,\r
              -1.17\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.31,\r
              0.76,\r
              0.31\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "inlet_header",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              0,\r
              0.46,\r
              -0.92\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              90\r
            ],\r
            "size": [\r
              0.34,\r
              8.7,\r
              0.34\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "inlet_feed",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -4.35,\r
              0.46,\r
              -2.04\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.34,\r
              2.3,\r
              0.34\r
            ]\r
          },\r
          {\r
            "color": "#477fae",\r
            "id": "outlet_header",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              0,\r
              1.39,\r
              2.2\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              90\r
            ],\r
            "size": [\r
              0.33,\r
              9.3,\r
              0.33\r
            ]\r
          },\r
          {\r
            "color": "#477fae",\r
            "id": "outlet_feed",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              4.57,\r
              1.39,\r
              3\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.33,\r
              1.58,\r
              0.33\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "suction_0",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -4.05,\r
              0.46,\r
              -0.31\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.23,\r
              1.24,\r
              0.23\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "riser_0",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -3.8899999999999997,\r
              1.41,\r
              0.55\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.22,\r
              0.27,\r
              0.22\r
            ]\r
          },\r
          {\r
            "color": "#477fae",\r
            "id": "discharge_0",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -3.8899999999999997,\r
              1.39,\r
              1.39\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.21,\r
              1.65,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#90aabc",\r
            "id": "flange_0",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -3.8899999999999997,\r
              1.39,\r
              1.77\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.35,\r
              0.12,\r
              0.35\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "suction_1",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -1.85,\r
              0.46,\r
              -0.31\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.23,\r
              1.24,\r
              0.23\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "riser_1",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -1.69,\r
              1.41,\r
              0.55\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.22,\r
              0.27,\r
              0.22\r
            ]\r
          },\r
          {\r
            "color": "#477fae",\r
            "id": "discharge_1",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -1.69,\r
              1.39,\r
              1.39\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.21,\r
              1.65,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#90aabc",\r
            "id": "flange_1",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              -1.69,\r
              1.39,\r
              1.77\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.35,\r
              0.12,\r
              0.35\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "suction_2",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              0.3500000000000001,\r
              0.46,\r
              -0.31\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.23,\r
              1.24,\r
              0.23\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "riser_2",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              0.5100000000000001,\r
              1.41,\r
              0.55\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.22,\r
              0.27,\r
              0.22\r
            ]\r
          },\r
          {\r
            "color": "#477fae",\r
            "id": "discharge_2",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              0.5100000000000001,\r
              1.39,\r
              1.39\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.21,\r
              1.65,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#90aabc",\r
            "id": "flange_2",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              0.5100000000000001,\r
              1.39,\r
              1.77\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.35,\r
              0.12,\r
              0.35\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "suction_3",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              2.55,\r
              0.46,\r
              -0.31\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.23,\r
              1.24,\r
              0.23\r
            ]\r
          },\r
          {\r
            "color": "#3b94bb",\r
            "id": "riser_3",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              2.71,\r
              1.41,\r
              0.55\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.22,\r
              0.27,\r
              0.22\r
            ]\r
          },\r
          {\r
            "color": "#477fae",\r
            "id": "discharge_3",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              2.71,\r
              1.39,\r
              1.39\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.21,\r
              1.65,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#90aabc",\r
            "id": "flange_3",\r
            "kind": "pipe",\r
            "metalness": 0.33,\r
            "position": [\r
              2.71,\r
              1.39,\r
              1.77\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.35,\r
              0.12,\r
              0.35\r
            ]\r
          },\r
          {\r
            "color": "#66829a",\r
            "id": "header_support_0",\r
            "kind": "box",\r
            "position": [\r
              -4.6,\r
              0.61,\r
              2.2\r
            ],\r
            "size": [\r
              0.14,\r
              1.22,\r
              0.16\r
            ]\r
          },\r
          {\r
            "color": "#66829a",\r
            "id": "header_support_1",\r
            "kind": "box",\r
            "position": [\r
              0,\r
              0.61,\r
              2.2\r
            ],\r
            "size": [\r
              0.14,\r
              1.22,\r
              0.16\r
            ]\r
          },\r
          {\r
            "color": "#66829a",\r
            "id": "header_support_2",\r
            "kind": "box",\r
            "position": [\r
              4.6,\r
              0.61,\r
              2.2\r
            ],\r
            "size": [\r
              0.14,\r
              1.22,\r
              0.16\r
            ]\r
          },\r
          {\r
            "color": "#738da8",\r
            "id": "fan_stand_P_101",\r
            "kind": "box",\r
            "position": [\r
              -3.3,\r
              1.65,\r
              1.4\r
            ],\r
            "size": [\r
              0.12,\r
              0.75,\r
              0.14\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 75,\r
                "rpmField": "motorloadpct"\r
              }\r
            ],\r
            "color": "#5fc6ed",\r
            "dataKey": "P-101",\r
            "id": "fan_P_101",\r
            "kind": "fan",\r
            "label": "Cooling fan P-101",\r
            "position": [\r
              -3.3,\r
              2.12,\r
              1.4\r
            ],\r
            "size": [\r
              0.88,\r
              0.88,\r
              0.88\r
            ]\r
          },\r
          {\r
            "color": "#738da8",\r
            "id": "fan_stand_P_102",\r
            "kind": "box",\r
            "position": [\r
              -1.1,\r
              1.65,\r
              1.4\r
            ],\r
            "size": [\r
              0.12,\r
              0.75,\r
              0.14\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 75,\r
                "rpmField": "motorloadpct"\r
              }\r
            ],\r
            "color": "#5fc6ed",\r
            "dataKey": "P-102",\r
            "id": "fan_P_102",\r
            "kind": "fan",\r
            "label": "Cooling fan P-102",\r
            "position": [\r
              -1.1,\r
              2.12,\r
              1.4\r
            ],\r
            "size": [\r
              0.88,\r
              0.88,\r
              0.88\r
            ]\r
          },\r
          {\r
            "color": "#738da8",\r
            "id": "fan_stand_P_103",\r
            "kind": "box",\r
            "position": [\r
              1.1,\r
              1.65,\r
              1.4\r
            ],\r
            "size": [\r
              0.12,\r
              0.75,\r
              0.14\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 75,\r
                "rpmField": "motorloadpct"\r
              }\r
            ],\r
            "color": "#5fc6ed",\r
            "dataKey": "P-103",\r
            "id": "fan_P_103",\r
            "kind": "fan",\r
            "label": "Cooling fan P-103",\r
            "position": [\r
              1.1,\r
              2.12,\r
              1.4\r
            ],\r
            "size": [\r
              0.88,\r
              0.88,\r
              0.88\r
            ]\r
          },\r
          {\r
            "color": "#738da8",\r
            "id": "fan_stand_P_104",\r
            "kind": "box",\r
            "position": [\r
              3.3,\r
              1.65,\r
              1.4\r
            ],\r
            "size": [\r
              0.12,\r
              0.75,\r
              0.14\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 75,\r
                "rpmField": "motorloadpct"\r
              }\r
            ],\r
            "color": "#5fc6ed",\r
            "dataKey": "P-104",\r
            "id": "fan_P_104",\r
            "kind": "fan",\r
            "label": "Cooling fan P-104",\r
            "position": [\r
              3.3,\r
              2.12,\r
              1.4\r
            ],\r
            "size": [\r
              0.88,\r
              0.88,\r
              0.88\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "amplitude": 0.65,\r
                "enabledField": "status",\r
                "enabledValue": "Warning",\r
                "kind": "pulse",\r
                "period": 1.1\r
              }\r
            ],\r
            "color": "#ffac4b",\r
            "dataKey": "P-103",\r
            "id": "motion_alert",\r
            "kind": "sphere",\r
            "label": "Warning pulse",\r
            "position": [\r
              1.1,\r
              3.35,\r
              1.4\r
            ],\r
            "size": [\r
              0.25,\r
              0.25,\r
              0.25\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "amplitude": 0.25,\r
                "axis": "x",\r
                "enabledField": "flowgpm",\r
                "kind": "translate",\r
                "period": 2.4\r
              }\r
            ],\r
            "color": "#7ed7a7",\r
            "dataKey": "P-101",\r
            "id": "motion_actuator",\r
            "kind": "box",\r
            "label": "Reciprocating actuator",\r
            "position": [\r
              -3.3,\r
              1.18,\r
              1.45\r
            ],\r
            "size": [\r
              0.34,\r
              0.3,\r
              0.3\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "enabledField": "status",\r
                "enabledValue": "Stopped",\r
                "kind": "blink",\r
                "period": 1.2\r
              }\r
            ],\r
            "color": "#f7d45b",\r
            "dataKey": "P-102",\r
            "id": "motion_indicator",\r
            "kind": "sphere",\r
            "label": "Status beacon",\r
            "position": [\r
              -1.1,\r
              3.3,\r
              1.4\r
            ],\r
            "size": [\r
              0.2,\r
              0.2,\r
              0.2\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "amplitude": 0.45,\r
                "axis": "y",\r
                "enabledField": "flowgpm",\r
                "kind": "scale",\r
                "period": 1.6\r
              }\r
            ],\r
            "color": "#a9a0f4",\r
            "dataKey": "P-104",\r
            "id": "motion_expansion",\r
            "kind": "box",\r
            "label": "Expansion test",\r
            "position": [\r
              3.3,\r
              3.35,\r
              1.4\r
            ],\r
            "size": [\r
              0.3,\r
              0.3,\r
              0.3\r
            ]\r
          }\r
        ],\r
        "statusColors": [\r
          {\r
            "color": "#29b99a",\r
            "value": "Running"\r
          },\r
          {\r
            "color": "#efaa49",\r
            "value": "Warning"\r
          },\r
          {\r
            "color": "#8298ae",\r
            "value": "Stopped"\r
          }\r
        ],\r
        "statusField": "status",\r
        "theme": "dark",\r
        "title": "Animated equipment · rotation, translation, pulse and visibility",\r
        "tooltipFields": [\r
          {\r
            "field": "equipment",\r
            "label": "Equipment"\r
          },\r
          {\r
            "field": "flowgpm",\r
            "label": "Flow (GPM)"\r
          },\r
          {\r
            "field": "pressurepsi",\r
            "label": "Pressure (PSI)"\r
          },\r
          {\r
            "field": "motorloadpct",\r
            "label": "Motor load (%)"\r
          }\r
        ],\r
        "type": "scene3d"\r
      },\r
      {\r
        "children": [\r
          {\r
            "aggregation": "avg",\r
            "category": "hour",\r
            "dataset": "pressure_history",\r
            "height": 270,\r
            "id": "pressure_trend",\r
            "interaction": {\r
              "enabled": false,\r
              "externalMode": "none",\r
              "internalMode": "none"\r
            },\r
            "measure": "pressurepsi",\r
            "options": {\r
              "color": [\r
                "#58bcf4"\r
              ],\r
              "legend": {\r
                "textStyle": {\r
                  "color": "#8fa3bc"\r
                }\r
              },\r
              "textStyle": {\r
                "color": "#dce8f8"\r
              },\r
              "xAxis": {\r
                "axisLabel": {\r
                  "color": "#758aa5"\r
                },\r
                "axisLine": {\r
                  "lineStyle": {\r
                    "color": "#263852"\r
                  }\r
                }\r
              },\r
              "yAxis": {\r
                "axisLabel": {\r
                  "color": "#758aa5"\r
                },\r
                "axisLine": {\r
                  "lineStyle": {\r
                    "color": "#263852"\r
                  }\r
                },\r
                "splitLine": {\r
                  "lineStyle": {\r
                    "color": "#1c2b40"\r
                  }\r
                }\r
              }\r
            },\r
            "span": 7,\r
            "title": "Discharge pressure · PSI",\r
            "type": "lineChart"\r
          },\r
          {\r
            "aggregation": "first",\r
            "category": "equipmentid",\r
            "dataset": "snapshots",\r
            "height": 270,\r
            "id": "motor_load",\r
            "interaction": {\r
              "clearOnSecondClick": true,\r
              "enabled": true,\r
              "externalMode": "selection",\r
              "field": "equipmentid",\r
              "internalMode": "highlight",\r
              "internalScope": "others",\r
              "multiSelect": true,\r
              "selectionMode": "replace",\r
              "showSelector": false,\r
              "targets": [\r
                "station_scene"\r
              ],\r
              "trigger": "click"\r
            },\r
            "measure": "motorloadpct",\r
            "options": {\r
              "color": [\r
                "#36c3ae"\r
              ],\r
              "legend": {\r
                "textStyle": {\r
                  "color": "#8fa3bc"\r
                }\r
              },\r
              "textStyle": {\r
                "color": "#dce8f8"\r
              },\r
              "xAxis": {\r
                "axisLabel": {\r
                  "color": "#758aa5"\r
                },\r
                "axisLine": {\r
                  "lineStyle": {\r
                    "color": "#263852"\r
                  }\r
                }\r
              },\r
              "yAxis": {\r
                "axisLabel": {\r
                  "color": "#758aa5"\r
                },\r
                "axisLine": {\r
                  "lineStyle": {\r
                    "color": "#263852"\r
                  }\r
                },\r
                "splitLine": {\r
                  "lineStyle": {\r
                    "color": "#1c2b40"\r
                  }\r
                }\r
              }\r
            },\r
            "span": 5,\r
            "title": "Motor utilization · %",\r
            "type": "barChart"\r
          }\r
        ],\r
        "columns": 12,\r
        "id": "station_trends",\r
        "type": "grid"\r
      },\r
      {\r
        "columns": [\r
          {\r
            "field": "equipmentid",\r
            "title": "Asset"\r
          },\r
          {\r
            "field": "equipment",\r
            "title": "Equipment"\r
          },\r
          {\r
            "field": "scenario",\r
            "title": "Scenario"\r
          },\r
          {\r
            "field": "status",\r
            "title": "Status"\r
          },\r
          {\r
            "field": "flowgpm",\r
            "title": "Flow (GPM)"\r
          },\r
          {\r
            "field": "pressurepsi",\r
            "title": "Pressure (PSI)"\r
          },\r
          {\r
            "field": "motorloadpct",\r
            "title": "Motor load (%)"\r
          }\r
        ],\r
        "dataset": "snapshots",\r
        "id": "asset_register",\r
        "interaction": {\r
          "clearOnSecondClick": true,\r
          "enabled": true,\r
          "externalMode": "selection",\r
          "field": "equipmentid",\r
          "internalMode": "highlight",\r
          "internalScope": "others",\r
          "multiSelect": true,\r
          "selectionMode": "replace",\r
          "showSelector": false,\r
          "targets": [\r
            "station_scene"\r
          ],\r
          "trigger": "click"\r
        },\r
        "maxRows": 12,\r
        "title": "Snapshot register",\r
        "type": "table"\r
      }\r
    ],\r
    "data": {\r
      "datasets": {\r
        "equipment_readings": {\r
          "sort": [\r
            {\r
              "direction": "descending",\r
              "field": "sampleorder"\r
            }\r
          ],\r
          "source": "powerbi"\r
        },\r
        "pressure_history": {\r
          "filter": {\r
            "field": "recordtype",\r
            "operator": "=",\r
            "value": "Trend"\r
          },\r
          "sort": [\r
            {\r
              "direction": "ascending",\r
              "field": "sampleorder"\r
            }\r
          ],\r
          "source": "powerbi"\r
        },\r
        "snapshots": {\r
          "filter": {\r
            "field": "recordtype",\r
            "operator": "=",\r
            "value": "Snapshot"\r
          },\r
          "source": "equipment_readings"\r
        }\r
      }\r
    },\r
    "styles": {\r
      "globalCss": "\\n.hp-app-main,.hp-grid { background:#08111f; }\\n.hp-navbar,.hp-sidebar-app,.hp-page-header,.hp-app-footer { background:#0b1525; border-color:#1c2a3d; }\\n.hp-card,.hp-metric,.hp-custom-body,.hp-table-wrap { background:#0e1929; border-color:#203047; box-shadow:0 12px 30px rgb(0 0 0 / 22%); }\\n.hp-card-header { border-color:#203047; }\\n.hp-metric { border:1px solid #203047; border-left:0; }\\n.hp-metric-label { color:#8596ad; text-transform:none; letter-spacing:0; }\\n.hp-metric-value { color:#f5f8ff; font-size:23px; }\\n.hp-table th { background:#111e30; color:#9fb0c7; }\\n.hp-table td { border-color:#1b2a3d; }\\n.hp-app-footer { border-top:1px solid #1c2a3d; }\\n"\r
    },\r
    "theme": {\r
      "accentColor": "#29b99a",\r
      "borderColor": "#2b4159",\r
      "density": "compact",\r
      "gap": 10,\r
      "mode": "dark",\r
      "primaryColor": "#54bcff",\r
      "radius": 12,\r
      "successColor": "#29b99a",\r
      "surfaceColor": "#101e2e",\r
      "textColor": "#e7f1ff",\r
      "warningColor": "#efaa49"\r
    },\r
    "title": "3D Animation Studio",\r
    "version": "2.0"\r
  }\r
}\r
`;export{r as default};
//# sourceMappingURL=project-BkuEr-nt.js.map
