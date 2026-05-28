"""
Excel Importer: Reads seller constraints from a Tally-exported or
manually created Excel/CSV file and converts to SellerAgent-compatible dicts.

Expected columns (case-insensitive):
  seller_id, name, category, location_state, gstin, floor_price, list_price,
  moq, max_qty, quality_grade, delivery_min, delivery_max,
  payment_terms (semicolon-separated), strategy, stock, whatsapp, tally_ledger_id
"""
import json
from pathlib import Path
from typing import Union

import pandas as pd


COLUMN_ALIASES = {
    "seller_id": ["seller_id", "id", "vendor_id", "code"],
    "name": ["name", "seller_name", "vendor_name", "company"],
    "category": ["category", "product_category", "item_category"],
    "location_state": ["location_state", "state", "location"],
    "gstin": ["gstin", "gst_number", "gst_no"],
    "floor_price_per_unit": ["floor_price", "floor_price_per_unit", "min_price", "cost_price"],
    "list_price_per_unit": ["list_price", "list_price_per_unit", "mrp", "selling_price"],
    "moq": ["moq", "min_order_qty", "minimum_order"],
    "max_order_qty": ["max_order_qty", "max_qty", "maximum_order"],
    "quality_grade": ["quality_grade", "quality", "grade"],
    "delivery_days_min": ["delivery_days_min", "delivery_min", "min_delivery_days"],
    "delivery_days_max": ["delivery_days_max", "delivery_max", "max_delivery_days"],
    "payment_terms_accepted": ["payment_terms_accepted", "payment_terms", "payment"],
    "negotiation_strategy": ["negotiation_strategy", "strategy"],
    "current_stock_units": ["current_stock_units", "stock", "inventory"],
    "whatsapp_number": ["whatsapp_number", "whatsapp", "mobile"],
    "tally_ledger_id": ["tally_ledger_id", "tally_id", "ledger_id"],
}


def _resolve_columns(df: pd.DataFrame) -> dict[str, str]:
    """Map canonical field names to actual DataFrame column names."""
    df_cols_lower = {c.lower(): c for c in df.columns}
    mapping = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias.lower() in df_cols_lower:
                mapping[canonical] = df_cols_lower[alias.lower()]
                break
    return mapping


def import_sellers_from_excel(file_path: Union[str, Path]) -> list[dict]:
    """
    Load sellers from Excel (.xlsx) or CSV (.csv) file.
    Returns a list of seller dicts compatible with SellerAgent.from_dict().
    """
    path = Path(file_path)
    if path.suffix.lower() == ".csv":
        df = pd.read_csv(path)
    else:
        df = pd.read_excel(path, engine="openpyxl")

    df.columns = [str(c).strip() for c in df.columns]
    col_map = _resolve_columns(df)

    sellers = []
    for idx, row in df.iterrows():
        def get(field, default=None):
            col = col_map.get(field)
            return row[col] if col and pd.notna(row[col]) else default

        # Parse payment terms (semicolon or comma separated)
        payment_raw = get("payment_terms_accepted", "net_30")
        payment_terms = [t.strip() for t in str(payment_raw).replace(",", ";").split(";") if t.strip()]

        seller = {
            "id": str(get("id", f"EXT{idx+1:03d}")),
            "name": str(get("name", f"Seller {idx+1}")),
            "category": str(get("category", "general")),
            "location_state": str(get("location_state", "Maharashtra")),
            "gstin": str(get("gstin", "UNREGISTERED")),
            "is_msme_registered": True,
            "floor_price_per_unit": float(get("floor_price_per_unit", 1000.0)),
            "list_price_per_unit": float(get("list_price_per_unit", 1200.0)),
            "moq": int(get("moq", 10)),
            "max_order_qty": int(get("max_order_qty", 10000)),
            "quality_grade": str(get("quality_grade", "B")).upper(),
            "quality_certifications": [],
            "delivery_days_min": int(get("delivery_days_min", 3)),
            "delivery_days_max": int(get("delivery_days_max", 14)),
            "payment_terms_accepted": payment_terms or ["net_30"],
            "negotiation_strategy": str(get("negotiation_strategy", "boulware")),
            "max_discount_pct": 10.0,
            "current_stock_units": int(get("current_stock_units", 500)),
            "rating": 4.0,
            "total_orders_completed": 0,
            "whatsapp_number": str(get("whatsapp_number", "")),
            "tally_ledger_id": str(get("tally_ledger_id", "")) or None,
            "blacklisted_by": [],
        }
        sellers.append(seller)

    return sellers


def generate_excel_template(output_path: Union[str, Path]):
    """Create a blank Excel template sellers can fill in."""
    sample = {
        "seller_id": ["S001"],
        "name": ["Shree Ganesh Traders"],
        "category": ["steel_raw"],
        "location_state": ["Maharashtra"],
        "gstin": ["27ABCDE1234F1Z5"],
        "floor_price": [5000.00],
        "list_price": [6000.00],
        "moq": [50],
        "max_qty": [5000],
        "quality_grade": ["A"],
        "delivery_min": [5],
        "delivery_max": [15],
        "payment_terms": ["net_30;advance_50"],
        "strategy": ["boulware"],
        "stock": [1000],
        "whatsapp": ["+917012345678"],
        "tally_ledger_id": ["TL00001"],
    }
    df = pd.DataFrame(sample)
    df.to_excel(str(output_path), index=False)
    print(f"Template saved to {output_path}")


if __name__ == "__main__":
    generate_excel_template("simulation/data/seller_template.xlsx")
