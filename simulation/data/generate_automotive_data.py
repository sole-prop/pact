"""
Generate realistic mock data for the Indian Automotive MSME B2B marketplace.

10 automotive sub-categories × 100 sellers each = 1000 sellers.
Reflects real Indian auto-ancillary industry (Pune, Chennai, Gurgaon clusters).

Run: python3 simulation/data/generate_automotive_data.py
"""
import json
import random
from pathlib import Path

random.seed(99)

# ── Enterprise Services Outsourcing Categories ─────────────────────────────────

AUTOMOTIVE_CATEGORIES = [
    "custom_software",
    "it_infrastructure",
    "data_analytics",
    "bpo_customer_care",
    "technical_support",
    "digital_product_design",
    "backoffice_ops",
    "qa_testing",
    "cybersecurity",
    "hr_payroll",
]

AUTOMOTIVE_CATEGORY_CONFIG = {
    "custom_software": {
        "floor_range": (1200, 4800),        # INR per hour
        "unit": "hour",
        "moq_range": (150, 600),
        "buyer_qty_range": (100, 3000),
        "payment_pref": ["advance_50", "net_15", "net_30"],
        "dominant_states": ["Karnataka", "Maharashtra", "Telangana", "Delhi"],
        "certifications": ["CMMI5", "ISO27001", "SOC2"],
        "markup": (1.20, 1.45),
        "max_discount": (5, 18),
        "strategy_weights": {"boulware": 40, "hardball": 25, "tit_for_tat": 25, "conceder": 10},
        "delivery_min_range": (10, 20), "delivery_max_range": (20, 45),
        "names": [
            "TechMahindra Enterprise", "Wipro Solutions", "Infosys Engineering",
            "Cognizant Systems", "TCS Global", "Mindtree Solutions",
            "L&T Infotech", "HCL Services", "Tata Elxsi",
            "Mphasis Developers", "Persistent Systems", "Cybage Software",
            "Zensar Technologies", "KPIT Technologies", "GlobalLogic India",
        ],
    },
    "it_infrastructure": {
        "floor_range": (25000, 150000),     # INR per node-month
        "unit": "month",
        "moq_range": (3, 12),
        "buyer_qty_range": (3, 24),
        "payment_pref": ["net_30", "net_15", "advance_50", "net_60"],
        "dominant_states": ["Maharashtra", "Karnataka", "Telangana", "Delhi"],
        "certifications": ["ISO27001", "SOC2", "AWS-Certified"],
        "markup": (1.18, 1.40),
        "max_discount": (6, 20),
        "strategy_weights": {"tit_for_tat": 35, "boulware": 30, "conceder": 25, "hardball": 10},
        "delivery_min_range": (5, 12), "delivery_max_range": (10, 25),
        "names": [
            "Netmagic Datacenters", "CtrlS Servers", "WebWerks Hosting",
            "Sify Technologies", "Tata Communications", "Reliance IDC",
            "Nxtra Data", "E2E Networks", "GPX Global",
        ],
    },
    "data_analytics": {
        "floor_range": (1500, 5500),        # INR per hour
        "unit": "hour",
        "moq_range": (80, 300),
        "buyer_qty_range": (100, 1500),
        "payment_pref": ["net_30", "advance_50", "net_60", "net_15"],
        "dominant_states": ["Karnataka", "Telangana", "Maharashtra", "Delhi"],
        "certifications": ["ISO27001", "SOC2", "Microsoft-BI"],
        "markup": (1.15, 1.38),
        "max_discount": (5, 18),
        "strategy_weights": {"boulware": 35, "conceder": 30, "tit_for_tat": 25, "hardball": 10},
        "delivery_min_range": (7, 14), "delivery_max_range": (15, 30),
        "names": [
            "Mu Sigma Analytics", "Fractal Analytics", "LatentView Sciences",
            "Absolutdata Insights", "Tiger Analytics", "Gramener Solutions",
            "Bridgei2i Intelligence", "Manthan Systems", "Datalink India",
        ],
    },
    "bpo_customer_care": {
        "floor_range": (15000, 35000),      # INR per agent-month
        "unit": "agent-month",
        "moq_range": (10, 50),
        "buyer_qty_range": (10, 200),
        "payment_pref": ["advance_50", "net_30", "net_15", "net_60"],
        "dominant_states": ["Karnataka", "Telangana", "Maharashtra", "Tamil Nadu"],
        "certifications": ["ISO27001", "PCI-DSS", "COPC"],
        "markup": (1.22, 1.50),
        "max_discount": (4, 16),
        "strategy_weights": {"hardball": 35, "boulware": 35, "tit_for_tat": 20, "conceder": 10},
        "delivery_min_range": (15, 30), "delivery_max_range": (30, 60),
        "names": [
            "Genpact India", "Teleperformance India", "WNS Global",
            "Exl Service", "Firstsource Solutions", "Conduent BPO",
            "Hinduja Global Solutions", "Tech Mahindra BPS", "Startek India",
        ],
    },
    "technical_support": {
        "floor_range": (18000, 45000),      # INR per resource-month
        "unit": "resource-month",
        "moq_range": (5, 20),
        "buyer_qty_range": (5, 100),
        "payment_pref": ["advance_50", "net_30", "net_15", "net_60"],
        "dominant_states": ["Karnataka", "Telangana", "Maharashtra", "Delhi"],
        "certifications": ["ISO27001", "SOC2", "ITIL"],
        "markup": (1.15, 1.35),
        "max_discount": (4, 14),
        "strategy_weights": {"boulware": 40, "tit_for_tat": 30, "aspirational": 20, "conceder": 10},
        "delivery_min_range": (10, 20), "delivery_max_range": (20, 45),
        "names": [
            "CSS Corp", "Sutherland Global", "Concentrix Services",
            "Quess Corp Support", "TeamLease IT", "Adecco Support",
            "Collabera Solutions", "Dynamic IT Support", "Alpha Technicians",
        ],
    },
    "digital_product_design": {
        "floor_range": (35000, 250000),     # INR per project-milestone
        "unit": "milestone",
        "moq_range": (2, 5),
        "buyer_qty_range": (2, 15),
        "payment_pref": ["net_30", "net_60", "advance_50", "net_15"],
        "dominant_states": ["Maharashtra", "Karnataka", "Delhi", "Telangana"],
        "certifications": ["ISO9001", "UX-Certified"],
        "markup": (1.16, 1.38),
        "max_discount": (5, 19),
        "strategy_weights": {"conceder": 35, "tit_for_tat": 30, "realistic": 25, "boulware": 10},
        "delivery_min_range": (15, 30), "delivery_max_range": (30, 75),
        "names": [
            "Fractal Ink Design", "Lollypop UX Studio", "Funjam UX",
            "Studio ABD", "Elephant Design", "Yellow Slice UX",
            "Prototyze Design", "NextUX Studio", "Epic Design Labs",
        ],
    },
    "backoffice_ops": {
        "floor_range": (10000, 22000),      # INR per processor-month
        "unit": "processor-month",
        "moq_range": (10, 100),
        "buyer_qty_range": (10, 500),
        "payment_pref": ["advance_50", "net_15", "net_30", "net_60"],
        "dominant_states": ["Karnataka", "Maharashtra", "Tamil Nadu", "Telangana"],
        "certifications": ["ISO9001", "ISO27001"],
        "markup": (1.18, 1.42),
        "max_discount": (5, 17),
        "strategy_weights": {"boulware": 35, "hardball": 30, "tit_for_tat": 25, "conceder": 10},
        "delivery_min_range": (10, 20), "delivery_max_range": (15, 35),
        "names": [
            "EXL Services Backoffice", "WNS Backoffice", "Genpact Ops",
            "Aditya Birla Minacs", "Quess Backoffice", "Intelenet Global",
            "Teamlease Backoffice", "Karvy Data Management", "Vakrangee Ops",
        ],
    },
    "qa_testing": {
        "floor_range": (1000, 3000),        # INR per hour
        "unit": "hour",
        "moq_range": (100, 400),
        "buyer_qty_range": (100, 2000),
        "payment_pref": ["net_30", "advance_50", "net_15", "net_60"],
        "dominant_states": ["Karnataka", "Telangana", "Maharashtra", "Delhi"],
        "certifications": ["ISO27001", "SOC2", "ISTQB"],
        "markup": (1.18, 1.40),
        "max_discount": (5, 17),
        "strategy_weights": {"boulware": 35, "tit_for_tat": 30, "realistic": 25, "hardball": 10},
        "delivery_min_range": (7, 14), "delivery_max_range": (14, 35),
        "names": [
            "Qualitest India", "Cigniti Technologies", "TestingXperts",
            "Applabs India", "Mindfire Solutions", "Maveric Systems",
            "QA InfoTech", "Test Yantra", "Vara QA Services",
        ],
    },
    "cybersecurity": {
        "floor_range": (50000, 350000),     # INR per audit assignment
        "unit": "assignment",
        "moq_range": (1, 3),
        "buyer_qty_range": (1, 10),
        "payment_pref": ["net_30", "net_60", "advance_50", "net_15"],
        "dominant_states": ["Delhi", "Maharashtra", "Karnataka", "Telangana"],
        "certifications": ["ISO27001", "SOC2", "CREST", "CEH"],
        "markup": (1.14, 1.36),
        "max_discount": (5, 18),
        "strategy_weights": {"conceder": 35, "tit_for_tat": 30, "realistic": 25, "boulware": 10},
        "delivery_min_range": (14, 30), "delivery_max_range": (30, 90),
        "names": [
            "Quick Heal Enterprise", "K7 Security Labs", "SISA Information Security",
            "WeSecureApp", "HackerOne India", "TAC Security",
            "Lucideus Tech", "Sectona Security", "Seqrite Services",
        ],
    },
    "hr_payroll": {
        "floor_range": (15000, 65000),      # INR per month service fee
        "unit": "month",
        "moq_range": (3, 12),
        "buyer_qty_range": (3, 24),
        "payment_pref": ["advance_50", "net_30", "net_15", "advance_100"],
        "dominant_states": ["Maharashtra", "Karnataka", "Delhi", "Telangana"],
        "certifications": ["ISO27001", "SOC2", "SHRM-Partner"],
        "markup": (1.18, 1.42),
        "max_discount": (4, 16),
        "strategy_weights": {"hardball": 30, "boulware": 35, "tit_for_tat": 25, "conceder": 10},
        "delivery_min_range": (10, 20), "delivery_max_range": (15, 30),
        "names": [
            "ADP India Payroll", "Paysquare Consultancy", "Greytip Software",
            "Mercer HR India", "Aon Hewitt India", "TopSource Global",
            "Ascent HR", "ProHR Solutions", "Zeta Benefits",
        ],
    },
}

