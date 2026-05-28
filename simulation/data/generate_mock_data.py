"""
Generate realistic mock data for Indian MSME B2B marketplace simulation.
1000 sellers (100/category) + 1000 buyers (100/category) for 10K+ negotiations.
Run: python3 simulation/data/generate_mock_data.py
"""
import json
import random
from pathlib import Path

random.seed(42)

# ── Categories & their realistic INR floor price ranges ──────────────────────
# Each entry: (floor_min, floor_max, unit_label, list_markup_min, list_markup_max)
CATEGORY_CONFIG = {
    "software_dev": {
        "floor_range": (800, 3500),         # INR per hour
        "unit": "hour",
        "moq_range": (80, 400),            # hours minimum engagement
        "buyer_qty_range": (100, 2000),     # requested hours
        "payment_pref": ["advance_50", "net_15", "net_30"],
        "dominant_states": ["Karnataka", "Maharashtra", "Telangana", "Delhi"],
        "certifications": ["ISO27001", "SOC2", "CMMI5"],
        "markup": (1.15, 1.35),
        "max_discount": (8, 22),
        "strategy_weights": {"boulware": 35, "tit_for_tat": 30, "hardball": 20, "conceder": 15},
        "delivery_min_range": (5, 14), "delivery_max_range": (15, 45),
    },
    "creative_design": {
        "floor_range": (12000, 75000),      # INR per project
        "unit": "project",
        "moq_range": (1, 3),               # projects minimum size
        "buyer_qty_range": (1, 10),
        "payment_pref": ["advance_50", "net_15", "net_30"],
        "dominant_states": ["Maharashtra", "Delhi", "Karnataka", "West Bengal"],
        "certifications": ["ISO9001", "DesignAwards"],
        "markup": (1.20, 1.40),
        "max_discount": (10, 25),
        "strategy_weights": {"conceder": 40, "tit_for_tat": 30, "boulware": 20, "hardball": 10},
        "delivery_min_range": (7, 21), "delivery_max_range": (20, 60),
    },
    "digital_marketing": {
        "floor_range": (15000, 95000),      # INR per campaign-month
        "unit": "month",
        "moq_range": (3, 6),               # months minimum retainer
        "buyer_qty_range": (3, 12),
        "payment_pref": ["advance_50", "net_15", "net_30"],
        "dominant_states": ["Delhi", "Maharashtra", "Gujarat", "Karnataka"],
        "certifications": ["GooglePartner", "HubSpot", "MetaPartner"],
        "markup": (1.18, 1.38),
        "max_discount": (5, 20),
        "strategy_weights": {"boulware": 35, "tit_for_tat": 35, "conceder": 20, "hardball": 10},
        "delivery_min_range": (5, 10), "delivery_max_range": (10, 20),
    },
    "customer_support": {
        "floor_range": (12000, 32000),      # INR per agent-month
        "unit": "agent-month",
        "moq_range": (3, 15),              # agents minimum team size
        "buyer_qty_range": (5, 50),
        "payment_pref": ["net_30", "net_15", "advance_50"],
        "dominant_states": ["Telangana", "Karnataka", "Tamil Nadu", "Maharashtra"],
        "certifications": ["ISO27001", "SOC2", "PCI-DSS"],
        "markup": (1.12, 1.28),
        "max_discount": (4, 15),
        "strategy_weights": {"boulware": 40, "tit_for_tat": 25, "conceder": 25, "hardball": 10},
        "delivery_min_range": (10, 20), "delivery_max_range": (15, 35),
    },
    "hr_recruitment": {
        "floor_range": (8000, 45000),       # INR per placement hire
        "unit": "hire",
        "moq_range": (2, 10),              # minimum placements
        "buyer_qty_range": (2, 30),
        "payment_pref": ["net_30", "net_15", "net_60"],
        "dominant_states": ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu"],
        "certifications": ["ISO9001", "NASSCOM"],
        "markup": (1.15, 1.35),
        "max_discount": (5, 18),
        "strategy_weights": {"conceder": 35, "tit_for_tat": 30, "boulware": 25, "hardball": 10},
        "delivery_min_range": (7, 14), "delivery_max_range": (15, 30),
    },
    "legal_compliance": {
        "floor_range": (1500, 6000),        # INR per hour
        "unit": "hour",
        "moq_range": (10, 50),             # hours minimum
        "buyer_qty_range": (20, 200),
        "payment_pref": ["advance_50", "net_15", "net_30"],
        "dominant_states": ["Delhi", "Maharashtra", "Karnataka", "West Bengal"],
        "certifications": ["BarCouncil", "CAI", "ISO27001"],
        "markup": (1.15, 1.45),
        "max_discount": (5, 15),
        "strategy_weights": {"boulware": 40, "hardball": 30, "tit_for_tat": 20, "conceder": 10},
        "delivery_min_range": (3, 7), "delivery_max_range": (7, 21),
    },
    "financial_audit": {
        "floor_range": (25000, 180000),     # INR per audit project
        "unit": "audit",
        "moq_range": (1, 2),               # minimum audits
        "buyer_qty_range": (1, 5),
        "payment_pref": ["advance_50", "net_30", "net_15"],
        "dominant_states": ["Maharashtra", "Delhi", "Gujarat", "Karnataka"],
        "certifications": ["ICAI", "ISO9001"],
        "markup": (1.15, 1.35),
        "max_discount": (5, 15),
        "strategy_weights": {"boulware": 35, "tit_for_tat": 35, "conceder": 20, "hardball": 10},
        "delivery_min_range": (10, 20), "delivery_max_range": (20, 45),
    },
    "business_consulting": {
        "floor_range": (45000, 280000),     # INR per milestone
        "unit": "milestone",
        "moq_range": (1, 3),               # minimum milestones
        "buyer_qty_range": (2, 8),
        "payment_pref": ["advance_50", "net_30", "net_15"],
        "dominant_states": ["Maharashtra", "Delhi", "Karnataka", "Telangana"],
        "certifications": ["CMC", "ISO9001"],
        "markup": (1.18, 1.42),
        "max_discount": (5, 18),
        "strategy_weights": {"boulware": 40, "hardball": 25, "tit_for_tat": 25, "conceder": 10},
        "delivery_min_range": (14, 30), "delivery_max_range": (30, 60),
    },
    "logistics_fleet": {
        "floor_range": (3500, 25000),       # INR per freight trip
        "unit": "trip",
        "moq_range": (5, 20),              # minimum trips
        "buyer_qty_range": (10, 100),
        "payment_pref": ["net_30", "net_60", "advance_50"],
        "dominant_states": ["Gujarat", "Maharashtra", "Haryana", "Tamil Nadu"],
        "certifications": ["IATA", "ISO9001"],
        "markup": (1.10, 1.25),
        "max_discount": (4, 15),
        "strategy_weights": {"conceder": 35, "tit_for_tat": 30, "realistic": 25, "boulware": 10},
        "delivery_min_range": (2, 5), "delivery_max_range": (5, 12),
    },
    "corporate_training": {
        "floor_range": (15000, 85000),      # INR per batch workshop
        "unit": "batch",
        "moq_range": (1, 3),               # minimum batches
        "buyer_qty_range": (1, 10),
        "payment_pref": ["net_30", "advance_50", "net_15"],
        "dominant_states": ["Karnataka", "Maharashtra", "Delhi", "Telangana"],
        "certifications": ["ISO9001", "SHRM"],
        "markup": (1.20, 1.45),
        "max_discount": (6, 20),
        "strategy_weights": {"conceder": 40, "tit_for_tat": 30, "boulware": 20, "hardball": 10},
        "delivery_min_range": (7, 14), "delivery_max_range": (14, 30),
    },
}

