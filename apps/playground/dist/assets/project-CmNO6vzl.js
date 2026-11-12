const r=`{\r
  "dataWorkspace": {\r
    "defaultSourceId": "src_data_1gdzvsd",\r
    "sources": {\r
      "src_data_1gdzvsd": {\r
        "data": {\r
          "aggregates": {\r
            "avg": {\r
              "averagelevel": 60,\r
              "flowgpm": 5367.7692307692305,\r
              "levelpct": 7.6923076923076925,\r
              "motorloadpct": 7.391025641025641,\r
              "pressurepsi": 21.714423076923076,\r
              "rpm": 116.26923076923077,\r
              "sampleorder": 767.4615384615385,\r
              "sourceflow": 12926.75,\r
              "stationalerts": 0.875,\r
              "stationflow": 13275,\r
              "stationonline": 3.625,\r
              "stationpressure": 56.125\r
            },\r
            "count": 312,\r
            "distinctCount": {\r
              "assetid": 30,\r
              "averagelevel": 8,\r
              "category": 9,\r
              "equipment": 30,\r
              "equipmentcolor": 7,\r
              "flowgpm": 176,\r
              "hour": 10,\r
              "levelpct": 25,\r
              "motorloadpct": 12,\r
              "pressurepsi": 71,\r
              "readingid": 312,\r
              "recordtype": 2,\r
              "rpm": 26,\r
              "sampleorder": 17,\r
              "scenario": 8,\r
              "sourceflow": 6,\r
              "stationalerts": 3,\r
              "stationflow": 8,\r
              "stationonline": 4,\r
              "stationpressure": 8,\r
              "status": 4\r
            },\r
            "first": {\r
              "assetid": "RW01",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 427,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            "max": {\r
              "averagelevel": 76,\r
              "flowgpm": 23857,\r
              "levelpct": 82,\r
              "motorloadpct": 84,\r
              "pressurepsi": 68.4,\r
              "rpm": 1287,\r
              "sampleorder": 1000,\r
              "sourceflow": 17616,\r
              "stationalerts": 2,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67\r
            },\r
            "min": {\r
              "averagelevel": 26,\r
              "flowgpm": 0,\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "sourceflow": 5354,\r
              "stationalerts": 0,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43\r
            },\r
            "sum": {\r
              "averagelevel": 18720,\r
              "flowgpm": 1674744,\r
              "levelpct": 2400,\r
              "motorloadpct": 2306,\r
              "pressurepsi": 6774.9,\r
              "rpm": 36276,\r
              "sampleorder": 239448,\r
              "sourceflow": 4033146,\r
              "stationalerts": 273,\r
              "stationflow": 4141800,\r
              "stationonline": 1131,\r
              "stationpressure": 17511\r
            }\r
          },\r
          "fields": {\r
            "assetid": {\r
              "dataType": "text",\r
              "displayName": "assetid",\r
              "key": "assetid",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "averagelevel": {\r
              "dataType": "number",\r
              "displayName": "averagelevel",\r
              "key": "averagelevel",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
            },\r
            "category": {\r
              "dataType": "text",\r
              "displayName": "category",\r
              "key": "category",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "equipment": {\r
              "dataType": "text",\r
              "displayName": "equipment",\r
              "key": "equipment",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "dimension"\r
            },\r
            "equipmentcolor": {\r
              "dataType": "text",\r
              "displayName": "equipmentcolor",\r
              "key": "equipmentcolor",\r
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
            "levelpct": {\r
              "dataType": "number",\r
              "displayName": "levelpct",\r
              "key": "levelpct",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
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
            "rpm": {\r
              "dataType": "number",\r
              "displayName": "rpm",\r
              "key": "rpm",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
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
            "sourceflow": {\r
              "dataType": "number",\r
              "displayName": "sourceflow",\r
              "key": "sourceflow",\r
              "kind": "column",\r
              "origin": "uploaded-column",\r
              "roles": [],\r
              "type": "measure"\r
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
            "loadedRowCount": 312,\r
            "moreRowsAvailable": false\r
          },\r
          "map": {\r
            "bindings": {\r
              "details": [],\r
              "tooltip": []\r
            },\r
            "coordinateCounts": {\r
              "dataViewRowCount": 312,\r
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
            "invalidFeatureCount": 312,\r
            "layers": [],\r
            "locationCounts": {\r
              "filteredRowCount": 0,\r
              "geometryParseFailureCount": 0,\r
              "incompletePairCount": 0,\r
              "nonNumericCount": 0,\r
              "outOfRangeCount": 0,\r
              "totalInputRows": 312,\r
              "validFeatureCount": 0\r
            },\r
            "mode": "none",\r
            "warnings": [\r
              "Choose geometry, coordinate, or address fields through the map layer source bindings. All source fields must be present in Values.",\r
              "312 row(s) have invalid or missing map locations."\r
            ]\r
          },\r
          "rowKeys": [\r
            "row_oxa9ce",\r
            "row_1p09q3u",\r
            "row_17q5hxv",\r
            "row_es9c6q",\r
            "row_100k5sy",\r
            "row_jcotfh",\r
            "row_1lhlp6i",\r
            "row_dz0az6",\r
            "row_123b2l5",\r
            "row_ns09wq",\r
            "row_1q3foxx",\r
            "row_1ov74mp",\r
            "row_i1o9df",\r
            "row_t28kix",\r
            "row_1rpk8zr",\r
            "row_1wl9xl6",\r
            "row_1iiadbb",\r
            "row_cafhs",\r
            "row_brhr1o",\r
            "row_125f48d",\r
            "row_1b94qda",\r
            "row_1fn01e7",\r
            "row_18zi208",\r
            "row_1m9kij7",\r
            "row_1oovf7o",\r
            "row_d7rwaf",\r
            "row_16txcyi",\r
            "row_sm7pay",\r
            "row_1np9tpo",\r
            "row_126166v",\r
            "row_w4esno",\r
            "row_1sf5ng3",\r
            "row_1dd2jdp",\r
            "row_oucpqs",\r
            "row_18lrzky",\r
            "row_1w4nb21",\r
            "row_qoxuov",\r
            "row_1hajieb",\r
            "row_11bs5m4",\r
            "row_1vdps13",\r
            "row_1j4s0r0",\r
            "row_1ddnwm3",\r
            "row_pmva4b",\r
            "row_1g9uizi",\r
            "row_10qve3e",\r
            "row_jfxbi3",\r
            "row_xsrsn2",\r
            "row_jg16vz",\r
            "row_12jvb1w",\r
            "row_jnnjpb",\r
            "row_fn6so",\r
            "row_29qctg",\r
            "row_1ci7z3g",\r
            "row_1sf1nlt",\r
            "row_1wg18w5",\r
            "row_1oc871y",\r
            "row_gxda4",\r
            "row_1aril8u",\r
            "row_1e0iuwb",\r
            "row_1mw5t47",\r
            "row_4lkxuc",\r
            "row_py47dw",\r
            "row_nrn3r",\r
            "row_g5l03d",\r
            "row_4n2qrs",\r
            "row_ic66wq",\r
            "row_1mt1nyd",\r
            "row_10nkxsy",\r
            "row_ptpz5w",\r
            "row_syq2v6",\r
            "row_1lv4na4",\r
            "row_t7n61g",\r
            "row_1u4o2jp",\r
            "row_i8x7y",\r
            "row_1rdrwdu",\r
            "row_105ymc6",\r
            "row_1clny7s",\r
            "row_1tc5hol",\r
            "row_93k449",\r
            "row_l3xwu0",\r
            "row_rijbz",\r
            "row_16op3q",\r
            "row_2h0ol1",\r
            "row_efl1lw",\r
            "row_11ni1wb",\r
            "row_mbb1yq",\r
            "row_dw639c",\r
            "row_1tca7kj",\r
            "row_w814vm",\r
            "row_dk3rk",\r
            "row_1ownhqm",\r
            "row_129fk54",\r
            "row_1oeibu",\r
            "row_nlzq2r",\r
            "row_15qwc8r",\r
            "row_1qf6qyp",\r
            "row_hwehj",\r
            "row_f1zqbm",\r
            "row_1l025ei",\r
            "row_17zldw",\r
            "row_2lvft8",\r
            "row_fcoaos",\r
            "row_ilfoq9",\r
            "row_1og4bu2",\r
            "row_z40rmi",\r
            "row_1wz1f0g",\r
            "row_kkkhp7",\r
            "row_1y2hz01",\r
            "row_1bd322h",\r
            "row_1boxp1n",\r
            "row_cv8kpy",\r
            "row_1dzz2ce",\r
            "row_1k05b41",\r
            "row_7ykido",\r
            "row_13sd3p2",\r
            "row_a6domi",\r
            "row_179wkgb",\r
            "row_1bdkfwx",\r
            "row_ra8dpb",\r
            "row_1mzmkoy",\r
            "row_1f37ajg",\r
            "row_192na5b",\r
            "row_anh2rd",\r
            "row_1y7nqwo",\r
            "row_1qqe97r",\r
            "row_avjdtv",\r
            "row_1j2zdii",\r
            "row_1qys7ph",\r
            "row_6qhfdk",\r
            "row_1neli72",\r
            "row_1xeb0hk",\r
            "row_1uo2j8b",\r
            "row_1hx2mb5",\r
            "row_3n619d",\r
            "row_e8ok17",\r
            "row_14qki1j",\r
            "row_24fr97",\r
            "row_oigjr",\r
            "row_vv5cox",\r
            "row_nixprr",\r
            "row_16zal3k",\r
            "row_8165hd",\r
            "row_1ebl81u",\r
            "row_135wjw1",\r
            "row_1lfpyvw",\r
            "row_1t79f2r",\r
            "row_1kt496c",\r
            "row_1hsvtxk",\r
            "row_1drlbyh",\r
            "row_s16nwl",\r
            "row_1o9yi3x",\r
            "row_14sllts",\r
            "row_7me9mz",\r
            "row_odr9ol",\r
            "row_ki2jrd",\r
            "row_1qlenwo",\r
            "row_1mutzfc",\r
            "row_wwaoni",\r
            "row_19fxx5p",\r
            "row_1rheg1e",\r
            "row_nhy8k4",\r
            "row_188lj8x",\r
            "row_1xu9n48",\r
            "row_djfvni",\r
            "row_zb4kqb",\r
            "row_fu0mto",\r
            "row_1vzohjd",\r
            "row_uqp14z",\r
            "row_1ohv32f",\r
            "row_1880yei",\r
            "row_1kxmjaq",\r
            "row_kjzr6y",\r
            "row_mesyt6",\r
            "row_1ufo2n2",\r
            "row_1mukwn8",\r
            "row_1axydt2",\r
            "row_1wq33c4",\r
            "row_h4lwy5",\r
            "row_1f55ysg",\r
            "row_1vynost",\r
            "row_rrjqzw",\r
            "row_tjonyd",\r
            "row_w4g8i7",\r
            "row_10adikb",\r
            "row_mwecff",\r
            "row_nnc2am",\r
            "row_1dil92p",\r
            "row_h5w20l",\r
            "row_mrpm0d",\r
            "row_18w9btr",\r
            "row_1mcv5o2",\r
            "row_i75r1r",\r
            "row_jnl8zt",\r
            "row_8c9fcd",\r
            "row_u83n70",\r
            "row_1kwjlk",\r
            "row_qqsdd7",\r
            "row_1dvm1qo",\r
            "row_hgyw1",\r
            "row_18rrjwr",\r
            "row_r04678",\r
            "row_1r5863w",\r
            "row_ht2o6f",\r
            "row_w0s3tw",\r
            "row_1d3bbnq",\r
            "row_10gxsea",\r
            "row_1w9mx2f",\r
            "row_itvy6v",\r
            "row_a2u6pj",\r
            "row_69o5dj",\r
            "row_z3dtb0",\r
            "row_rah13p",\r
            "row_1ivycuq",\r
            "row_13h8eb0",\r
            "row_1ww9y9w",\r
            "row_66lyyi",\r
            "row_145zini",\r
            "row_mckbg9",\r
            "row_yb0zwm",\r
            "row_kxwknm",\r
            "row_1lm7ikb",\r
            "row_1cn54j",\r
            "row_1xt2sib",\r
            "row_p0szmg",\r
            "row_f6juo",\r
            "row_fd5uhi",\r
            "row_1y86rho",\r
            "row_191jjxt",\r
            "row_yew68l",\r
            "row_1uoz6mn",\r
            "row_xvow80",\r
            "row_vhcj90",\r
            "row_h3tz0a",\r
            "row_1wu7vvr",\r
            "row_61dcmx",\r
            "row_l4lqrb",\r
            "row_12nmgz6",\r
            "row_z3f9x2",\r
            "row_1g2qkg9",\r
            "row_h2hjay",\r
            "row_g50zmk",\r
            "row_o0a4w4",\r
            "row_1wyp07w",\r
            "row_175upsd",\r
            "row_v938oh",\r
            "row_acee9h",\r
            "row_96xjx7",\r
            "row_1bb47fg",\r
            "row_1ea7e9q",\r
            "row_1mdjj34",\r
            "row_1d85i0r",\r
            "row_13zbdef",\r
            "row_1w463ib",\r
            "row_1n27g2d",\r
            "row_h6pkn2",\r
            "row_1y8vdcj",\r
            "row_1a8msjv",\r
            "row_9381gv",\r
            "row_kq9ufy",\r
            "row_1m5nj7f",\r
            "row_128j4mm",\r
            "row_1ji4qpi",\r
            "row_616tkj",\r
            "row_1y9zmjd",\r
            "row_6yv9vb",\r
            "row_pfnzmg",\r
            "row_bf3if2",\r
            "row_1isjcco",\r
            "row_1ua04vr",\r
            "row_jo0g8p",\r
            "row_i2d70v",\r
            "row_3dphkr",\r
            "row_fkh2ye",\r
            "row_qrz6c6",\r
            "row_1w0zc8k",\r
            "row_1sb1a35",\r
            "row_17imqg8",\r
            "row_170fhbq",\r
            "row_1h701sp",\r
            "row_ld35nu",\r
            "row_y5gwsg",\r
            "row_dc77c9",\r
            "row_bfbpny",\r
            "row_17vmdap",\r
            "row_1saz7uf",\r
            "row_cyyh96",\r
            "row_1u9u336",\r
            "row_1vi09ki",\r
            "row_1bzudp9",\r
            "row_1am21ra",\r
            "row_1clju8m",\r
            "row_1u4o9u8",\r
            "row_c869it",\r
            "row_dsp4x2",\r
            "row_1m35tib",\r
            "row_cqsn84",\r
            "row_127yiwx",\r
            "row_i6kol5",\r
            "row_zp5q10",\r
            "row_1pwkxtg",\r
            "row_fx0hsx",\r
            "row_113nr68",\r
            "row_uzip8a",\r
            "row_q4iyk9",\r
            "row_7l3wgc",\r
            "row_iiveuh",\r
            "row_1jm6rtq",\r
            "row_80pekg",\r
            "row_1eh5cht",\r
            "row_1qcumyp",\r
            "row_1g23lc7",\r
            "row_15s44j6"\r
          ],\r
          "rows": [\r
            {\r
              "assetid": "RW01",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 427,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW02",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 464,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW03",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 3",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 501,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW04",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 4",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 538,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW05",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 5",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 575,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW06",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 6",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 612,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW07",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 7",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 649,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW07-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW08",\r
              "averagelevel": 76,\r
              "category": "Remote well",\r
              "equipment": "Remote well 8",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 686,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-RW08-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "LW01",\r
              "averagelevel": 76,\r
              "category": "Local well",\r
              "equipment": "On-site source well",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 680,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-LW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW1",\r
              "averagelevel": 76,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 4650,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-SW1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW2",\r
              "averagelevel": 76,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 5000,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-SW2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST1",\r
              "averagelevel": 76,\r
              "category": "Storage",\r
              "equipment": "Storage tank 1",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3220,\r
              "hour": "Snapshot",\r
              "levelpct": 70,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-GST1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST2",\r
              "averagelevel": 76,\r
              "category": "Storage",\r
              "equipment": "Storage tank 2",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3220,\r
              "hour": "Snapshot",\r
              "levelpct": 73,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-GST2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST3",\r
              "averagelevel": 76,\r
              "category": "Storage",\r
              "equipment": "Storage tank 3",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3220,\r
              "hour": "Snapshot",\r
              "levelpct": 76,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-GST3-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST4",\r
              "averagelevel": 76,\r
              "category": "Storage",\r
              "equipment": "Storage tank 4",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3220,\r
              "hour": "Snapshot",\r
              "levelpct": 79,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-GST4-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST5",\r
              "averagelevel": 76,\r
              "category": "Storage",\r
              "equipment": "Storage tank 5",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3220,\r
              "hour": "Snapshot",\r
              "levelpct": 82,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-GST5-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP01",\r
              "averagelevel": 76,\r
              "category": "Booster",\r
              "equipment": "Booster pump 1",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3985,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 81,\r
              "pressurepsi": 64,\r
              "readingid": "0-BP01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1266,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP02",\r
              "averagelevel": 76,\r
              "category": "Booster",\r
              "equipment": "Booster pump 2",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3786,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 80,\r
              "pressurepsi": 64,\r
              "readingid": "0-BP02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1257,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP03",\r
              "averagelevel": 76,\r
              "category": "Booster",\r
              "equipment": "Booster pump 3",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 4224,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 83,\r
              "pressurepsi": 64,\r
              "readingid": "0-BP03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1277,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP04",\r
              "averagelevel": 76,\r
              "category": "Booster",\r
              "equipment": "Booster pump 4",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 4105,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 82,\r
              "pressurepsi": 64,\r
              "readingid": "0-BP04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1272,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP05",\r
              "averagelevel": 76,\r
              "category": "Booster",\r
              "equipment": "Booster pump 5",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-BP05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP06",\r
              "averagelevel": 76,\r
              "category": "Booster",\r
              "equipment": "Booster pump 6",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-BP06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "SOURCE",\r
              "averagelevel": 76,\r
              "category": "Header",\r
              "equipment": "Source collection",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 14782,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-SOURCE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SUCTION",\r
              "averagelevel": 76,\r
              "category": "Header",\r
              "equipment": "Storage suction header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 16100,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 18,\r
              "readingid": "0-SUCTION-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DISCHARGE",\r
              "averagelevel": 76,\r
              "category": "Header",\r
              "equipment": "Booster discharge header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 16100,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 64,\r
              "readingid": "0-DISCHARGE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 16100,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 64,\r
              "readingid": "0-DIST-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15134,\r
              "hour": "07:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 64,\r
              "readingid": "0-DIST-0",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15659,\r
              "hour": "08:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 64.9,\r
              "readingid": "0-DIST-1",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 1,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 16093,\r
              "hour": "09:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 65.4,\r
              "readingid": "0-DIST-2",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 2,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 16360,\r
              "hour": "10:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 65.2,\r
              "readingid": "0-DIST-3",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 3,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 16414,\r
              "hour": "11:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 64.5,\r
              "readingid": "0-DIST-4",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 4,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 16246,\r
              "hour": "12:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 63.5,\r
              "readingid": "0-DIST-5",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 5,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15884,\r
              "hour": "13:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 62.8,\r
              "readingid": "0-DIST-6",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 6,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15392,\r
              "hour": "14:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 62.6,\r
              "readingid": "0-DIST-7",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 7,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 76,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 14855,\r
              "hour": "15:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 63.1,\r
              "readingid": "0-DIST-8",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 8,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM1",\r
              "averagelevel": 76,\r
              "category": "Treatment",\r
              "equipment": "Source chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-CHEM1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM2",\r
              "averagelevel": 76,\r
              "category": "Treatment",\r
              "equipment": "Surface chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-CHEM2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "QUALITY",\r
              "averagelevel": 76,\r
              "category": "Monitoring",\r
              "equipment": "Residual analyzer",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-QUALITY-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "ALARM",\r
              "averagelevel": 76,\r
              "category": "Monitoring",\r
              "equipment": "Station alarm indicator",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "0-ALARM-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 1000,\r
              "scenario": "Normal supply",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 16100,\r
              "stationonline": 4,\r
              "stationpressure": 64,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "RW01",\r
              "averagelevel": 68,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 504,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW02",\r
              "averagelevel": 68,\r
              "category": "Remote well",\r
              "equipment": "Remote well 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 548,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-RW02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW03",\r
              "averagelevel": 68,\r
              "category": "Remote well",\r
              "equipment": "Remote well 3",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 591,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-RW03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW04",\r
              "averagelevel": 68,\r
              "category": "Remote well",\r
              "equipment": "Remote well 4",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 635,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-RW04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW05",\r
              "averagelevel": 68,\r
              "category": "Remote well",\r
              "equipment": "Remote well 5",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 679,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-RW05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW06",\r
              "averagelevel": 68,\r
              "category": "Remote well",\r
              "equipment": "Remote well 6",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 722,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-RW06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW07",\r
              "averagelevel": 68,\r
              "category": "Remote well",\r
              "equipment": "Remote well 7",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 766,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-RW07-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW08",\r
              "averagelevel": 68,\r
              "category": "Remote well",\r
              "equipment": "Remote well 8",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 809,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-RW08-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "LW01",\r
              "averagelevel": 68,\r
              "category": "Local well",\r
              "equipment": "On-site source well",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 782,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-LW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW1",\r
              "averagelevel": 68,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 5580,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-SW1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW2",\r
              "averagelevel": 68,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 6000,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-SW2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST1",\r
              "averagelevel": 68,\r
              "category": "Storage",\r
              "equipment": "Storage tank 1",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 4680,\r
              "hour": "Snapshot",\r
              "levelpct": 62,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-GST1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST2",\r
              "averagelevel": 68,\r
              "category": "Storage",\r
              "equipment": "Storage tank 2",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 4680,\r
              "hour": "Snapshot",\r
              "levelpct": 65,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-GST2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST3",\r
              "averagelevel": 68,\r
              "category": "Storage",\r
              "equipment": "Storage tank 3",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 4680,\r
              "hour": "Snapshot",\r
              "levelpct": 68,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-GST3-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST4",\r
              "averagelevel": 68,\r
              "category": "Storage",\r
              "equipment": "Storage tank 4",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 4680,\r
              "hour": "Snapshot",\r
              "levelpct": 71,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-GST4-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST5",\r
              "averagelevel": 68,\r
              "category": "Storage",\r
              "equipment": "Storage tank 5",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 4680,\r
              "hour": "Snapshot",\r
              "levelpct": 74,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-GST5-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP01",\r
              "averagelevel": 68,\r
              "category": "Booster",\r
              "equipment": "Booster pump 1",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3836,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 81,\r
              "pressurepsi": 67,\r
              "readingid": "1-BP01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1259,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP02",\r
              "averagelevel": 68,\r
              "category": "Booster",\r
              "equipment": "Booster pump 2",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3644,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 79,\r
              "pressurepsi": 67,\r
              "readingid": "1-BP02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1250,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP03",\r
              "averagelevel": 68,\r
              "category": "Booster",\r
              "equipment": "Booster pump 3",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 4066,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 82,\r
              "pressurepsi": 67,\r
              "readingid": "1-BP03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1270,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP04",\r
              "averagelevel": 68,\r
              "category": "Booster",\r
              "equipment": "Booster pump 4",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3951,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 81,\r
              "pressurepsi": 67,\r
              "readingid": "1-BP04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1264,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP05",\r
              "averagelevel": 68,\r
              "category": "Booster",\r
              "equipment": "Booster pump 5",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3759,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 80,\r
              "pressurepsi": 67,\r
              "readingid": "1-BP05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1255,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP06",\r
              "averagelevel": 68,\r
              "category": "Booster",\r
              "equipment": "Booster pump 6",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 4143,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 82,\r
              "pressurepsi": 67,\r
              "readingid": "1-BP06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1273,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SOURCE",\r
              "averagelevel": 68,\r
              "category": "Header",\r
              "equipment": "Source collection",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 17616,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-SOURCE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SUCTION",\r
              "averagelevel": 68,\r
              "category": "Header",\r
              "equipment": "Storage suction header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 23400,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 18,\r
              "readingid": "1-SUCTION-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DISCHARGE",\r
              "averagelevel": 68,\r
              "category": "Header",\r
              "equipment": "Booster discharge header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 23400,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 67,\r
              "readingid": "1-DISCHARGE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 23400,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 67,\r
              "readingid": "1-DIST-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 21996,\r
              "hour": "07:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 68.2,\r
              "readingid": "1-DIST-0",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 22759,\r
              "hour": "08:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 68.4,\r
              "readingid": "1-DIST-1",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 1,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 23390,\r
              "hour": "09:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 67.9,\r
              "readingid": "1-DIST-2",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 2,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 23778,\r
              "hour": "10:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 67.1,\r
              "readingid": "1-DIST-3",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 3,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 23857,\r
              "hour": "11:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 66.1,\r
              "readingid": "1-DIST-4",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 4,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 23612,\r
              "hour": "12:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 65.6,\r
              "readingid": "1-DIST-5",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 5,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 23086,\r
              "hour": "13:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 65.8,\r
              "readingid": "1-DIST-6",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 6,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 22371,\r
              "hour": "14:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 66.5,\r
              "readingid": "1-DIST-7",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 7,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 68,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 21590,\r
              "hour": "15:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 67.4,\r
              "readingid": "1-DIST-8",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 8,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM1",\r
              "averagelevel": 68,\r
              "category": "Treatment",\r
              "equipment": "Source chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-CHEM1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM2",\r
              "averagelevel": 68,\r
              "category": "Treatment",\r
              "equipment": "Surface chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-CHEM2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "QUALITY",\r
              "averagelevel": 68,\r
              "category": "Monitoring",\r
              "equipment": "Residual analyzer",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-QUALITY-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "ALARM",\r
              "averagelevel": 68,\r
              "category": "Monitoring",\r
              "equipment": "Station alarm indicator",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "1-ALARM-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 999,\r
              "scenario": "Peak demand",\r
              "sourceflow": 17616,\r
              "stationalerts": 0,\r
              "stationflow": 23400,\r
              "stationonline": 6,\r
              "stationpressure": 67,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "RW01",\r
              "averagelevel": 56,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "RW02",\r
              "averagelevel": 56,\r
              "category": "Remote well",\r
              "equipment": "Remote well 2",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-RW02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "RW03",\r
              "averagelevel": 56,\r
              "category": "Remote well",\r
              "equipment": "Remote well 3",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-RW03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "RW04",\r
              "averagelevel": 56,\r
              "category": "Remote well",\r
              "equipment": "Remote well 4",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-RW04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "RW05",\r
              "averagelevel": 56,\r
              "category": "Remote well",\r
              "equipment": "Remote well 5",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-RW05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "RW06",\r
              "averagelevel": 56,\r
              "category": "Remote well",\r
              "equipment": "Remote well 6",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-RW06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "RW07",\r
              "averagelevel": 56,\r
              "category": "Remote well",\r
              "equipment": "Remote well 7",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-RW07-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "RW08",\r
              "averagelevel": 56,\r
              "category": "Remote well",\r
              "equipment": "Remote well 8",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-RW08-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "LW01",\r
              "averagelevel": 56,\r
              "category": "Local well",\r
              "equipment": "On-site source well",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 680,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-LW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW1",\r
              "averagelevel": 56,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 5813,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-SW1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW2",\r
              "averagelevel": 56,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 6250,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-SW2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST1",\r
              "averagelevel": 56,\r
              "category": "Storage",\r
              "equipment": "Storage tank 1",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2580,\r
              "hour": "Snapshot",\r
              "levelpct": 50,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-GST1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST2",\r
              "averagelevel": 56,\r
              "category": "Storage",\r
              "equipment": "Storage tank 2",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2580,\r
              "hour": "Snapshot",\r
              "levelpct": 53,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-GST2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST3",\r
              "averagelevel": 56,\r
              "category": "Storage",\r
              "equipment": "Storage tank 3",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2580,\r
              "hour": "Snapshot",\r
              "levelpct": 56,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-GST3-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST4",\r
              "averagelevel": 56,\r
              "category": "Storage",\r
              "equipment": "Storage tank 4",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2580,\r
              "hour": "Snapshot",\r
              "levelpct": 59,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-GST4-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST5",\r
              "averagelevel": 56,\r
              "category": "Storage",\r
              "equipment": "Storage tank 5",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2580,\r
              "hour": "Snapshot",\r
              "levelpct": 62,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-GST5-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP01",\r
              "averagelevel": 56,\r
              "category": "Booster",\r
              "equipment": "Booster pump 1",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3258,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 77,\r
              "pressurepsi": 57,\r
              "readingid": "2-BP01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1232,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP02",\r
              "averagelevel": 56,\r
              "category": "Booster",\r
              "equipment": "Booster pump 2",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3095,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 76,\r
              "pressurepsi": 57,\r
              "readingid": "2-BP02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1224,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP03",\r
              "averagelevel": 56,\r
              "category": "Booster",\r
              "equipment": "Booster pump 3",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-BP03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP04",\r
              "averagelevel": 56,\r
              "category": "Booster",\r
              "equipment": "Booster pump 4",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3355,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 78,\r
              "pressurepsi": 57,\r
              "readingid": "2-BP04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1237,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP05",\r
              "averagelevel": 56,\r
              "category": "Booster",\r
              "equipment": "Booster pump 5",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3192,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 77,\r
              "pressurepsi": 57,\r
              "readingid": "2-BP05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1229,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP06",\r
              "averagelevel": 56,\r
              "category": "Booster",\r
              "equipment": "Booster pump 6",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-BP06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "SOURCE",\r
              "averagelevel": 56,\r
              "category": "Header",\r
              "equipment": "Source collection",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12743,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-SOURCE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SUCTION",\r
              "averagelevel": 56,\r
              "category": "Header",\r
              "equipment": "Storage suction header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12900,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 18,\r
              "readingid": "2-SUCTION-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DISCHARGE",\r
              "averagelevel": 56,\r
              "category": "Header",\r
              "equipment": "Booster discharge header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12900,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 57,\r
              "readingid": "2-DISCHARGE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12900,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 57,\r
              "readingid": "2-DIST-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12126,\r
              "hour": "07:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 58.3,\r
              "readingid": "2-DIST-0",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12547,\r
              "hour": "08:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 57.6,\r
              "readingid": "2-DIST-1",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 1,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12894,\r
              "hour": "09:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 56.6,\r
              "readingid": "2-DIST-2",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 2,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 13109,\r
              "hour": "10:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 55.9,\r
              "readingid": "2-DIST-3",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 3,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 13152,\r
              "hour": "11:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 55.6,\r
              "readingid": "2-DIST-4",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 4,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 13017,\r
              "hour": "12:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 56,\r
              "readingid": "2-DIST-5",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 5,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12727,\r
              "hour": "13:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 56.9,\r
              "readingid": "2-DIST-6",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 6,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12333,\r
              "hour": "14:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 57.8,\r
              "readingid": "2-DIST-7",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 7,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 56,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11902,\r
              "hour": "15:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 58.4,\r
              "readingid": "2-DIST-8",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 8,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM1",\r
              "averagelevel": 56,\r
              "category": "Treatment",\r
              "equipment": "Source chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-CHEM1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM2",\r
              "averagelevel": 56,\r
              "category": "Treatment",\r
              "equipment": "Surface chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-CHEM2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "QUALITY",\r
              "averagelevel": 56,\r
              "category": "Monitoring",\r
              "equipment": "Residual analyzer",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-QUALITY-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "ALARM",\r
              "averagelevel": 56,\r
              "category": "Monitoring",\r
              "equipment": "Station alarm indicator",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "2-ALARM-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 998,\r
              "scenario": "Remote wells offline",\r
              "sourceflow": 12743,\r
              "stationalerts": 1,\r
              "stationflow": 12900,\r
              "stationonline": 4,\r
              "stationpressure": 57,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "RW01",\r
              "averagelevel": 59,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 448,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW02",\r
              "averagelevel": 59,\r
              "category": "Remote well",\r
              "equipment": "Remote well 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 487,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-RW02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW03",\r
              "averagelevel": 59,\r
              "category": "Remote well",\r
              "equipment": "Remote well 3",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 526,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-RW03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW04",\r
              "averagelevel": 59,\r
              "category": "Remote well",\r
              "equipment": "Remote well 4",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 565,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-RW04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW05",\r
              "averagelevel": 59,\r
              "category": "Remote well",\r
              "equipment": "Remote well 5",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 604,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-RW05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW06",\r
              "averagelevel": 59,\r
              "category": "Remote well",\r
              "equipment": "Remote well 6",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 643,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-RW06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW07",\r
              "averagelevel": 59,\r
              "category": "Remote well",\r
              "equipment": "Remote well 7",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 681,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-RW07-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW08",\r
              "averagelevel": 59,\r
              "category": "Remote well",\r
              "equipment": "Remote well 8",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 720,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-RW08-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "LW01",\r
              "averagelevel": 59,\r
              "category": "Local well",\r
              "equipment": "On-site source well",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 680,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-LW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW1",\r
              "averagelevel": 59,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 1",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-SW1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "SW2",\r
              "averagelevel": 59,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 2",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-SW2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "GST1",\r
              "averagelevel": 59,\r
              "category": "Storage",\r
              "equipment": "Storage tank 1",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2340,\r
              "hour": "Snapshot",\r
              "levelpct": 53,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-GST1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST2",\r
              "averagelevel": 59,\r
              "category": "Storage",\r
              "equipment": "Storage tank 2",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2340,\r
              "hour": "Snapshot",\r
              "levelpct": 56,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-GST2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST3",\r
              "averagelevel": 59,\r
              "category": "Storage",\r
              "equipment": "Storage tank 3",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2340,\r
              "hour": "Snapshot",\r
              "levelpct": 59,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-GST3-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST4",\r
              "averagelevel": 59,\r
              "category": "Storage",\r
              "equipment": "Storage tank 4",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2340,\r
              "hour": "Snapshot",\r
              "levelpct": 62,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-GST4-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST5",\r
              "averagelevel": 59,\r
              "category": "Storage",\r
              "equipment": "Storage tank 5",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 2340,\r
              "hour": "Snapshot",\r
              "levelpct": 65,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-GST5-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP01",\r
              "averagelevel": 59,\r
              "category": "Booster",\r
              "equipment": "Booster pump 1",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 2932,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 75,\r
              "pressurepsi": 55,\r
              "readingid": "3-BP01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1217,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP02",\r
              "averagelevel": 59,\r
              "category": "Booster",\r
              "equipment": "Booster pump 2",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 2786,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 74,\r
              "pressurepsi": 55,\r
              "readingid": "3-BP02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1210,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP03",\r
              "averagelevel": 59,\r
              "category": "Booster",\r
              "equipment": "Booster pump 3",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3108,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 76,\r
              "pressurepsi": 55,\r
              "readingid": "3-BP03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1225,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP04",\r
              "averagelevel": 59,\r
              "category": "Booster",\r
              "equipment": "Booster pump 4",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-BP04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP05",\r
              "averagelevel": 59,\r
              "category": "Booster",\r
              "equipment": "Booster pump 5",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 2874,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 75,\r
              "pressurepsi": 55,\r
              "readingid": "3-BP05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1214,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP06",\r
              "averagelevel": 59,\r
              "category": "Booster",\r
              "equipment": "Booster pump 6",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-BP06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "SOURCE",\r
              "averagelevel": 59,\r
              "category": "Header",\r
              "equipment": "Source collection",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 5354,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-SOURCE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SUCTION",\r
              "averagelevel": 59,\r
              "category": "Header",\r
              "equipment": "Storage suction header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11700,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 18,\r
              "readingid": "3-SUCTION-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DISCHARGE",\r
              "averagelevel": 59,\r
              "category": "Header",\r
              "equipment": "Booster discharge header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11700,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 55,\r
              "readingid": "3-DISCHARGE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11700,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 55,\r
              "readingid": "3-DIST-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 10998,\r
              "hour": "07:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 55.2,\r
              "readingid": "3-DIST-0",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11380,\r
              "hour": "08:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 54.3,\r
              "readingid": "3-DIST-1",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 1,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11695,\r
              "hour": "09:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 53.7,\r
              "readingid": "3-DIST-2",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 2,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11889,\r
              "hour": "10:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 53.7,\r
              "readingid": "3-DIST-3",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 3,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11928,\r
              "hour": "11:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 54.3,\r
              "readingid": "3-DIST-4",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 4,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11806,\r
              "hour": "12:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 55.3,\r
              "readingid": "3-DIST-5",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 5,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11543,\r
              "hour": "13:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 56.1,\r
              "readingid": "3-DIST-6",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 6,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 11185,\r
              "hour": "14:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 56.4,\r
              "readingid": "3-DIST-7",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 7,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 59,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 10795,\r
              "hour": "15:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 56,\r
              "readingid": "3-DIST-8",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 8,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM1",\r
              "averagelevel": 59,\r
              "category": "Treatment",\r
              "equipment": "Source chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-CHEM1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM2",\r
              "averagelevel": 59,\r
              "category": "Treatment",\r
              "equipment": "Surface chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-CHEM2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "QUALITY",\r
              "averagelevel": 59,\r
              "category": "Monitoring",\r
              "equipment": "Residual analyzer",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-QUALITY-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "ALARM",\r
              "averagelevel": 59,\r
              "category": "Monitoring",\r
              "equipment": "Station alarm indicator",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "3-ALARM-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 997,\r
              "scenario": "Surface inlet unavailable",\r
              "sourceflow": 5354,\r
              "stationalerts": 1,\r
              "stationflow": 11700,\r
              "stationonline": 4,\r
              "stationpressure": 55,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "RW01",\r
              "averagelevel": 70,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 427,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW02",\r
              "averagelevel": 70,\r
              "category": "Remote well",\r
              "equipment": "Remote well 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 464,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-RW02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW03",\r
              "averagelevel": 70,\r
              "category": "Remote well",\r
              "equipment": "Remote well 3",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 501,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-RW03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW04",\r
              "averagelevel": 70,\r
              "category": "Remote well",\r
              "equipment": "Remote well 4",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 538,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-RW04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW05",\r
              "averagelevel": 70,\r
              "category": "Remote well",\r
              "equipment": "Remote well 5",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 575,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-RW05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW06",\r
              "averagelevel": 70,\r
              "category": "Remote well",\r
              "equipment": "Remote well 6",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 612,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-RW06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW07",\r
              "averagelevel": 70,\r
              "category": "Remote well",\r
              "equipment": "Remote well 7",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 649,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-RW07-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW08",\r
              "averagelevel": 70,\r
              "category": "Remote well",\r
              "equipment": "Remote well 8",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 686,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-RW08-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "LW01",\r
              "averagelevel": 70,\r
              "category": "Local well",\r
              "equipment": "On-site source well",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 680,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-LW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW1",\r
              "averagelevel": 70,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 4650,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-SW1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW2",\r
              "averagelevel": 70,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 5000,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-SW2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST1",\r
              "averagelevel": 70,\r
              "category": "Storage",\r
              "equipment": "Storage tank 1",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3120,\r
              "hour": "Snapshot",\r
              "levelpct": 64,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-GST1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST2",\r
              "averagelevel": 70,\r
              "category": "Storage",\r
              "equipment": "Storage tank 2",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3120,\r
              "hour": "Snapshot",\r
              "levelpct": 67,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-GST2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST3",\r
              "averagelevel": 70,\r
              "category": "Storage",\r
              "equipment": "Storage tank 3",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3120,\r
              "hour": "Snapshot",\r
              "levelpct": 70,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-GST3-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST4",\r
              "averagelevel": 70,\r
              "category": "Storage",\r
              "equipment": "Storage tank 4",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3120,\r
              "hour": "Snapshot",\r
              "levelpct": 73,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-GST4-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST5",\r
              "averagelevel": 70,\r
              "category": "Storage",\r
              "equipment": "Storage tank 5",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 3120,\r
              "hour": "Snapshot",\r
              "levelpct": 76,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-GST5-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP01",\r
              "averagelevel": 70,\r
              "category": "Booster",\r
              "equipment": "Booster pump 1",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3939,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 81,\r
              "pressurepsi": 62,\r
              "readingid": "4-BP01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1264,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP02",\r
              "averagelevel": 70,\r
              "category": "Booster",\r
              "equipment": "Booster pump 2",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3742,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 80,\r
              "pressurepsi": 62,\r
              "readingid": "4-BP02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1255,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP03",\r
              "averagelevel": 70,\r
              "category": "Booster",\r
              "equipment": "Booster pump 3",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-BP03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP04",\r
              "averagelevel": 70,\r
              "category": "Booster",\r
              "equipment": "Booster pump 4",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 4058,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 82,\r
              "pressurepsi": 62,\r
              "readingid": "4-BP04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1269,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP05",\r
              "averagelevel": 70,\r
              "category": "Booster",\r
              "equipment": "Booster pump 5",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 3861,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 81,\r
              "pressurepsi": 62,\r
              "readingid": "4-BP05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1260,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP06",\r
              "averagelevel": 70,\r
              "category": "Booster",\r
              "equipment": "Booster pump 6",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-BP06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "SOURCE",\r
              "averagelevel": 70,\r
              "category": "Header",\r
              "equipment": "Source collection",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 14782,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-SOURCE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SUCTION",\r
              "averagelevel": 70,\r
              "category": "Header",\r
              "equipment": "Storage suction header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15600,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 18,\r
              "readingid": "4-SUCTION-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DISCHARGE",\r
              "averagelevel": 70,\r
              "category": "Header",\r
              "equipment": "Booster discharge header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15600,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 62,\r
              "readingid": "4-DISCHARGE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15600,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 62,\r
              "readingid": "4-DIST-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 14664,\r
              "hour": "07:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 60.9,\r
              "readingid": "4-DIST-0",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15173,\r
              "hour": "08:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 60.6,\r
              "readingid": "4-DIST-1",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 1,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15593,\r
              "hour": "09:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 60.9,\r
              "readingid": "4-DIST-2",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 2,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15852,\r
              "hour": "10:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 61.7,\r
              "readingid": "4-DIST-3",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 3,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15905,\r
              "hour": "11:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 62.7,\r
              "readingid": "4-DIST-4",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 4,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15741,\r
              "hour": "12:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 63.3,\r
              "readingid": "4-DIST-5",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 5,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 15391,\r
              "hour": "13:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 63.3,\r
              "readingid": "4-DIST-6",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 6,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 14914,\r
              "hour": "14:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 62.7,\r
              "readingid": "4-DIST-7",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 7,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 70,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 14394,\r
              "hour": "15:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 61.8,\r
              "readingid": "4-DIST-8",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 8,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM1",\r
              "averagelevel": 70,\r
              "category": "Treatment",\r
              "equipment": "Source chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-CHEM1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM2",\r
              "averagelevel": 70,\r
              "category": "Treatment",\r
              "equipment": "Surface chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-CHEM2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "QUALITY",\r
              "averagelevel": 70,\r
              "category": "Monitoring",\r
              "equipment": "Residual analyzer",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-QUALITY-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "ALARM",\r
              "averagelevel": 70,\r
              "category": "Monitoring",\r
              "equipment": "Station alarm indicator",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "4-ALARM-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 996,\r
              "scenario": "Booster maintenance",\r
              "sourceflow": 14782,\r
              "stationalerts": 0,\r
              "stationflow": 15600,\r
              "stationonline": 4,\r
              "stationpressure": 62,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "RW01",\r
              "averagelevel": 26,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 363,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW02",\r
              "averagelevel": 26,\r
              "category": "Remote well",\r
              "equipment": "Remote well 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 394,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-RW02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW03",\r
              "averagelevel": 26,\r
              "category": "Remote well",\r
              "equipment": "Remote well 3",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 426,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-RW03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW04",\r
              "averagelevel": 26,\r
              "category": "Remote well",\r
              "equipment": "Remote well 4",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 457,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-RW04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW05",\r
              "averagelevel": 26,\r
              "category": "Remote well",\r
              "equipment": "Remote well 5",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 489,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-RW05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW06",\r
              "averagelevel": 26,\r
              "category": "Remote well",\r
              "equipment": "Remote well 6",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 520,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-RW06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW07",\r
              "averagelevel": 26,\r
              "category": "Remote well",\r
              "equipment": "Remote well 7",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 552,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-RW07-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW08",\r
              "averagelevel": 26,\r
              "category": "Remote well",\r
              "equipment": "Remote well 8",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 583,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-RW08-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "LW01",\r
              "averagelevel": 26,\r
              "category": "Local well",\r
              "equipment": "On-site source well",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 680,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-LW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW1",\r
              "averagelevel": 26,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 3953,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-SW1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW2",\r
              "averagelevel": 26,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 4250,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-SW2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST1",\r
              "averagelevel": 26,\r
              "category": "Storage",\r
              "equipment": "Storage tank 1",\r
              "equipmentcolor": "#f7ac51",\r
              "flowgpm": 1940,\r
              "hour": "Snapshot",\r
              "levelpct": 20,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-GST1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "GST2",\r
              "averagelevel": 26,\r
              "category": "Storage",\r
              "equipment": "Storage tank 2",\r
              "equipmentcolor": "#f7ac51",\r
              "flowgpm": 1940,\r
              "hour": "Snapshot",\r
              "levelpct": 23,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-GST2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "GST3",\r
              "averagelevel": 26,\r
              "category": "Storage",\r
              "equipment": "Storage tank 3",\r
              "equipmentcolor": "#f7ac51",\r
              "flowgpm": 1940,\r
              "hour": "Snapshot",\r
              "levelpct": 26,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-GST3-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "GST4",\r
              "averagelevel": 26,\r
              "category": "Storage",\r
              "equipment": "Storage tank 4",\r
              "equipmentcolor": "#f7ac51",\r
              "flowgpm": 1940,\r
              "hour": "Snapshot",\r
              "levelpct": 29,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-GST4-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "GST5",\r
              "averagelevel": 26,\r
              "category": "Storage",\r
              "equipment": "Storage tank 5",\r
              "equipmentcolor": "#f7ac51",\r
              "flowgpm": 1940,\r
              "hour": "Snapshot",\r
              "levelpct": 32,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-GST5-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "BP01",\r
              "averagelevel": 26,\r
              "category": "Booster",\r
              "equipment": "Booster pump 1",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 3191,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 77,\r
              "pressurepsi": 50,\r
              "readingid": "5-BP01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1229,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "BP02",\r
              "averagelevel": 26,\r
              "category": "Booster",\r
              "equipment": "Booster pump 2",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-BP02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP03",\r
              "averagelevel": 26,\r
              "category": "Booster",\r
              "equipment": "Booster pump 3",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 3382,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 78,\r
              "pressurepsi": 50,\r
              "readingid": "5-BP03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1238,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "BP04",\r
              "averagelevel": 26,\r
              "category": "Booster",\r
              "equipment": "Booster pump 4",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-BP04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP05",\r
              "averagelevel": 26,\r
              "category": "Booster",\r
              "equipment": "Booster pump 5",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 3127,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 76,\r
              "pressurepsi": 50,\r
              "readingid": "5-BP05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1226,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "BP06",\r
              "averagelevel": 26,\r
              "category": "Booster",\r
              "equipment": "Booster pump 6",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-BP06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "SOURCE",\r
              "averagelevel": 26,\r
              "category": "Header",\r
              "equipment": "Source collection",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 12667,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-SOURCE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SUCTION",\r
              "averagelevel": 26,\r
              "category": "Header",\r
              "equipment": "Storage suction header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9700,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 18,\r
              "readingid": "5-SUCTION-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DISCHARGE",\r
              "averagelevel": 26,\r
              "category": "Header",\r
              "equipment": "Booster discharge header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9700,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 50,\r
              "readingid": "5-DISCHARGE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9700,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 50,\r
              "readingid": "5-DIST-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9118,\r
              "hour": "07:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 48.7,\r
              "readingid": "5-DIST-0",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9434,\r
              "hour": "08:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 49.2,\r
              "readingid": "5-DIST-1",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 1,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9696,\r
              "hour": "09:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 50.2,\r
              "readingid": "5-DIST-2",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 2,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9857,\r
              "hour": "10:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 51,\r
              "readingid": "5-DIST-3",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 3,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9889,\r
              "hour": "11:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 51.4,\r
              "readingid": "5-DIST-4",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 4,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9788,\r
              "hour": "12:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 51.1,\r
              "readingid": "5-DIST-5",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 5,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9570,\r
              "hour": "13:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 50.3,\r
              "readingid": "5-DIST-6",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 6,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 9273,\r
              "hour": "14:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 49.4,\r
              "readingid": "5-DIST-7",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 7,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 26,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8950,\r
              "hour": "15:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 48.7,\r
              "readingid": "5-DIST-8",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 8,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM1",\r
              "averagelevel": 26,\r
              "category": "Treatment",\r
              "equipment": "Source chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-CHEM1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM2",\r
              "averagelevel": 26,\r
              "category": "Treatment",\r
              "equipment": "Surface chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-CHEM2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "QUALITY",\r
              "averagelevel": 26,\r
              "category": "Monitoring",\r
              "equipment": "Residual analyzer",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-QUALITY-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "ALARM",\r
              "averagelevel": 26,\r
              "category": "Monitoring",\r
              "equipment": "Station alarm indicator",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "5-ALARM-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 995,\r
              "scenario": "Low storage",\r
              "sourceflow": 12667,\r
              "stationalerts": 2,\r
              "stationflow": 9700,\r
              "stationonline": 3,\r
              "stationpressure": 50,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "RW01",\r
              "averagelevel": 61,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 192,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW02",\r
              "averagelevel": 61,\r
              "category": "Remote well",\r
              "equipment": "Remote well 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 209,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-RW02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW03",\r
              "averagelevel": 61,\r
              "category": "Remote well",\r
              "equipment": "Remote well 3",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 225,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-RW03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW04",\r
              "averagelevel": 61,\r
              "category": "Remote well",\r
              "equipment": "Remote well 4",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 242,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-RW04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW05",\r
              "averagelevel": 61,\r
              "category": "Remote well",\r
              "equipment": "Remote well 5",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 259,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-RW05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW06",\r
              "averagelevel": 61,\r
              "category": "Remote well",\r
              "equipment": "Remote well 6",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 275,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-RW06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW07",\r
              "averagelevel": 61,\r
              "category": "Remote well",\r
              "equipment": "Remote well 7",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 292,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-RW07-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW08",\r
              "averagelevel": 61,\r
              "category": "Remote well",\r
              "equipment": "Remote well 8",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 309,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-RW08-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "LW01",\r
              "averagelevel": 61,\r
              "category": "Local well",\r
              "equipment": "On-site source well",\r
              "equipmentcolor": "#72849b",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-LW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Offline"\r
            },\r
            {\r
              "assetid": "SW1",\r
              "averagelevel": 61,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 4185,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-SW1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW2",\r
              "averagelevel": 61,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 4500,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-SW2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST1",\r
              "averagelevel": 61,\r
              "category": "Storage",\r
              "equipment": "Storage tank 1",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1720,\r
              "hour": "Snapshot",\r
              "levelpct": 55,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-GST1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST2",\r
              "averagelevel": 61,\r
              "category": "Storage",\r
              "equipment": "Storage tank 2",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1720,\r
              "hour": "Snapshot",\r
              "levelpct": 58,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-GST2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST3",\r
              "averagelevel": 61,\r
              "category": "Storage",\r
              "equipment": "Storage tank 3",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1720,\r
              "hour": "Snapshot",\r
              "levelpct": 61,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-GST3-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST4",\r
              "averagelevel": 61,\r
              "category": "Storage",\r
              "equipment": "Storage tank 4",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1720,\r
              "hour": "Snapshot",\r
              "levelpct": 64,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-GST4-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST5",\r
              "averagelevel": 61,\r
              "category": "Storage",\r
              "equipment": "Storage tank 5",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1720,\r
              "hour": "Snapshot",\r
              "levelpct": 67,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-GST5-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP01",\r
              "averagelevel": 61,\r
              "category": "Booster",\r
              "equipment": "Booster pump 1",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 4175,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 83,\r
              "pressurepsi": 51,\r
              "readingid": "6-BP01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1275,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP02",\r
              "averagelevel": 61,\r
              "category": "Booster",\r
              "equipment": "Booster pump 2",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-BP02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP03",\r
              "averagelevel": 61,\r
              "category": "Booster",\r
              "equipment": "Booster pump 3",\r
              "equipmentcolor": "#31c8a4",\r
              "flowgpm": 4425,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 84,\r
              "pressurepsi": 51,\r
              "readingid": "6-BP03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1287,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP04",\r
              "averagelevel": 61,\r
              "category": "Booster",\r
              "equipment": "Booster pump 4",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-BP04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP05",\r
              "averagelevel": 61,\r
              "category": "Booster",\r
              "equipment": "Booster pump 5",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-BP05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP06",\r
              "averagelevel": 61,\r
              "category": "Booster",\r
              "equipment": "Booster pump 6",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-BP06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "SOURCE",\r
              "averagelevel": 61,\r
              "category": "Header",\r
              "equipment": "Source collection",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 10688,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-SOURCE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SUCTION",\r
              "averagelevel": 61,\r
              "category": "Header",\r
              "equipment": "Storage suction header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8600,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 18,\r
              "readingid": "6-SUCTION-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DISCHARGE",\r
              "averagelevel": 61,\r
              "category": "Header",\r
              "equipment": "Booster discharge header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8600,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 51,\r
              "readingid": "6-DISCHARGE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8600,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 51,\r
              "readingid": "6-DIST-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8084,\r
              "hour": "07:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 50.6,\r
              "readingid": "6-DIST-0",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8365,\r
              "hour": "08:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 51.6,\r
              "readingid": "6-DIST-1",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 1,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8596,\r
              "hour": "09:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 52.3,\r
              "readingid": "6-DIST-2",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 2,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8739,\r
              "hour": "10:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 52.4,\r
              "readingid": "6-DIST-3",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 3,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8768,\r
              "hour": "11:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 51.8,\r
              "readingid": "6-DIST-4",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 4,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8678,\r
              "hour": "12:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 50.9,\r
              "readingid": "6-DIST-5",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 5,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8485,\r
              "hour": "13:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 50,\r
              "readingid": "6-DIST-6",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 6,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8222,\r
              "hour": "14:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 49.6,\r
              "readingid": "6-DIST-7",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 7,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 61,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 7935,\r
              "hour": "15:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 49.8,\r
              "readingid": "6-DIST-8",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 8,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM1",\r
              "averagelevel": 61,\r
              "category": "Treatment",\r
              "equipment": "Source chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-CHEM1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM2",\r
              "averagelevel": 61,\r
              "category": "Treatment",\r
              "equipment": "Surface chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-CHEM2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "QUALITY",\r
              "averagelevel": 61,\r
              "category": "Monitoring",\r
              "equipment": "Residual analyzer",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-QUALITY-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "ALARM",\r
              "averagelevel": 61,\r
              "category": "Monitoring",\r
              "equipment": "Station alarm indicator",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "6-ALARM-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 994,\r
              "scenario": "Limited power",\r
              "sourceflow": 10688,\r
              "stationalerts": 1,\r
              "stationflow": 8600,\r
              "stationonline": 2,\r
              "stationpressure": 51,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "RW01",\r
              "averagelevel": 64,\r
              "category": "Remote well",\r
              "equipment": "Remote well 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 427,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-RW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW02",\r
              "averagelevel": 64,\r
              "category": "Remote well",\r
              "equipment": "Remote well 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 464,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-RW02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW03",\r
              "averagelevel": 64,\r
              "category": "Remote well",\r
              "equipment": "Remote well 3",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 501,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-RW03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW04",\r
              "averagelevel": 64,\r
              "category": "Remote well",\r
              "equipment": "Remote well 4",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 538,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-RW04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW05",\r
              "averagelevel": 64,\r
              "category": "Remote well",\r
              "equipment": "Remote well 5",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 575,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-RW05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW06",\r
              "averagelevel": 64,\r
              "category": "Remote well",\r
              "equipment": "Remote well 6",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 612,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-RW06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW07",\r
              "averagelevel": 64,\r
              "category": "Remote well",\r
              "equipment": "Remote well 7",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 649,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-RW07-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "RW08",\r
              "averagelevel": 64,\r
              "category": "Remote well",\r
              "equipment": "Remote well 8",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 686,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-RW08-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "LW01",\r
              "averagelevel": 64,\r
              "category": "Local well",\r
              "equipment": "On-site source well",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 680,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-LW01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW1",\r
              "averagelevel": 64,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 1",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 4650,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-SW1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SW2",\r
              "averagelevel": 64,\r
              "category": "Surface inlet",\r
              "equipment": "Surface inlet 2",\r
              "equipmentcolor": "#35d4be",\r
              "flowgpm": 5000,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-SW2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST1",\r
              "averagelevel": 64,\r
              "category": "Storage",\r
              "equipment": "Storage tank 1",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1640,\r
              "hour": "Snapshot",\r
              "levelpct": 58,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-GST1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST2",\r
              "averagelevel": 64,\r
              "category": "Storage",\r
              "equipment": "Storage tank 2",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1640,\r
              "hour": "Snapshot",\r
              "levelpct": 61,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-GST2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST3",\r
              "averagelevel": 64,\r
              "category": "Storage",\r
              "equipment": "Storage tank 3",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1640,\r
              "hour": "Snapshot",\r
              "levelpct": 64,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-GST3-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST4",\r
              "averagelevel": 64,\r
              "category": "Storage",\r
              "equipment": "Storage tank 4",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1640,\r
              "hour": "Snapshot",\r
              "levelpct": 67,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-GST4-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "GST5",\r
              "averagelevel": 64,\r
              "category": "Storage",\r
              "equipment": "Storage tank 5",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 1640,\r
              "hour": "Snapshot",\r
              "levelpct": 70,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-GST5-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "BP01",\r
              "averagelevel": 64,\r
              "category": "Booster",\r
              "equipment": "Booster pump 1",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 4205,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 83,\r
              "pressurepsi": 43,\r
              "readingid": "7-BP01-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1276,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "BP02",\r
              "averagelevel": 64,\r
              "category": "Booster",\r
              "equipment": "Booster pump 2",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 3995,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 82,\r
              "pressurepsi": 43,\r
              "readingid": "7-BP02-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 1266,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Warning"\r
            },\r
            {\r
              "assetid": "BP03",\r
              "averagelevel": 64,\r
              "category": "Booster",\r
              "equipment": "Booster pump 3",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-BP03-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP04",\r
              "averagelevel": 64,\r
              "category": "Booster",\r
              "equipment": "Booster pump 4",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-BP04-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP05",\r
              "averagelevel": 64,\r
              "category": "Booster",\r
              "equipment": "Booster pump 5",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-BP05-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "BP06",\r
              "averagelevel": 64,\r
              "category": "Booster",\r
              "equipment": "Booster pump 6",\r
              "equipmentcolor": "#7789a0",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-BP06-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Standby"\r
            },\r
            {\r
              "assetid": "SOURCE",\r
              "averagelevel": 64,\r
              "category": "Header",\r
              "equipment": "Source collection",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 14782,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-SOURCE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "SUCTION",\r
              "averagelevel": 64,\r
              "category": "Header",\r
              "equipment": "Storage suction header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8200,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 18,\r
              "readingid": "7-SUCTION-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DISCHARGE",\r
              "averagelevel": 64,\r
              "category": "Header",\r
              "equipment": "Booster discharge header",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8200,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 43,\r
              "readingid": "7-DISCHARGE-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8200,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 43,\r
              "readingid": "7-DIST-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 7708,\r
              "hour": "07:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 43.9,\r
              "readingid": "7-DIST-0",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 0,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 7975,\r
              "hour": "08:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 44.4,\r
              "readingid": "7-DIST-1",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 1,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8196,\r
              "hour": "09:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 44.2,\r
              "readingid": "7-DIST-2",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 2,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8333,\r
              "hour": "10:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 43.4,\r
              "readingid": "7-DIST-3",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 3,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8360,\r
              "hour": "11:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 42.5,\r
              "readingid": "7-DIST-4",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 4,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8274,\r
              "hour": "12:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 41.8,\r
              "readingid": "7-DIST-5",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 5,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 8090,\r
              "hour": "13:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 41.6,\r
              "readingid": "7-DIST-6",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 6,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 7839,\r
              "hour": "14:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 42.1,\r
              "readingid": "7-DIST-7",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 7,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "DIST",\r
              "averagelevel": 64,\r
              "category": "Distribution",\r
              "equipment": "Distribution interface",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 7566,\r
              "hour": "15:00",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 43,\r
              "readingid": "7-DIST-8",\r
              "recordtype": "Trend",\r
              "rpm": 0,\r
              "sampleorder": 8,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM1",\r
              "averagelevel": 64,\r
              "category": "Treatment",\r
              "equipment": "Source chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-CHEM1-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "CHEM2",\r
              "averagelevel": 64,\r
              "category": "Treatment",\r
              "equipment": "Surface chemical dosing",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-CHEM2-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "QUALITY",\r
              "averagelevel": 64,\r
              "category": "Monitoring",\r
              "equipment": "Residual analyzer",\r
              "equipmentcolor": "#76b6d2",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-QUALITY-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Running"\r
            },\r
            {\r
              "assetid": "ALARM",\r
              "averagelevel": 64,\r
              "category": "Monitoring",\r
              "equipment": "Station alarm indicator",\r
              "equipmentcolor": "#ffa94d",\r
              "flowgpm": 0,\r
              "hour": "Snapshot",\r
              "levelpct": 0,\r
              "motorloadpct": 0,\r
              "pressurepsi": 0,\r
              "readingid": "7-ALARM-snapshot",\r
              "recordtype": "Snapshot",\r
              "rpm": 0,\r
              "sampleorder": 993,\r
              "scenario": "Low distribution pressure",\r
              "sourceflow": 14782,\r
              "stationalerts": 2,\r
              "stationflow": 8200,\r
              "stationonline": 2,\r
              "stationpressure": 43,\r
              "status": "Warning"\r
            }\r
          ]\r
        },\r
        "fileName": "data.csv",\r
        "id": "src_data_1gdzvsd",\r
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
    "id": "example-water-pump-station-digital-twin",\r
    "name": "Water Pump Station | Process Digital Twin",\r
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
      "maxConcurrentAnimations": 24,\r
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
        "shortTitle": "AG",\r
        "subtitle": "Station engineering",\r
        "title": "AquaGrid"\r
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
            "label": "Training model",\r
            "value": "Synthetic scenarios"\r
          }\r
        ],\r
        "subtitle": "Sources • treatment • five storage tanks • six booster pumps • distribution",\r
        "title": "Water Pump Station | Process Digital Twin",\r
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
            "water_scene",\r
            "flow_kpi",\r
            "pressure_kpi",\r
            "pumps_kpi",\r
            "storage_kpi",\r
            "alerts_kpi",\r
            "source_kpi",\r
            "flow_history",\r
            "pressure_history",\r
            "booster_load",\r
            "storage_levels",\r
            "asset_register"\r
          ]\r
        },\r
        "label": "Operating scenario",\r
        "options": [\r
          "Normal supply",\r
          "Peak demand",\r
          "Remote wells offline",\r
          "Surface inlet unavailable",\r
          "Booster maintenance",\r
          "Low storage",\r
          "Limited power",\r
          "Low distribution pressure"\r
        ],\r
        "type": "segmentedControl"\r
      },\r
      {\r
        "id": "process_legend",\r
        "text": "SOURCE NETWORK  →  GROUND STORAGE  →  BOOSTER ARRAY  →  DISTRIBUTION | Teal: raw/source flows • Blue: transfer/discharge • Green: running • Amber: warning. All values are simulated and are not operational guidance.",\r
        "type": "text"\r
      },\r
      {\r
        "children": [\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "stationflow",\r
            "id": "flow_kpi",\r
            "span": 2,\r
            "title": "Discharge flow (GPM)",\r
            "type": "kpi"\r
          },\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "stationpressure",\r
            "id": "pressure_kpi",\r
            "span": 2,\r
            "title": "Discharge (PSI)",\r
            "type": "kpi"\r
          },\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "stationonline",\r
            "id": "pumps_kpi",\r
            "intent": "success",\r
            "span": 2,\r
            "title": "Boosters online",\r
            "type": "kpi"\r
          },\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "averagelevel",\r
            "id": "storage_kpi",\r
            "span": 2,\r
            "title": "Mean GST level (%)",\r
            "type": "kpi"\r
          },\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "sourceflow",\r
            "id": "source_kpi",\r
            "span": 2,\r
            "title": "Source intake (GPM)",\r
            "type": "kpi"\r
          },\r
          {\r
            "aggregation": "first",\r
            "dataset": "snapshots",\r
            "field": "stationalerts",\r
            "id": "alerts_kpi",\r
            "intent": "warning",\r
            "span": 2,\r
            "title": "Active alerts",\r
            "type": "kpi"\r
          }\r
        ],\r
        "columns": 12,\r
        "id": "station_kpis",\r
        "type": "grid"\r
      },\r
      {\r
        "colorField": "equipmentcolor",\r
        "dataset": "snapshots",\r
        "flowField": "flowgpm",\r
        "grid": true,\r
        "height": 570,\r
        "id": "water_scene",\r
        "interaction": {\r
          "clearOnSecondClick": true,\r
          "enabled": true,\r
          "externalMode": "selection",\r
          "field": "assetid",\r
          "internalMode": "filter",\r
          "internalScope": "others",\r
          "multiSelect": true,\r
          "selectionMode": "replace",\r
          "showSelector": false,\r
          "targets": [\r
            "asset_register",\r
            "booster_load",\r
            "storage_levels"\r
          ],\r
          "trigger": "click"\r
        },\r
        "levelField": "levelpct",\r
        "objectIdField": "assetid",\r
        "objects": [\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "DIST",\r
            "id": "distribution_delivery",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              8.62,\r
              0.58,\r
              0\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.34,\r
              2.78,\r
              0.34\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "BP01",\r
            "id": "booster_discharge_1",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              6.21,\r
              0.58,\r
              -4\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.02,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "BP02",\r
            "id": "booster_discharge_2",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              6.21,\r
              0.58,\r
              -2.4\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.02,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "BP03",\r
            "id": "booster_discharge_3",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              6.21,\r
              0.58,\r
              -0.8\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.02,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "BP04",\r
            "id": "booster_discharge_4",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              6.21,\r
              0.58,\r
              0.8\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.02,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "BP05",\r
            "id": "booster_discharge_5",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              6.21,\r
              0.58,\r
              2.4\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.02,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "BP06",\r
            "id": "booster_discharge_6",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              6.21,\r
              0.58,\r
              4\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.02,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "id": "booster_suction_1",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              4.26,\r
              0.54,\r
              -4\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.2,\r
              1.92,\r
              0.2\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "id": "booster_suction_2",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              4.26,\r
              0.54,\r
              -2.4\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.2,\r
              1.92,\r
              0.2\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "id": "booster_suction_3",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              4.26,\r
              0.54,\r
              -0.8\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.2,\r
              1.92,\r
              0.2\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "id": "booster_suction_4",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              4.26,\r
              0.54,\r
              0.8\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.2,\r
              1.92,\r
              0.2\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "id": "booster_suction_5",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              4.26,\r
              0.54,\r
              2.4\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.2,\r
              1.92,\r
              0.2\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "id": "booster_suction_6",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              4.26,\r
              0.54,\r
              4\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.2,\r
              1.92,\r
              0.2\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "GST1",\r
            "id": "tank_outlet_1",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              1.88,\r
              0.53,\r
              -4.1\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.85,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "GST2",\r
            "id": "tank_outlet_2",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              1.88,\r
              0.53,\r
              -2.05\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.85,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "GST3",\r
            "id": "tank_outlet_3",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              1.88,\r
              0.53,\r
              0\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.85,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "GST4",\r
            "id": "tank_outlet_4",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              1.88,\r
              0.53,\r
              2.05\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.85,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "flowKey": "GST5",\r
            "id": "tank_outlet_5",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              1.88,\r
              0.53,\r
              4.1\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.21,\r
              2.85,\r
              0.21\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "flowKey": "SOURCE",\r
            "id": "source_transfer",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -3.55,\r
              0.52,\r
              0.25\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.28,\r
              3.7,\r
              0.28\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "flowKey": "SW1",\r
            "id": "surface_supply_1",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              3.82\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.2,\r
              2.8,\r
              0.2\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "flowKey": "SW2",\r
            "id": "surface_supply_2",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              4.75\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.2,\r
              2.8,\r
              0.2\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "local_source_flow",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              2.63\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.16,\r
              2.8,\r
              0.16\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "tank_inlet_1",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -0.68,\r
              0.52,\r
              -4.1\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.19,\r
              2.05,\r
              0.19\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "tank_inlet_2",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -0.68,\r
              0.52,\r
              -2.05\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.19,\r
              2.05,\r
              0.19\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "tank_inlet_3",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -0.68,\r
              0.52,\r
              0\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.19,\r
              2.05,\r
              0.19\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "tank_inlet_4",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -0.68,\r
              0.52,\r
              2.05\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.19,\r
              2.05,\r
              0.19\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "tank_inlet_5",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -0.68,\r
              0.52,\r
              4.1\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.19,\r
              2.05,\r
              0.19\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "well_flow_RW01",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              -4.25\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.14,\r
              2.8,\r
              0.14\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "well_flow_RW02",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              -3.45\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.14,\r
              2.8,\r
              0.14\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "well_flow_RW03",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              -2.65\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.14,\r
              2.8,\r
              0.14\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "well_flow_RW04",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              -1.8499999999999996\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.14,\r
              2.8,\r
              0.14\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "well_flow_RW05",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              -1.0499999999999998\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.14,\r
              2.8,\r
              0.14\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "well_flow_RW06",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              -0.25\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.14,\r
              2.8,\r
              0.14\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "well_flow_RW07",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              0.5500000000000007\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.14,\r
              2.8,\r
              0.14\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "well_flow_RW08",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -6.8,\r
              0.52,\r
              1.3500000000000005\r
            ],\r
            "rotation": [\r
              0,\r
              0,\r
              -90\r
            ],\r
            "size": [\r
              0.14,\r
              2.8,\r
              0.14\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "dataKey": "RW01",\r
            "id": "well_head_RW01",\r
            "kind": "cylinder",\r
            "label": "Remote source 1",\r
            "position": [\r
              -8.2,\r
              0.25,\r
              -4.25\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.38,\r
              0.42,\r
              0.38\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "dataKey": "RW02",\r
            "id": "well_head_RW02",\r
            "kind": "cylinder",\r
            "label": "Remote source 2",\r
            "position": [\r
              -8.2,\r
              0.25,\r
              -3.45\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.38,\r
              0.42,\r
              0.38\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "dataKey": "RW03",\r
            "id": "well_head_RW03",\r
            "kind": "cylinder",\r
            "label": "Remote source 3",\r
            "position": [\r
              -8.2,\r
              0.25,\r
              -2.65\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.38,\r
              0.42,\r
              0.38\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "dataKey": "RW04",\r
            "id": "well_head_RW04",\r
            "kind": "cylinder",\r
            "label": "Remote source 4",\r
            "position": [\r
              -8.2,\r
              0.25,\r
              -1.8499999999999996\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.38,\r
              0.42,\r
              0.38\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "dataKey": "RW05",\r
            "id": "well_head_RW05",\r
            "kind": "cylinder",\r
            "label": "Remote source 5",\r
            "position": [\r
              -8.2,\r
              0.25,\r
              -1.0499999999999998\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.38,\r
              0.42,\r
              0.38\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "dataKey": "RW06",\r
            "id": "well_head_RW06",\r
            "kind": "cylinder",\r
            "label": "Remote source 6",\r
            "position": [\r
              -8.2,\r
              0.25,\r
              -0.25\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.38,\r
              0.42,\r
              0.38\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "dataKey": "RW07",\r
            "id": "well_head_RW07",\r
            "kind": "cylinder",\r
            "label": "Remote source 7",\r
            "position": [\r
              -8.2,\r
              0.25,\r
              0.5500000000000007\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.38,\r
              0.42,\r
              0.38\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "dataKey": "RW08",\r
            "id": "well_head_RW08",\r
            "kind": "cylinder",\r
            "label": "Remote source 8",\r
            "position": [\r
              -8.2,\r
              0.25,\r
              1.3500000000000005\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.38,\r
              0.42,\r
              0.38\r
            ]\r
          },\r
          {\r
            "dataKey": "LW01",\r
            "id": "local_source",\r
            "kind": "pump",\r
            "label": "On-site well",\r
            "position": [\r
              -8.2,\r
              0.04,\r
              2.63\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.54,\r
              0.58,\r
              0.54\r
            ]\r
          },\r
          {\r
            "color": "#d5a15d",\r
            "dataKey": "SW1",\r
            "id": "surface_valve_1",\r
            "kind": "box",\r
            "label": "Surface source valve 1",\r
            "position": [\r
              -8.3,\r
              0.47,\r
              3.82\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.5,\r
              0.52,\r
              0.45\r
            ]\r
          },\r
          {\r
            "color": "#b8d8e9",\r
            "id": "surface_meter_1",\r
            "kind": "sphere",\r
            "position": [\r
              -6.65,\r
              0.52,\r
              3.82\r
            ],\r
            "selectable": false,\r
            "size": [\r
              0.25,\r
              0.25,\r
              0.25\r
            ]\r
          },\r
          {\r
            "color": "#d5a15d",\r
            "dataKey": "SW2",\r
            "id": "surface_valve_2",\r
            "kind": "box",\r
            "label": "Surface source valve 2",\r
            "position": [\r
              -8.3,\r
              0.47,\r
              4.75\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.5,\r
              0.52,\r
              0.45\r
            ]\r
          },\r
          {\r
            "color": "#b8d8e9",\r
            "id": "surface_meter_2",\r
            "kind": "sphere",\r
            "position": [\r
              -6.65,\r
              0.52,\r
              4.75\r
            ],\r
            "selectable": false,\r
            "size": [\r
              0.25,\r
              0.25,\r
              0.25\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "source_collector",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -5.4,\r
              0.52,\r
              0.25\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.28,\r
              9.1,\r
              0.28\r
            ]\r
          },\r
          {\r
            "color": "#279bb9",\r
            "id": "storage_inlet_header",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              -1.7,\r
              0.52,\r
              0\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.29,\r
              8.8,\r
              0.29\r
            ]\r
          },\r
          {\r
            "color": "#81b5cb",\r
            "dataKey": "GST1",\r
            "id": "tank_1",\r
            "kind": "tank",\r
            "label": "Ground storage 1",\r
            "position": [\r
              0.45,\r
              0,\r
              -4.1\r
            ],\r
            "selectable": true,\r
            "size": [\r
              1.02,\r
              1.14,\r
              1.02\r
            ]\r
          },\r
          {\r
            "color": "#81b5cb",\r
            "dataKey": "GST2",\r
            "id": "tank_2",\r
            "kind": "tank",\r
            "label": "Ground storage 2",\r
            "position": [\r
              0.45,\r
              0,\r
              -2.05\r
            ],\r
            "selectable": true,\r
            "size": [\r
              1.02,\r
              1.14,\r
              1.02\r
            ]\r
          },\r
          {\r
            "color": "#81b5cb",\r
            "dataKey": "GST3",\r
            "id": "tank_3",\r
            "kind": "tank",\r
            "label": "Ground storage 3",\r
            "position": [\r
              0.45,\r
              0,\r
              0\r
            ],\r
            "selectable": true,\r
            "size": [\r
              1.02,\r
              1.14,\r
              1.02\r
            ]\r
          },\r
          {\r
            "color": "#81b5cb",\r
            "dataKey": "GST4",\r
            "id": "tank_4",\r
            "kind": "tank",\r
            "label": "Ground storage 4",\r
            "position": [\r
              0.45,\r
              0,\r
              2.05\r
            ],\r
            "selectable": true,\r
            "size": [\r
              1.02,\r
              1.14,\r
              1.02\r
            ]\r
          },\r
          {\r
            "color": "#81b5cb",\r
            "dataKey": "GST5",\r
            "id": "tank_5",\r
            "kind": "tank",\r
            "label": "Ground storage 5",\r
            "position": [\r
              0.45,\r
              0,\r
              4.1\r
            ],\r
            "selectable": true,\r
            "size": [\r
              1.02,\r
              1.14,\r
              1.02\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "id": "suction_header",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              3.3,\r
              0.53,\r
              0\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.32,\r
              9,\r
              0.32\r
            ]\r
          },\r
          {\r
            "dataKey": "BP01",\r
            "id": "booster_1",\r
            "kind": "pump",\r
            "label": "Booster 1",\r
            "position": [\r
              5.22,\r
              0.06,\r
              -4\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.75,\r
              0.8,\r
              0.8\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 900,\r
                "rpmField": "rpm"\r
              }\r
            ],\r
            "color": "#65b8f4",\r
            "dataKey": "BP01",\r
            "id": "motor_fan_1",\r
            "kind": "fan",\r
            "label": "Pump motor cooling fan 1",\r
            "position": [\r
              5.22,\r
              1.16,\r
              -4\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.45,\r
              0.45,\r
              0.45\r
            ]\r
          },\r
          {\r
            "dataKey": "BP02",\r
            "id": "booster_2",\r
            "kind": "pump",\r
            "label": "Booster 2",\r
            "position": [\r
              5.22,\r
              0.06,\r
              -2.4\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.75,\r
              0.8,\r
              0.8\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 900,\r
                "rpmField": "rpm"\r
              }\r
            ],\r
            "color": "#65b8f4",\r
            "dataKey": "BP02",\r
            "id": "motor_fan_2",\r
            "kind": "fan",\r
            "label": "Pump motor cooling fan 2",\r
            "position": [\r
              5.22,\r
              1.16,\r
              -2.4\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.45,\r
              0.45,\r
              0.45\r
            ]\r
          },\r
          {\r
            "dataKey": "BP03",\r
            "id": "booster_3",\r
            "kind": "pump",\r
            "label": "Booster 3",\r
            "position": [\r
              5.22,\r
              0.06,\r
              -0.8\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.75,\r
              0.8,\r
              0.8\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 900,\r
                "rpmField": "rpm"\r
              }\r
            ],\r
            "color": "#65b8f4",\r
            "dataKey": "BP03",\r
            "id": "motor_fan_3",\r
            "kind": "fan",\r
            "label": "Pump motor cooling fan 3",\r
            "position": [\r
              5.22,\r
              1.16,\r
              -0.8\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.45,\r
              0.45,\r
              0.45\r
            ]\r
          },\r
          {\r
            "dataKey": "BP04",\r
            "id": "booster_4",\r
            "kind": "pump",\r
            "label": "Booster 4",\r
            "position": [\r
              5.22,\r
              0.06,\r
              0.8\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.75,\r
              0.8,\r
              0.8\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 900,\r
                "rpmField": "rpm"\r
              }\r
            ],\r
            "color": "#65b8f4",\r
            "dataKey": "BP04",\r
            "id": "motor_fan_4",\r
            "kind": "fan",\r
            "label": "Pump motor cooling fan 4",\r
            "position": [\r
              5.22,\r
              1.16,\r
              0.8\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.45,\r
              0.45,\r
              0.45\r
            ]\r
          },\r
          {\r
            "dataKey": "BP05",\r
            "id": "booster_5",\r
            "kind": "pump",\r
            "label": "Booster 5",\r
            "position": [\r
              5.22,\r
              0.06,\r
              2.4\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.75,\r
              0.8,\r
              0.8\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 900,\r
                "rpmField": "rpm"\r
              }\r
            ],\r
            "color": "#65b8f4",\r
            "dataKey": "BP05",\r
            "id": "motor_fan_5",\r
            "kind": "fan",\r
            "label": "Pump motor cooling fan 5",\r
            "position": [\r
              5.22,\r
              1.16,\r
              2.4\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.45,\r
              0.45,\r
              0.45\r
            ]\r
          },\r
          {\r
            "dataKey": "BP06",\r
            "id": "booster_6",\r
            "kind": "pump",\r
            "label": "Booster 6",\r
            "position": [\r
              5.22,\r
              0.06,\r
              4\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.75,\r
              0.8,\r
              0.8\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "axis": "z",\r
                "enabledField": "flowgpm",\r
                "kind": "rotate",\r
                "rpm": 900,\r
                "rpmField": "rpm"\r
              }\r
            ],\r
            "color": "#65b8f4",\r
            "dataKey": "BP06",\r
            "id": "motor_fan_6",\r
            "kind": "fan",\r
            "label": "Pump motor cooling fan 6",\r
            "position": [\r
              5.22,\r
              1.16,\r
              4\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.45,\r
              0.45,\r
              0.45\r
            ]\r
          },\r
          {\r
            "color": "#4b94cd",\r
            "id": "discharge_header",\r
            "kind": "pipe",\r
            "metalness": 0.48,\r
            "position": [\r
              7.23,\r
              0.58,\r
              0\r
            ],\r
            "rotation": [\r
              90,\r
              0,\r
              0\r
            ],\r
            "size": [\r
              0.32,\r
              9,\r
              0.32\r
            ]\r
          },\r
          {\r
            "color": "#b9def5",\r
            "dataKey": "DIST",\r
            "id": "distribution_meter",\r
            "kind": "sphere",\r
            "label": "Distribution meter",\r
            "position": [\r
              9.35,\r
              0.59,\r
              0\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.34,\r
              0.34,\r
              0.34\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "amplitude": 0.22,\r
                "enabledField": "status",\r
                "enabledValue": "Running",\r
                "kind": "pulse",\r
                "period": 1.35\r
              }\r
            ],\r
            "color": "#dfa36a",\r
            "dataKey": "CHEM1",\r
            "id": "CHEM1",\r
            "kind": "sphere",\r
            "label": "Source treatment injection",\r
            "position": [\r
              -5.15,\r
              1.15,\r
              -0.9\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.27,\r
              0.27,\r
              0.27\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "amplitude": 0.22,\r
                "enabledField": "status",\r
                "enabledValue": "Running",\r
                "kind": "pulse",\r
                "period": 1.35\r
              }\r
            ],\r
            "color": "#dfa36a",\r
            "dataKey": "CHEM2",\r
            "id": "CHEM2",\r
            "kind": "sphere",\r
            "label": "Surface treatment injection",\r
            "position": [\r
              -5.15,\r
              1.15,\r
              3.9\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.27,\r
              0.27,\r
              0.27\r
            ]\r
          },\r
          {\r
            "color": "#b4d5dc",\r
            "dataKey": "QUALITY",\r
            "id": "quality_monitor",\r
            "kind": "box",\r
            "label": "Distribution residual monitor",\r
            "position": [\r
              9.35,\r
              1.43,\r
              0.9\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.42,\r
              0.45,\r
              0.28\r
            ]\r
          },\r
          {\r
            "animations": [\r
              {\r
                "amplitude": 0.3,\r
                "enabledField": "status",\r
                "enabledValue": "Warning",\r
                "kind": "pulse",\r
                "period": 1.4\r
              }\r
            ],\r
            "color": "#f5b556",\r
            "dataKey": "ALARM",\r
            "id": "alarm_beacon",\r
            "kind": "sphere",\r
            "label": "Station alarm indicator",\r
            "position": [\r
              8.6,\r
              1.58,\r
              0.9\r
            ],\r
            "selectable": true,\r
            "size": [\r
              0.22,\r
              0.22,\r
              0.22\r
            ]\r
          }\r
        ],\r
        "shadows": true,\r
        "showLabels": false,\r
        "showObjectList": true,\r
        "statusColors": [\r
          {\r
            "color": "#31c8a4",\r
            "value": "Running"\r
          },\r
          {\r
            "color": "#f7ab50",\r
            "value": "Warning"\r
          },\r
          {\r
            "color": "#7789a0",\r
            "value": "Standby"\r
          },\r
          {\r
            "color": "#d77378",\r
            "value": "Offline"\r
          }\r
        ],\r
        "statusField": "status",\r
        "theme": "dark",\r
        "title": "Process route | sources → storage → boosters → distribution",\r
        "tooltipFields": [\r
          {\r
            "field": "equipment",\r
            "label": "Equipment"\r
          },\r
          {\r
            "field": "status",\r
            "label": "State"\r
          },\r
          {\r
            "field": "flowgpm",\r
            "label": "Flow (GPM)"\r
          },\r
          {\r
            "field": "levelpct",\r
            "label": "Level (%)"\r
          },\r
          {\r
            "field": "pressurepsi",\r
            "label": "Pressure (PSI)"\r
          },\r
          {\r
            "field": "rpm",\r
            "label": "RPM"\r
          }\r
        ],\r
        "type": "scene3d",\r
        "view": "isometric"\r
      },\r
      {\r
        "children": [\r
          {\r
            "aggregation": "avg",\r
            "category": "hour",\r
            "dataset": "trends",\r
            "height": 250,\r
            "id": "pressure_history",\r
            "interaction": {\r
              "enabled": false,\r
              "externalMode": "none",\r
              "internalMode": "none"\r
            },\r
            "measure": "pressurepsi",\r
            "options": {\r
              "color": [\r
                "#31d5bf",\r
                "#77b7e5",\r
                "#f7ab50"\r
              ],\r
              "textStyle": {\r
                "color": "#dce9fa"\r
              },\r
              "xAxis": {\r
                "axisLabel": {\r
                  "color": "#91a7bc"\r
                },\r
                "axisLine": {\r
                  "lineStyle": {\r
                    "color": "#34445b"\r
                  }\r
                }\r
              },\r
              "yAxis": {\r
                "axisLabel": {\r
                  "color": "#91a7bc"\r
                },\r
                "splitLine": {\r
                  "lineStyle": {\r
                    "color": "#273a50"\r
                  }\r
                }\r
              }\r
            },\r
            "span": 6,\r
            "title": "Distribution pressure · PSI",\r
            "type": "lineChart"\r
          },\r
          {\r
            "aggregation": "avg",\r
            "category": "hour",\r
            "dataset": "trends",\r
            "height": 250,\r
            "id": "flow_history",\r
            "interaction": {\r
              "enabled": false,\r
              "externalMode": "none",\r
              "internalMode": "none"\r
            },\r
            "measure": "flowgpm",\r
            "options": {\r
              "color": [\r
                "#31d5bf",\r
                "#77b7e5",\r
                "#f7ab50"\r
              ],\r
              "textStyle": {\r
                "color": "#dce9fa"\r
              },\r
              "xAxis": {\r
                "axisLabel": {\r
                  "color": "#91a7bc"\r
                },\r
                "axisLine": {\r
                  "lineStyle": {\r
                    "color": "#34445b"\r
                  }\r
                }\r
              },\r
              "yAxis": {\r
                "axisLabel": {\r
                  "color": "#91a7bc"\r
                },\r
                "splitLine": {\r
                  "lineStyle": {\r
                    "color": "#273a50"\r
                  }\r
                }\r
              }\r
            },\r
            "span": 6,\r
            "title": "Distribution flow · GPM",\r
            "type": "lineChart"\r
          }\r
        ],\r
        "columns": 12,\r
        "id": "station_trends",\r
        "type": "grid"\r
      },\r
      {\r
        "children": [\r
          {\r
            "aggregation": "first",\r
            "category": "assetid",\r
            "dataset": "boosters",\r
            "height": 260,\r
            "id": "booster_load",\r
            "interaction": {\r
              "enabled": true,\r
              "externalMode": "selection",\r
              "field": "assetid",\r
              "internalMode": "highlight",\r
              "targets": [\r
                "water_scene",\r
                "asset_register"\r
              ],\r
              "trigger": "click"\r
            },\r
            "measure": "motorloadpct",\r
            "options": {\r
              "color": [\r
                "#31d5bf",\r
                "#77b7e5",\r
                "#f7ab50"\r
              ],\r
              "textStyle": {\r
                "color": "#dce9fa"\r
              },\r
              "xAxis": {\r
                "axisLabel": {\r
                  "color": "#91a7bc"\r
                },\r
                "axisLine": {\r
                  "lineStyle": {\r
                    "color": "#34445b"\r
                  }\r
                }\r
              },\r
              "yAxis": {\r
                "axisLabel": {\r
                  "color": "#91a7bc"\r
                },\r
                "splitLine": {\r
                  "lineStyle": {\r
                    "color": "#273a50"\r
                  }\r
                }\r
              }\r
            },\r
            "span": 7,\r
            "title": "Motor utilization · %",\r
            "type": "barChart"\r
          },\r
          {\r
            "aggregation": "first",\r
            "category": "assetid",\r
            "dataset": "storage",\r
            "height": 260,\r
            "id": "storage_levels",\r
            "interaction": {\r
              "enabled": true,\r
              "externalMode": "selection",\r
              "field": "assetid",\r
              "internalMode": "highlight",\r
              "targets": [\r
                "water_scene",\r
                "asset_register"\r
              ],\r
              "trigger": "click"\r
            },\r
            "measure": "levelpct",\r
            "options": {\r
              "color": [\r
                "#31d5bf",\r
                "#77b7e5",\r
                "#f7ab50"\r
              ],\r
              "textStyle": {\r
                "color": "#dce9fa"\r
              },\r
              "xAxis": {\r
                "axisLabel": {\r
                  "color": "#91a7bc"\r
                },\r
                "axisLine": {\r
                  "lineStyle": {\r
                    "color": "#34445b"\r
                  }\r
                }\r
              },\r
              "yAxis": {\r
                "axisLabel": {\r
                  "color": "#91a7bc"\r
                },\r
                "splitLine": {\r
                  "lineStyle": {\r
                    "color": "#273a50"\r
                  }\r
                }\r
              }\r
            },\r
            "span": 5,\r
            "title": "Ground storage levels · %",\r
            "type": "barChart"\r
          }\r
        ],\r
        "columns": 12,\r
        "id": "equipment_charts",\r
        "type": "grid"\r
      },\r
      {\r
        "columns": [\r
          {\r
            "field": "assetid",\r
            "title": "Asset"\r
          },\r
          {\r
            "field": "equipment",\r
            "title": "Equipment"\r
          },\r
          {\r
            "field": "category",\r
            "title": "Class"\r
          },\r
          {\r
            "field": "status",\r
            "title": "State"\r
          },\r
          {\r
            "field": "flowgpm",\r
            "title": "Flow (GPM)"\r
          },\r
          {\r
            "field": "levelpct",\r
            "title": "Level (%)"\r
          },\r
          {\r
            "field": "pressurepsi",\r
            "title": "PSI"\r
          },\r
          {\r
            "field": "rpm",\r
            "title": "RPM"\r
          }\r
        ],\r
        "dataset": "snapshots",\r
        "id": "asset_register",\r
        "interaction": {\r
          "enabled": true,\r
          "externalMode": "selection",\r
          "field": "assetid",\r
          "internalMode": "highlight",\r
          "targets": [\r
            "water_scene"\r
          ],\r
          "trigger": "click"\r
        },\r
        "maxRows": 40,\r
        "title": "Equipment | scenario snapshot",\r
        "type": "table"\r
      },\r
      {\r
        "id": "engineering_note",\r
        "text": "Engineering demonstration only. Fictional equipment IDs, modeled flow paths, scenario values, and alarm rules. Not a validated hydraulic model or operating procedure.",\r
        "type": "text"\r
      }\r
    ],\r
    "data": {\r
      "datasets": {\r
        "boosters": {\r
          "filter": {\r
            "field": "category",\r
            "operator": "=",\r
            "value": "Booster"\r
          },\r
          "source": "snapshots"\r
        },\r
        "readings": {\r
          "sort": [\r
            {\r
              "direction": "descending",\r
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
          "source": "readings"\r
        },\r
        "storage": {\r
          "filter": {\r
            "field": "category",\r
            "operator": "=",\r
            "value": "Storage"\r
          },\r
          "source": "snapshots"\r
        },\r
        "trends": {\r
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
        }\r
      }\r
    },\r
    "styles": {\r
      "globalCss": "\\n.hp-app-main,.hp-grid { background:#07121e; }\\n.hp-navbar,.hp-page-header { background:#0a1828; border-color:#22384f; }\\n.hp-card,.hp-metric,.hp-table-wrap { background:#102237; border-color:#2b4159; box-shadow:0 8px 28px rgb(0 0 0 / 20%); }\\n.hp-metric { border:1px solid #29415b; border-left:0; }\\n.hp-metric-label { color:#8da9c0; text-transform:none; }\\n.hp-metric-value { color:#f0faff; font-size:23px; }\\n.hp-table th { background:#122a42; color:#a8c1d3; }\\n.hp-card-header { border-color:#2b4159; }\\n"\r
    },\r
    "theme": {\r
      "accentColor": "#2dd7bd",\r
      "borderColor": "#29415b",\r
      "dangerColor": "#dc6873",\r
      "density": "compact",\r
      "gap": 10,\r
      "mode": "dark",\r
      "primaryColor": "#63b6e5",\r
      "radius": 12,\r
      "successColor": "#25bd9e",\r
      "surfaceColor": "#0d1b2b",\r
      "textColor": "#e9f4fb",\r
      "warningColor": "#efa84e"\r
    },\r
    "title": "Water Pump Station | Process Digital Twin",\r
    "version": "2.0"\r
  }\r
}\r
`;export{r as default};
//# sourceMappingURL=project-CmNO6vzl.js.map
