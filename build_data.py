# -*- coding: utf-8 -*-
"""生成 dashboard/data.json（单一数据文件，字段名固定）。
用法：python build_data.py
以后更新数据：改此脚本内嵌的 holdings/stockCostRef/priceHistory/brokerYearly/account/insurance，
或直接覆盖 fund_nav.json / trades.json / advice.json 后重跑本脚本。"""
import json, io, os

BASE = r'C:\Users\EDY\AccioWork\2026-08-26-12-36-20-398-545eb39f\工作区\Finance管理_投资账本台\dashboard'

def load(name):
    with io.open(os.path.join(BASE, name), encoding='utf-8') as f:
        return json.load(f)

# ---------- 持仓快照（名称/代码/类别/数量/成本/现值/浮盈/盈率/当日/累计/近1月/近6月/占比） ----------
holdings = [
    {"name":"工银瑞信新兴制造A","code":"009707","type":"基金","quantity":48000,  "cost":300000.00,"value":231076.80,"gain":-68923.20,"gainRate":-22.97,"dayGain":0,    "cumGain":203265.83,"m1":-8.88,"m6":43.56,"ratio":24.6},
    {"name":"股票账户现金",      "code":"-",    "type":"现金","quantity":None,   "cost":139173.59,"value":139173.59,"gain":0,       "gainRate":0,     "dayGain":0,    "cumGain":0,       "m1":None, "m6":None, "ratio":15.2},
    {"name":"洛阳钼业",          "code":"603993","type":"股票","quantity":6800,   "cost":130587.49,"value":132668.00,"gain":2080.51,  "gainRate":1.59,  "dayGain":-544.00,"cumGain":19403.51,"m1":2.96, "m6":-18.30,"ratio":14.1},
    {"name":"紫金矿业",          "code":"601899","type":"股票","quantity":2000,   "cost":60003.75, "value":69140.00, "gain":9136.25,  "gainRate":15.23, "dayGain":200.00, "cumGain":15838.21,"m1":12.83,"m6":-16.46,"ratio":7.4},
    {"name":"金鹰核心资源",      "code":"210009","type":"基金","quantity":34870.20,"cost":100000.00,"value":76763.26, "gain":-23236.74,"gainRate":-23.24,"dayGain":0,    "cumGain":3359.71, "m1":3.86, "m6":-20.79,"ratio":8.2},
    {"name":"中国稀土",          "code":"000831","type":"股票","quantity":1200,   "cost":64270.50, "value":72972.00, "gain":8701.50,  "gainRate":13.54, "dayGain":5736.00,"cumGain":8869.50, "m1":31.87,"m6":5.50, "ratio":7.8},
    {"name":"景顺策略精选",      "code":"000242","type":"基金","quantity":12000,  "cost":40000.00, "value":50220.00, "gain":10220.00, "gainRate":25.55, "dayGain":0,    "cumGain":16734.27,"m1":2.99, "m6":8.69, "ratio":5.3},
    {"name":"建信新兴市场",      "code":"539002","type":"基金","quantity":18752.90,"cost":29000.00, "value":43788.02, "gain":14788.02, "gainRate":50.99, "dayGain":0,    "cumGain":15215.24,"m1":-1.35,"m6":44.30,"ratio":4.6},
    {"name":"南大光电",          "code":"300346","type":"股票","quantity":1000,   "cost":54157.00, "value":56610.00, "gain":2453.00,  "gainRate":4.53,  "dayGain":2140.00,"cumGain":46406.45,"m1":-11.97,"m6":5.65,"ratio":6.0},
    {"name":"兴业银锡",          "code":"000426","type":"股票","quantity":1200,   "cost":47880.00, "value":48828.00, "gain":948.00,   "gainRate":1.98,  "dayGain":540.00, "cumGain":0,      "m1":None, "m6":None, "ratio":5.2},
    {"name":"中国铝业",          "code":"601600","type":"股票","quantity":1600,   "cost":16169.60, "value":15440.00, "gain":-729.60,  "gainRate":-4.51, "dayGain":96.00,  "cumGain":-1589.16,"m1":4.87, "m6":-27.71,"ratio":1.6},
]

