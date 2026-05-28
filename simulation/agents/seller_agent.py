"""
SellerAgent: Represents a single MSME seller in the marketplace.
Holds constraints (floor price, MOQ, quality, payment terms) and
responds to negotiation sessions according to its configured strategy.
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SellerAgent:
    id: str
    name: str
    category: str
    location_state: str
    gstin: str
    is_msme_registered: bool

    floor_price_per_unit: float
    list_price_per_unit: float
    moq: int
    max_order_qty: int
    quality_grade: str          # "A", "B", "C"
    quality_certifications: list[str]
    delivery_days_min: int
    delivery_days_max: int
    payment_terms_accepted: list[str]
    negotiation_strategy: str   # boulware|conceder|tit_for_tat|hardball|aspirational|realistic
    max_discount_pct: float
    current_stock_units: int
    rating: float
    total_orders_completed: int
    whatsapp_number: str
    tally_ledger_id: Optional[str] = None
    blacklisted_by: list[str] = field(default_factory=list)
    # New fields from updated mock data
    negotiation_willingness: float = 0.7   # 0.0–1.0 (low = tough negotiator)
    payment_reliability: float = 0.9       # 0.0–1.0 (proxy for credit score)

    # Runtime state (modified during simulation)
    is_online: bool = True
    reserved_stock: int = 0

    @property
    def available_stock(self) -> int:
        return max(0, self.current_stock_units - self.reserved_stock)

    def can_fulfill(self, quantity: int) -> bool:
        return self.available_stock >= quantity and quantity >= self.moq

    def is_blacklisted_by(self, buyer_id: str) -> bool:
        return buyer_id in self.blacklisted_by

    def go_offline(self):
        self.is_online = False

    def go_online(self):
        self.is_online = True

    def reserve_stock(self, qty: int):
        self.reserved_stock += qty

    def release_stock(self, qty: int):
        self.reserved_stock = max(0, self.reserved_stock - qty)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "location_state": self.location_state,
            "floor_price": self.floor_price_per_unit,
            "list_price": self.list_price_per_unit,
            "moq": self.moq,
            "max_qty": self.max_order_qty,
            "quality_grade": self.quality_grade,
            "delivery_days": f"{self.delivery_days_min}-{self.delivery_days_max}",
            "payment_terms": self.payment_terms_accepted,
            "strategy": self.negotiation_strategy,
            "stock": self.available_stock,
            "rating": self.rating,
            "msme": self.is_msme_registered,
            "online": self.is_online,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "SellerAgent":
        return cls(
            id=data["id"],
            name=data["name"],
            category=data["category"],
            location_state=data["location_state"],
            gstin=data["gstin"],
            is_msme_registered=data["is_msme_registered"],
            floor_price_per_unit=data["floor_price_per_unit"],
            list_price_per_unit=data["list_price_per_unit"],
            moq=data["moq"],
            max_order_qty=data["max_order_qty"],
            quality_grade=data["quality_grade"],
            quality_certifications=data.get("quality_certifications", []),
            delivery_days_min=data["delivery_days_min"],
            delivery_days_max=data["delivery_days_max"],
            payment_terms_accepted=data["payment_terms_accepted"],
            negotiation_strategy=data.get("negotiation_strategy", "boulware"),
            max_discount_pct=data.get("max_discount_pct", 10.0),
            current_stock_units=data.get("current_stock_units", 1000),
            rating=data.get("rating", 4.0),
            total_orders_completed=data.get("total_orders_completed", 0),
            whatsapp_number=data.get("whatsapp_number", ""),
            tally_ledger_id=data.get("tally_ledger_id"),
            blacklisted_by=data.get("blacklisted_by", []),
            negotiation_willingness=data.get("negotiation_willingness", 0.7),
            payment_reliability=data.get("payment_reliability", 0.9),
        )