CATEGORIES = list(CATEGORY_CONFIG.keys())

ALL_STATES = [
    "Maharashtra", "Gujarat", "Tamil Nadu", "Rajasthan", "Punjab",
    "Uttar Pradesh", "West Bengal", "Karnataka", "Telangana", "Haryana",
    "Delhi", "Madhya Pradesh", "Andhra Pradesh", "Bihar", "Odisha",
    "Himachal Pradesh", "Uttarakhand", "Goa", "Kerala", "Assam",
    "Jharkhand", "Chhattisgarh", "Jammu and Kashmir", "Tripura", "Meghalaya",
]

# Realistic B2B Service Provider company name parts
PREFIXES = [
    "Shree", "Balaji", "Om Sai", "Vikas", "Apex", "Vertex", "Sigma", "Omega",
    "United", "Allied", "Supreme", "Elite", "Prime", "Global", "Vision", "Dynamic",
    "Power", "Star", "Sunrise", "Excel", "Triumph", "Fortune", "Heritage", "Classic",
    "Modern", "Future", "Unique", "Quality", "Reliable", "Trusted", "Famous",
    "Infosolutions", "TechCorp", "SmartServices", "ProConsulting", "EnterpriseCare",
    "Innovate", "Aero", "Delta", "Alpha", "Zenith", "Intellect", "Synergy", "Core",
    "Catalyst", "Nexus", "Insight", "Optima", "Quantum", "Matrix", "Kalyan",
]
SUFFIXES = [
    "Solutions", "Systems", "Consultants", "Services", "Technologies",
    "Associates", "Partners", "Group", "Global", "International",
    "Pvt Ltd", "Ltd", "LLP", "Co", "Corp", "Agency", "Advisors",
    "Support", "Outsourcing", "Logistics", "Ventures", "Talent", "Auditors",
]