totalCost = round(sum(h["cost"] for h in holdings), 2)
totalValue = round(sum(h["value"] for h in holdings), 2)
totalGain = round(totalValue - totalCost, 2)
totalRate = round(totalGain / totalCost * 100, 2) if totalCost else 0
realizedGain = 6361.96
totalCombined = round(totalGain + realizedGain, 2)
combinedRate = round(totalCombined / totalCost * 100, 2) if totalCost else 0

account = {
    "name": "A股证券账户",
    "openDate": "2017-04-11",
    "endAsset": 576757.53,
    "netInflow": 477920.90,
    "accountGain": 98834.28,
    "period": "2017-04-11 至 2026-08-14",
}

brokerYearly = {
    "2017": -9.59, "2018": 2.10, "2019": 2.11, "2020": 2.12, "2021": -14491.63,
    "2022": -4504.75, "2023": -3594.63, "2024": 3920.82, "2025": 62395.17, "2026": 42112.56,
}

stockCostRef = [
    {"name":"洛阳钼业","code":"603993","qty":6800,"costPrice":19.2040,"breakeven":16.99,  "breakevenNote":"未含税费","last":19.51},
    {"name":"紫金矿业","code":"601899","qty":2000,"costPrice":30.0019,"breakeven":25.7720,"breakevenNote":"未含税费·净分红","last":34.57},
    {"name":"中国稀土","code":"000831","qty":1200,"costPrice":53.5588,"breakeven":None,   "breakevenNote":"流水缺失","last":60.81},
    {"name":"南大光电","code":"300346","qty":1000,"costPrice":54.1570,"breakeven":54.14,  "breakevenNote":"未含税费·8/5前流水缺失","last":56.61},
    {"name":"兴业银锡","code":"000426","qty":1200,"costPrice":39.9000,"breakeven":None,   "breakevenNote":"流水缺失·8/25新建仓","last":40.69},
    {"name":"中国铝业","code":"601600","qty":1600,"costPrice":10.1060,"breakeven":None,   "breakevenNote":"流水缺失","last":9.65},
]

