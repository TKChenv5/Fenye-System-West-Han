#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import math


chang_an_x = 109.3
chang_an_y = 35.5

stars_data = [
    {"name": "角宿", "azimuth": 0, "radius": 1.0, "distance": 12, "cumulative": 0, "symbol": "苍龙", "state": "兖州"},
    {"name": "亢宿", "azimuth": 11.835616438356164, "radius": 1.0, "distance": 9, "cumulative": 12, "symbol": "苍龙", "state": "兖州"},
    {"name": "氐宿", "azimuth": 20.712328767123289, "radius": 1.0, "distance": 15, "cumulative": 21, "symbol": "苍龙", "state": "兖州"},
    {"name": "房宿", "azimuth": 35.506849315068493, "radius": 1.0, "distance": 5, "cumulative": 36, "symbol": "苍龙", "state": "豫州"},
    {"name": "心宿", "azimuth": 40.438356164383563, "radius": 1.0, "distance": 5, "cumulative": 41, "symbol": "苍龙", "state": "豫州"},
    {"name": "尾宿", "azimuth": 45.369863013698627, "radius": 1.0, "distance": 18, "cumulative": 46, "symbol": "苍龙", "state": "幽州"},
    {"name": "箕宿", "azimuth": 63.123287671232873, "radius": 1.0, "distance": 11, "cumulative": 64, "symbol": "苍龙", "state": "幽州"},
    {"name": "斗宿", "azimuth": 73.972602739726028, "radius": 1.0, "distance": 26, "cumulative": 75, "symbol": "玄武", "state": "江/湖"},
    {"name": "牛宿", "azimuth": 99.61643835616438, "radius": 1.0, "distance": 8, "cumulative": 101, "symbol": "玄武", "state": "扬州"},
    {"name": "女宿", "azimuth": 107.50684931506849, "radius": 1.0, "distance": 12, "cumulative": 109, "symbol": "玄武", "state": "扬州"},
    {"name": "虚宿", "azimuth": 119.34246575342466, "radius": 1.0, "distance": 10, "cumulative": 121, "symbol": "玄武", "state": "青州"},
    {"name": "危宿", "azimuth": 129.20547945205479, "radius": 1.0, "distance": 17, "cumulative": 131, "symbol": "玄武", "state": "青州"},
    {"name": "室宿", "azimuth": 145.97260273972603, "radius": 1.0, "distance": 16, "cumulative": 148, "symbol": "玄武", "state": "并州"},
    {"name": "壁宿", "azimuth": 161.75342465753425, "radius": 1.0, "distance": 9, "cumulative": 164, "symbol": "玄武", "state": "并州"},
    {"name": "奎宿", "azimuth": 170.63013698630138, "radius": 1.0, "distance": 16, "cumulative": 173, "symbol": "白虎", "state": "徐州"},
    {"name": "娄宿", "azimuth": 186.41095890410958, "radius": 1.0, "distance": 12, "cumulative": 189, "symbol": "白虎", "state": "徐州"},
    {"name": "胃宿", "azimuth": 198.24657534246575, "radius": 1.0, "distance": 14, "cumulative": 201, "symbol": "白虎", "state": "冀州"},
    {"name": "昴宿", "azimuth": 212.05479452054794, "radius": 1.0, "distance": 14, "cumulative": 215, "symbol": "白虎", "state": "冀州"},
    {"name": "毕宿", "azimuth": 222.9041095890411, "radius": 1.0, "distance": 16, "cumulative": 229, "symbol": "白虎", "state": "益州"},
    {"name": "觜宿", "azimuth": 238.68493150684932, "radius": 1.0, "distance": 5, "cumulative": 245, "symbol": "白虎", "state": "益州"},
    {"name": "参宿", "azimuth": 240.65753424657535, "radius": 1.0, "distance": 8, "cumulative": 250, "symbol": "白虎", "state": "益州"},
    {"name": "井宿", "azimuth": 249.53424657534245, "radius": 1.0, "distance": 33, "cumulative": 258, "symbol": "朱雀", "state": "雍州"},
    {"name": "鬼宿", "azimuth": 282.0821917808219, "radius": 1.0, "distance": 4, "cumulative": 291, "symbol": "朱雀", "state": "三河"},
    {"name": "柳宿", "azimuth": 286.027397260274, "radius": 1.0, "distance": 15, "cumulative": 295, "symbol": "朱雀", "state": "三河"},
    {"name": "星宿", "azimuth": 300.82191780821915, "radius": 1.0, "distance": 7, "cumulative": 310, "symbol": "朱雀", "state": "荆州"},
    {"name": "张宿", "azimuth": 307.7260273972603, "radius": 1.0, "distance": 18, "cumulative": 317, "symbol": "朱雀", "state": "荆州"},
    {"name": "翼宿", "azimuth": 325.47945205479454, "radius": 1.0, "distance": 19, "cumulative": 335, "symbol": "朱雀", "state": "荆州"},
    {"name": "轸宿", "azimuth": 343.2328767123288, "radius": 1.0, "distance": 17, "cumulative": 354, "symbol": "朱雀", "state": "荆州"},
]

stars_features = []
for i, star in enumerate(stars_data):
    azimuth = star['azimuth']
    radius = star['radius']
    
    math_angle_deg = 90 - azimuth
    math_angle_rad = math.radians(math_angle_deg)
    
    x = chang_an_x + radius * math.cos(math_angle_rad)
    y = chang_an_y + radius * math.sin(math_angle_rad)
    
    feature = {
        "type": "Feature",
        "properties": {
            "fid": i + 1.0,
            "id": None,
            "星宿名": star['name'],
            "距度": star['distance'],
            "累积赤经": star['cumulative'],
            "四象": star['symbol'],
            "分野州郡": star['state'],
            "方位角": azimuth,
            "半径": radius,
            "X坐标": x,
            "Y坐标": y
        },
        "geometry": {
            "type": "Point",
            "coordinates": [x, y]
        }
    }
    stars_features.append(feature)

stars_geojson = {
    "type": "FeatureCollection",
    "name": "stars",
    "crs": {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    },
    "features": stars_features
}

with open('data/stars.geojson', 'w', encoding='utf-8') as f:
    json.dump(stars_geojson, f, ensure_ascii=False, indent=2)

with open('data/lines.geojson', 'r', encoding='utf-8') as f:
    lines_data = json.load(f)

for feature in lines_data['features']:
    if feature['geometry']['type'] == 'MultiLineString':
        for line_coords in feature['geometry']['coordinates']:
            if len(line_coords) >= 2:
                line_coords[1] = [chang_an_x, chang_an_y]

with open('data/lines.geojson', 'w', encoding='utf-8') as f:
    json.dump(lines_data, f, ensure_ascii=False, indent=2)