BUYER_COMPANY_TYPES = [
    "Pvt Ltd", "Ltd", "Industries", "Manufacturers", "Fabricators",
    "Enterprises", "Works", "Corp", "Trading Co",
]

FAMILY_NAMES = [
    "Patel", "Shah", "Mehta", "Gupta", "Sharma", "Singh", "Kumar", "Joshi",
    "Verma", "Rao", "Nair", "Iyer", "Pillai", "Reddy", "Choudhary",
    "Agarwal", "Jain", "Kapoor", "Bose", "Mukherjee", "Das", "Roy",
    "Mishra", "Tiwari", "Pandey", "Yadav", "Sinha", "Trivedi", "Desai",
]

# Regional price variation: metro premium, rural discount
STATE_PRICE_FACTOR = {
    "Delhi": 1.08, "Mumbai": 1.08, "Maharashtra": 1.05, "Gujarat": 1.02,
    "Karnataka": 1.03, "Tamil Nadu": 1.03, "Telangana": 1.02,
    "Punjab": 1.01, "Haryana": 1.01, "Rajasthan": 0.97,
    "Uttar Pradesh": 0.96, "West Bengal": 0.97, "Madhya Pradesh": 0.95,
    "Andhra Pradesh": 0.97, "Bihar": 0.93, "Odisha": 0.92,
    "Himachal Pradesh": 0.95, "Uttarakhand": 0.96, "Goa": 1.04,
    "Kerala": 1.01, "Assam": 0.91, "Jharkhand": 0.93,
    "Chhattisgarh": 0.92, "Jammu and Kashmir": 0.94,
    "Tripura": 0.90, "Meghalaya": 0.91,
}

QUALITY_WEIGHTS = {"A": 20, "B": 55, "C": 25}  # Realistic Indian MSME distribution


def generate_gstin(state_code: int) -> str:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return f"{state_code:02d}{''.join(random.choices(chars, k=10))}1Z{random.randint(0,9)}"


def weighted_choice(weights_dict: dict) -> str:
    items = list(weights_dict.keys())
    weights = list(weights_dict.values())
    return random.choices(items, weights=weights, k=1)[0]


def pick_payment_terms(category_pref: list, n: int = None) -> list:
    """Pick realistic payment terms for a seller in this category."""
    all_terms = ["advance_100", "advance_50", "net_15", "net_30", "net_60"]
    n = n or random.randint(1, 3)
    # Weight toward category preference
    terms = list(set(random.sample(category_pref, k=min(len(category_pref), n - 1) if n > 1 else 0)
                     + random.sample(all_terms, k=1)))
    return terms or [category_pref[0]]