# 股票行情历史（open/close/high/low）
priceHistory = [
    {"date":"2026-08-14","rows":{"603993":{"open":18.21,"close":18.44,"high":18.54,"low":18.16},"601899":{"open":31.80,"close":32.53,"high":32.66,"low":31.75},"000831":{"open":55.80,"close":60.95,"high":60.95,"low":55.73},"300346":{"open":58.63,"close":58.71,"high":59.18,"low":57.53},"601600":{"open":9.11,"close":9.26,"high":9.29,"low":9.09}}},
    {"date":"2026-08-17","rows":{"603993":{"open":18.80,"close":19.13,"high":19.14,"low":18.72},"601899":{"open":33.33,"close":33.36,"high":33.65,"low":33.01},"000831":{"open":60.03,"close":62.79,"high":62.89,"low":59.89},"300346":{"open":58.80,"close":61.20,"high":61.26,"low":58.51},"601600":{"open":9.35,"close":9.54,"high":9.56,"low":9.25}}},
    {"date":"2026-08-18","rows":{"603993":{"open":18.80,"close":18.82,"high":19.08,"low":18.60},"601899":{"open":33.36,"close":33.56,"high":33.58,"low":32.87},"000831":{"open":62.80,"close":62.49,"high":63.20,"low":61.48},"300346":{"open":61.20,"close":61.87,"high":62.61,"low":60.45},"601600":{"open":9.44,"close":9.45,"high":9.56,"low":9.37}}},
    {"date":"2026-08-19","rows":{"603993":{"open":18.30,"close":18.00,"high":18.33,"low":17.91},"601899":{"open":32.50,"close":32.76,"high":33.28,"low":32.35},"000831":{"open":61.00,"close":59.54,"high":61.58,"low":59.33},"300346":{"open":59.06,"close":58.26,"high":61.95,"low":57.70},"601600":{"open":9.27,"close":9.35,"high":9.41,"low":9.22}}},
    {"date":"2026-08-20","rows":{"603993":{"open":18.48,"close":18.27,"high":18.95,"low":18.13},"601899":{"open":34.00,"close":34.25,"high":35.08,"low":33.87},"000831":{"open":60.80,"close":57.95,"high":60.88,"low":57.55},"300346":{"open":58.98,"close":57.03,"high":59.25,"low":56.29},"601600":{"open":9.42,"close":9.17,"high":9.67,"low":9.12}}},
    {"date":"2026-08-21","rows":{"603993":{"open":18.39,"close":18.62,"high":18.73,"low":18.19},"601899":{"open":34.25,"close":34.74,"high":34.87,"low":33.60},"000831":{"open":55.29,"close":56.33,"high":56.75,"low":55.10},"300346":{"open":56.67,"close":56.85,"high":57.98,"low":55.90},"601600":{"open":9.12,"close":9.42,"high":9.42,"low":9.11}}},
    {"date":"2026-08-24","rows":{"603993":{"open":19.00,"close":18.99,"high":19.35,"low":18.72},"601899":{"open":35.40,"close":34.54,"high":35.47,"low":34.16},"000831":{"open":57.20,"close":58.22,"high":59.50,"low":56.70},"300346":{"open":56.80,"close":56.02,"high":56.86,"low":54.50},"601600":{"open":9.50,"close":9.50,"high":9.55,"low":9.36}}},
    {"date":"2026-08-25","rows":{"603993":{"open":18.80,"close":18.42,"high":18.94,"low":18.18},"601899":{"open":34.70,"close":33.68,"high":34.70,"low":33.40},"000831":{"open":58.22,"close":57.83,"high":59.85,"low":57.13},"300346":{"open":55.34,"close":54.95,"high":55.69,"low":52.79},"601600":{"open":9.42,"close":9.37,"high":9.48,"low":9.22},"000426":{"open":40.21,"close":39.50,"high":41.77,"low":38.79}}},
    {"date":"2026-08-26","rows":{"603993":{"open":18.56,"close":19.59,"high":19.99,"low":18.56},"601899":{"open":33.70,"close":34.47,"high":35.35,"low":33.70},"000831":{"open":57.98,"close":56.03,"high":58.62,"low":54.66},"300346":{"open":55.00,"close":54.47,"high":55.54,"low":54.00},"601600":{"open":9.38,"close":9.59,"high":9.68,"low":9.33},"000426":{"open":40.21,"close":40.24,"high":41.77,"low":39.55}}},
    {"date":"2026-08-27","rows":{"603993":{"open":19.23,"close":19.51,"high":19.63,"low":19.15},"601899":{"open":33.80,"close":34.57,"high":34.86,"low":33.79},"000831":{"open":55.98,"close":60.81,"high":60.88,"low":55.70},"300346":{"open":54.89,"close":56.61,"high":56.78,"low":54.15},"601600":{"open":9.55,"close":9.65,"high":9.65,"low":9.51},"000426":{"open":40.56,"close":40.69,"high":41.85,"low":40.03}}},
]

stockNames = {"603993":"洛阳钼业","601899":"紫金矿业","000831":"中国稀土","300346":"南大光电","601600":"中国铝业","000426":"兴业银锡"}
stockCodes = ["603993","601899","000831","300346","601600","000426"]

insurance = {
    "count": 1, "coverage": 500000, "annualPremium": 107800,
    "premiumRatio": 21.56, "type": "年金险", "company": "友邦人寿", "status": "有效",
}

# 从外部文件读取（后续更新直接覆盖这三个 json 再重跑）
fundNav = load("fund_nav.json")
trades = load("trades.json").get("trades", [])
advice = load("advice.json").get("advice", [])

data = {
    "meta": {
        "updated": "2026-08-31",
        "asOf": "2026-08-27 收盘快照 + 8/31 现金修正",
        "market": "A股 · 已收盘",
    },
    "summary": {
        "totalCost": totalCost, "totalValue": totalValue, "totalGain": totalGain,
        "totalRate": totalRate, "realizedGain": realizedGain,
        "totalCombined": totalCombined, "combinedRate": combinedRate,
        "holdingsCount": len(holdings),
    },
    "holdings": holdings,
    "account": account,
    "brokerYearly": brokerYearly,
    "stockCostRef": stockCostRef,
    "stockNames": stockNames,
    "stockCodes": stockCodes,
    "priceHistory": priceHistory,
    "fundNav": fundNav,
    "trades": trades,
    "advice": advice,
    "insurance": insurance,
}

out = os.path.join(BASE, "data.json")
with io.open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("data.json written,", len(json.dumps(data, ensure_ascii=False)), "chars")
print("totalValue =", totalValue, "totalGain =", totalGain, "holdings =", len(holdings))
