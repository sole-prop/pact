"""
Tally XML Importer: Parses Tally ERP/Prime exported XML (ledger/stock reports)
and converts to SellerAgent-compatible dicts.

Tally export path: Gateway of Tally → Export → XML → Stock Summary / Ledger Report
"""
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Union


def _text(element, tag: str, default="") -> str:
    child = element.find(tag)
    return child.text.strip() if child is not None and child.text else default


def _float(element, tag: str, default: float = 0.0) -> float:
    val = _text(element, tag, "")
    try:
        return float(val.replace(",", "").strip())
    except ValueError:
        return default


def _int(element, tag: str, default: int = 0) -> int:
    return int(_float(element, tag, float(default)))


def import_sellers_from_tally_xml(
    xml_path: Union[str, Path],
    category: str = "general",
    location_state: str = "Maharashtra",
) -> list[dict]:
    """
    Parse Tally XML export (STOCKSUMMARY or LEDGER format).
    Returns list of seller dicts.

    Tally XML structure expected:
    <ENVELOPE>
      <BODY>
        <EXPORTDATA>
          <REQUESTDATA>
            <TALLYMESSAGE>
              <STOCKITEM NAME="...">
                <RATE>...</RATE>
                <CLOSINGBALANCE>...</CLOSINGBALANCE>
                <OPENINGRATE>...</OPENINGRATE>
              </STOCKITEM>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </EXPORTDATA>
      </BODY>
    </ENVELOPE>
    """
    path = Path(xml_path)
    tree = ET.parse(path)
    root = tree.getroot()

    sellers = []
    items = root.findall(".//STOCKITEM") or root.findall(".//LEDGER")

    for idx, item in enumerate(items):
        name = item.get("NAME", f"Tally Item {idx+1}")
        rate = _float(item, "RATE") or _float(item, "OPENINGRATE", 1000.0)
        closing_balance = _int(item, "CLOSINGBALANCE", 100)
        gstin = _text(item, "GSTIN", "UNREGISTERED")

        if rate <= 0:
            continue  # skip items with no price

        seller = {
            "id": f"TX{idx+1:04d}",
            "name": name,
            "category": category,
            "location_state": location_state,
            "gstin": gstin,
            "is_msme_registered": True,
            "floor_price_per_unit": round(rate * 0.85, 2),   # 15% below rate as floor
            "list_price_per_unit": round(rate, 2),
            "moq": 10,
            "max_order_qty": max(closing_balance, 100),
            "quality_grade": "B",
            "quality_certifications": [],
            "delivery_days_min": 5,
            "delivery_days_max": 21,
            "payment_terms_accepted": ["net_30", "advance_50"],
            "negotiation_strategy": "boulware",
            "max_discount_pct": 10.0,
            "current_stock_units": closing_balance,
            "rating": 4.0,
            "total_orders_completed": 0,
            "whatsapp_number": "",
            "tally_ledger_id": name,
            "blacklisted_by": [],
        }
        sellers.append(seller)

    return sellers


def generate_sample_tally_xml(output_path: Union[str, Path]):
    """Generate a minimal Tally XML for testing the importer."""
    xml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <STOCKITEM NAME="HR Sheet 3mm IS2062">
            <RATE>5500</RATE>
            <CLOSINGBALANCE>500</CLOSINGBALANCE>
            <OPENINGRATE>5200</OPENINGRATE>
            <GSTIN>27AABCU9603R1ZM</GSTIN>
          </STOCKITEM>
          <STOCKITEM NAME="MS Pipe 2inch Schedule 40">
            <RATE>3200</RATE>
            <CLOSINGBALANCE>1200</CLOSINGBALANCE>
            <OPENINGRATE>3000</OPENINGRATE>
            <GSTIN>27AABCU9603R1ZM</GSTIN>
          </STOCKITEM>
          <STOCKITEM NAME="Cotton Fabric 40x40">
            <RATE>120</RATE>
            <CLOSINGBALANCE>5000</CLOSINGBALANCE>
            <OPENINGRATE>110</OPENINGRATE>
            <GSTIN>33AABCU1234P1ZK</GSTIN>
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>'''
    Path(output_path).write_text(xml_content)
    print(f"Sample Tally XML saved to {output_path}")


if __name__ == "__main__":
    generate_sample_tally_xml("simulation/data/sample_tally.xml")
    sellers = import_sellers_from_tally_xml("simulation/data/sample_tally.xml")
    for s in sellers:
        print(s["name"], "→ floor:", s["floor_price_per_unit"])