ALL_STATES = [
    "Andhra Pradesh", "Gujarat", "Haryana", "Karnataka", "Maharashtra",
    "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh",
    "West Bengal", "Madhya Pradesh", "Bihar", "Odisha", "Kerala",
]

QUALITY_GRADES = ["A", "B", "C"]
QUALITY_WEIGHTS = [25, 55, 20]  # Automotive: more A-grade than generic


def _rand_gstin(state_code: str) -> str:
    import string
    pan_letters = random.choices(string.ascii_uppercase, k=5)
    pan_digits = random.choices(string.digits, k=4)
    pan_entity = random.choice(string.ascii_uppercase)
    pan = "".join(pan_letters) + "".join(pan_digits) + pan_entity
    z = "Z"
    check = random.choice(string.digits + string.ascii_uppercase[:6])
    return f"{state_code}{pan}{z}{check}"


STATE_CODE_MAP = {
    "Andhra Pradesh": "37", "Gujarat": "24", "Haryana": "06",
    "Karnataka": "29", "Maharashtra": "27", "Punjab": "03",
    "Rajasthan": "08", "Tamil Nadu": "33", "Telangana": "36",
    "Uttar Pradesh": "09", "West Bengal": "19", "Madhya Pradesh": "23",
    "Bihar": "10", "Odisha": "21", "Kerala": "32",
}