def generate_sellers(n_per_category: int = 100) -> list[dict]:
    sellers = []
    seller_idx = 1
    for cat, cfg in CATEGORY_CONFIG.items():
        for i in range(n_per_category):
            # Weighted state selection (dominant states more likely)
            dominant = cfg["dominant_states"]
            state = random.choices(
                dominant + ALL_STATES,
                weights=[8] * len(dominant) + [1] * len(ALL_STATES),
                k=1
            )[0]
            state_code = (ALL_STATES.index(state) % 30) + 1
            state_factor = STATE_PRICE_FACTOR.get(state, 1.0)

            floor_lo, floor_hi = cfg["floor_range"]
            base_floor = random.uniform(floor_lo, floor_hi) * state_factor
            markup_lo, markup_hi = cfg["markup"]
            list_price = base_floor * random.uniform(markup_lo, markup_hi)

            moq_lo, moq_hi = cfg["moq_range"]
            moq = int(random.uniform(moq_lo, moq_hi))
            # Round MOQ to nice numbers
            if moq > 1000:
                moq = round(moq / 100) * 100
            elif moq > 100:
                moq = round(moq / 25) * 25
            elif moq > 10:
                moq = round(moq / 5) * 5

            max_stock = moq * random.randint(5, 50)
            # 20% of sellers have seasonal low stock
            if random.random() < 0.20:
                current_stock = int(moq * random.uniform(0.3, 1.5))  # near MOQ
            else:
                current_stock = int(random.uniform(moq * 2, max_stock))

            quality_grade = weighted_choice(QUALITY_WEIGHTS)
            cert_pool = cfg["certifications"]
            certs = random.sample(cert_pool, k=random.randint(0, min(2, len(cert_pool))))

            max_disc_lo, max_disc_hi = cfg["max_discount"]
            negotiation_willingness = round(random.uniform(0.3, 1.0), 2)

            delivery_min = random.randint(*cfg["delivery_min_range"])
            delivery_max = random.randint(*cfg["delivery_max_range"])
            if delivery_max <= delivery_min:
                delivery_max = delivery_min + random.randint(5, 15)

            payment_terms = list(set(
                [random.choice(cfg["payment_pref"])]
                + random.sample(["advance_100", "advance_50", "net_15", "net_30", "net_60"],
                                k=random.randint(0, 2))
            ))

            prefix = random.choice(PREFIXES)
            suffix = random.choice(SUFFIXES)
            name = f"{prefix} {suffix}"

            strategy = weighted_choice(cfg["strategy_weights"])

            sellers.append({
                "id": f"S{seller_idx:04d}",
                "name": name,
                "category": cat,
                "location_state": state,
                "gstin": generate_gstin(state_code),
                "is_msme_registered": random.choices([True, False], weights=[85, 15])[0],
                "floor_price_per_unit": round(base_floor, 2),
                "list_price_per_unit": round(list_price, 2),
                "moq": moq,
                "max_order_qty": moq * random.randint(10, 100),
                "quality_grade": quality_grade,
                "quality_certifications": certs,
                "delivery_days_min": delivery_min,
                "delivery_days_max": delivery_max,
                "payment_terms_accepted": payment_terms,
                "negotiation_strategy": strategy,
                "negotiation_willingness": negotiation_willingness,
                "max_discount_pct": round(random.uniform(max_disc_lo, max_disc_hi), 1),
                "current_stock_units": current_stock,
                "rating": round(random.uniform(2.8, 5.0), 1),
                "total_orders_completed": random.randint(5, 800),
                "payment_reliability": round(random.uniform(0.55, 1.0), 2),
                "whatsapp_number": f"+91{random.randint(7000000000, 9999999999)}",
                "tally_ledger_id": f"TL{seller_idx:05d}" if random.random() > 0.35 else None,
                "blacklisted_by": [],
            })
            seller_idx += 1

    random.shuffle(sellers)
    return sellers


