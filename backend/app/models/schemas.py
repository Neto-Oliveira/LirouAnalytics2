from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# Schemas CORRETOS - usar 'date' em SalesTrend
class KPIOverview(BaseModel):
    total_revenue: float
    total_orders: int
    avg_ticket: float
    unique_customers: int
    revenue_change: Optional[float] = None
    orders_change: Optional[float] = None

class SalesTrend(BaseModel):
    date: date  # ⬅️ CORRETO: usar 'date' (não 'period')
    revenue: float
    orders: int
    avg_ticket: float

class TopProduct(BaseModel):
    product_id: int
    product_name: str
    quantity_sold: float
    revenue: float
    category: Optional[str] = None

class ChannelPerformance(BaseModel):
    channel_id: int
    channel_name: str
    revenue: float
    orders: int
    avg_ticket: float

class HourlySales(BaseModel):
    hour: int
    revenue: float
    orders: int
    avg_ticket: float

class AnalyticsResponse(BaseModel):
    overview: KPIOverview
    sales_trends: List[SalesTrend]
    top_products: List[TopProduct]
    channel_performance: List[ChannelPerformance]
    hourly_sales: List[HourlySales]