def generate_automotive_sellers(n_per_category: int = 100) -> list[dict]:
    """
    Generate n_per_category sellers for each automotive category.
    Returns list of seller dicts compatible with SellerAgent.from_dict().
    """
    sellers = []
    seller_idx = 1

    strategies = ["boulware", "conceder", "tit_for_tat", "hardball", "aspirational", "realistic"]

    for cat in AUTOMOTIVE_CATEGORIES:
        cfg = AUTOMOTIVE_CATEGORY_CONFIG[cat]
        fl, fh = cfg["floor_range"]
        ml, mh = cfg["markup"]
        moq_l, moq_h = cfg["moq_range"]
        strat_weights = cfg["strategy_weights"]

        name_pool = cfg["names"] * ((n_per_category // len(cfg["names"])) + 2)
        random.shuffle(name_pool)

        strat_list = list(strat_weights.keys())
        strat_w = [strat_weights[s] for s in strat_list]

        for i in range(n_per_category):
            floor_price = round(random.uniform(fl, fh), 2)
            markup = random.uniform(ml, mh)
            list_price = round(floor_price * markup, 2)

            moq = random.randint(moq_l, moq_h)
            max_qty = moq * random.randint(8, 30)

            state = random.choice(cfg["dominant_states"] + ALL_STATES[:5])
            state_code = STATE_CODE_MAP.get(state, "27")
            gstin = _rand_gstin(state_code)

            delivery_min = random.randint(*cfg["delivery_min_range"])
            delivery_max = random.randint(*cfg["delivery_max_range"])
            if delivery_max <= delivery_min:
                delivery_max = delivery_min + random.randint(5, 15)

            strat = random.choices(strat_list, weights=strat_w, k=1)[0]
            quality = random.choices(QUALITY_GRADES, weights=QUALITY_WEIGHTS, k=1)[0]

            # Base certs from config, with some sellers having extra
            base_certs = list(cfg["certifications"])
            certs = random.sample(base_certs, k=min(len(base_certs), random.randint(1, 3)))

            payment_terms = random.sample(
                ["advance_100", "advance_50", "net_15", "net_30", "net_60"],
                k=random.randint(2, 4)
            )
            # Always include the category-preferred term
            if cfg["payment_pref"][0] not in payment_terms:
                payment_terms.insert(0, cfg["payment_pref"][0])

            # Realistic stock for automotive (smaller batches, high value)
            stock = random.randint(moq * 2, moq * 20)

            # Company name: use pool or generate variant
            base_name = name_pool[i % len(name_pool)]
            suffix = random.choice(["", " Pvt Ltd", " India", " Works", " Co", " Enterprises"])
            name = f"{base_name}{suffix}" if not base_name.endswith(("India", "Ltd", "Works")) else base_name

            seller = {
                "id": f"AS{seller_idx:04d}",          # AS = Automotive Seller
                "name": name,
                "category": cat,
                "location_state": state,
                "gstin": gstin,
                "is_msme_registered": random.random() < 0.88,
                "floor_price_per_unit": floor_price,
                "list_price_per_unit": list_price,
                "moq": moq,
                "max_order_qty": max_qty,
                "quality_grade": quality,
                "quality_certifications": certs,
                "delivery_days_min": delivery_min,
                "delivery_days_max": delivery_max,
                "payment_terms_accepted": payment_terms,
                "negotiation_strategy": strat,
                "max_discount_pct": round(random.uniform(*cfg["max_discount"]), 1),
                "current_stock_units": stock,
                "rating": round(random.uniform(3.2, 4.95), 1),
                "total_orders_completed": random.randint(20, 3500),
                "whatsapp_number": f"+91{random.randint(7000000000, 9999999999)}",
                "tally_ledger_id": f"TL-AUTO-{seller_idx:05d}" if random.random() < 0.55 else None,
                "negotiation_willingness": round(random.uniform(0.40, 0.95), 2),
                "payment_reliability": round(random.uniform(0.70, 0.98), 2),
            }
            sellers.append(seller)
            seller_idx += 1

    random.shuffle(sellers)
    return sellers


def generate_automotive_buyers(n_per_category: int = 20) -> list[dict]:
    """
    Generate n_per_category buyers for each automotive category.
    Returns list of buyer dicts compatible with BuyerRequirements.from_dict().
    """
    buyers = []
    buyer_idx = 1

    for cat in AUTOMOTIVE_CATEGORIES:
        cfg = AUTOMOTIVE_CATEGORY_CONFIG[cat]
        fl, fh = cfg["floor_range"]
        ml, mh = cfg["markup"]
        avg_list = (fl + fh) / 2 * (ml + mh) / 2
        ql, qh = cfg["buyer_qty_range"]

        profiles = {
            "oem_tier1":    {"tp_mult": (0.72, 0.82), "mp_mult": (0.88, 0.98), "quality": "A", "w": 25},
            "tier2_assembler": {"tp_mult": (0.78, 0.88), "mp_mult": (0.95, 1.08), "quality": "B", "w": 35},
            "aftermarket":  {"tp_mult": (0.65, 0.76), "mp_mult": (0.82, 0.95), "quality": "B", "w": 25},
            "fleet_buyer":  {"tp_mult": (0.85, 0.96), "mp_mult": (1.02, 1.18), "quality": "A", "w": 15},
        }
        profile_keys = list(profiles.keys())
        profile_weights = [profiles[k]["w"] for k in profile_keys]

        for _ in range(n_per_category):
            profile_key = random.choices(profile_keys, weights=profile_weights, k=1)[0]
            profile = profiles[profile_key]

            tp = round(avg_list * random.uniform(*profile["tp_mult"]), 2)
            mp = round(avg_list * random.uniform(*profile["mp_mult"]), 2)
            if tp >= mp:
                tp = round(mp * 0.87, 2)

            qty = int(random.uniform(ql, qh))
            if qty > 200:
                qty = round(qty / 50) * 50
            elif qty > 50:
                qty = round(qty / 10) * 10
            elif qty > 10:
                qty = round(qty / 5) * 5

            buyer = {
                "id": f"AB{buyer_idx:05d}",           # AB = Automotive Buyer
                "name": f"{profile_key.replace('_', ' ').title()}-{cat[:6]}-{buyer_idx}",
                "location_state": random.choice(ALL_STATES),
                "required_category": cat,
                "quantity_units": max(qty, 5),
                "target_price_per_unit": tp,
                "max_price_per_unit": mp,
                "quality_min": profile["quality"],
                "delivery_deadline_days": random.choice([14, 21, 30, 45, 60]),
                "payment_preference": random.choice(cfg["payment_pref"]),
                "required_certifications": random.sample(
                    cfg["certifications"], k=random.randint(0, 1)
                ),
                "blacklisted_sellers": [],
                "max_sellers_to_query": 100,
                "negotiation_rounds_budget": 10,
                "negotiation_strategy": random.choices(
                    ["conceder", "tit_for_tat", "boulware", "realistic", "aspirational"],
                    weights=[25, 30, 20, 15, 10], k=1
                )[0],
                "urgency_level": random.choices(
                    ["low", "normal", "high", "urgent"],
                    weights=[15, 50, 25, 10], k=1
                )[0],
                "allow_moq_waiver": True,
                "allow_partial_fulfillment": True,
                "max_moq_premium_pct": round(random.uniform(3.0, 10.0), 1),
            }
            buyers.append(buyer)
            buyer_idx += 1

    random.shuffle(buyers)
    return buyers


if __name__ == "__main__":
    out_dir = Path(__file__).parent
    out_dir.mkdir(parents=True, exist_ok=True)

    print("Generating automotive sellers (1000 sellers, 100/category)...")
    sellers = generate_automotive_sellers(100)
    sellers_path = out_dir / "automotive_sellers.json"
    with open(sellers_path, "w", encoding="utf-8") as f:
        json.dump(sellers, f, indent=2, ensure_ascii=False)
    print(f"  Written: {sellers_path} ({len(sellers)} sellers)")

    print("Generating automotive buyers (200 buyers, 20/category)...")
    buyers = generate_automotive_buyers(20)
    buyers_path = out_dir / "automotive_buyers.json"
    with open(buyers_path, "w", encoding="utf-8") as f:
        json.dump(buyers, f, indent=2, ensure_ascii=False)
    print(f"  Written: {buyers_path} ({len(buyers)} buyers)")

    print("\nCategory distribution:")
    from collections import Counter
    cat_counts = Counter(s["category"] for s in sellers)
    for cat, n in sorted(cat_counts.items()):
        avg_floor = sum(s["floor_price_per_unit"] for s in sellers if s["category"] == cat) / n
        print(f"  {cat:25s}: {n:3d} sellers | avg floor Rs.{avg_floor:,.0f}/unit")

    print("\nDone. Use these files with automotive_stress_test.py")