def generate_buyers(n_per_category: int = 100) -> list[dict]:
    buyers = []
    buyer_idx = 1
    strategies = ["conceder", "tit_for_tat", "boulware", "realistic", "aspirational"]
    strategy_weights = [25, 30, 20, 15, 10]

    for cat, cfg in CATEGORY_CONFIG.items():
        floor_lo, floor_hi = cfg["floor_range"]
        mid = (floor_lo + floor_hi) / 2
        markup_lo, markup_hi = cfg["markup"]
        avg_list = mid * (markup_lo + markup_hi) / 2  # approximate average list price

        for i in range(n_per_category):
            state = random.choice(ALL_STATES)
            family = random.choice(FAMILY_NAMES)
            company_type = random.choice(BUYER_COMPANY_TYPES)
            buyer_name = f"{family} {random.choice(SUFFIXES[:15])} {company_type}"

            # Buyer's target price: 72-88% of average list price (wants a good deal)
            target_pct = random.uniform(0.72, 0.88)
            target_price = avg_list * target_pct

            # Buyer's max budget: 90-118% of average list price (varied willingness to pay)
            max_pct = random.uniform(0.90, 1.18)
            max_price = avg_list * max_pct

            # Ensure target < max
            if target_price >= max_price:
                target_price = max_price * 0.88

            # Buyer quantity: calibrated to category MOQ range
            qty_lo, qty_hi = cfg["buyer_qty_range"]
            quantity = int(random.uniform(qty_lo, qty_hi))
            # Round to nearest sensible unit
            if quantity > 1000:
                quantity = round(quantity / 100) * 100
            elif quantity > 100:
                quantity = round(quantity / 25) * 25
            elif quantity > 10:
                quantity = round(quantity / 5) * 5

            # Payment preference: from category typical terms
            pay_pref = random.choice(cfg["payment_pref"])

            # Delivery deadline
            delivery = random.choice([14, 21, 30, 45, 60])

            # Quality minimum: mostly B, some A, few C
            quality_min = weighted_choice({"A": 15, "B": 60, "C": 25})

            # Negotiation strategy
            strategy = random.choices(strategies, weights=strategy_weights, k=1)[0]

            # Urgency level (affects payment tolerance)
            urgency = random.choices(
                ["low", "normal", "high", "urgent"],
                weights=[15, 50, 25, 10], k=1
            )[0]

            # Budget for MOQ premium (how much extra buyer pays to waive MOQ)
            max_moq_premium_pct = random.uniform(2.0, 10.0)

            buyers.append({
                "id": f"B{buyer_idx:04d}",
                "name": buyer_name,
                "location_state": state,
                "required_category": cat,
                "quantity_units": quantity,
                "target_price_per_unit": round(target_price, 2),
                "max_price_per_unit": round(max_price, 2),
                "quality_min": quality_min,
                "delivery_deadline_days": delivery,
                "payment_preference": pay_pref,
                "required_certifications": [],
                "blacklisted_sellers": [],
                "max_sellers_to_query": 100,
                "negotiation_rounds_budget": 10,
                "negotiation_strategy": strategy,
                "urgency_level": urgency,
                "allow_moq_waiver": True,
                "allow_partial_fulfillment": True,
                "max_moq_premium_pct": round(max_moq_premium_pct, 1),
            })
            buyer_idx += 1

    random.shuffle(buyers)
    return buyers


if __name__ == "__main__":
    import sys
    n_sellers = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    n_buyers = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    out_dir = Path(__file__).parent

    print(f"Generating {n_sellers * len(CATEGORIES)} sellers ({n_sellers}/category)...")
    sellers = generate_sellers(n_per_category=n_sellers)

    print(f"Generating {n_buyers * len(CATEGORIES)} buyers ({n_buyers}/category)...")
    buyers = generate_buyers(n_per_category=n_buyers)

    with open(out_dir / "mock_sellers.json", "w", encoding="utf-8") as f:
        json.dump(sellers, f, indent=2, ensure_ascii=False)
    with open(out_dir / "mock_buyers.json", "w", encoding="utf-8") as f:
        json.dump(buyers, f, indent=2, ensure_ascii=False)

    # Print summary
    from collections import Counter
    cat_counts = Counter(s["category"] for s in sellers)
    strategy_counts = Counter(s["negotiation_strategy"] for s in sellers)
    quality_counts = Counter(s["quality_grade"] for s in sellers)

    print(f"\nGenerated {len(sellers)} sellers + {len(buyers)} buyers")
    print(f"Categories: {dict(cat_counts)}")
    print(f"Strategies: {dict(strategy_counts)}")
    print(f"Quality: {dict(quality_counts)}")
    print(f"Saved to {out_dir}/")
    print(f"\nSample seller: {sellers[0]['name']} | {sellers[0]['category']} | "
          f"Floor: Rs.{sellers[0]['floor_price_per_unit']:.2f} | MOQ: {sellers[0]['moq']}")
    print(f"Sample buyer: {buyers[0]['name']} | {buyers[0]['required_category']} | "
          f"Max: Rs.{buyers[0]['max_price_per_unit']:.2f} | Qty: {buyers[0]['quantity_units']}")
