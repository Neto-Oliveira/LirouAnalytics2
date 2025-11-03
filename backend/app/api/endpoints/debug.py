from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()

@router.get("/test-overview")
async def test_overview(db: Session = Depends(get_db)):
    """Testar apenas o overview sem sales_trends"""
    from app.services.query_builder import QueryBuilder
    
    query_builder = QueryBuilder(db)
    filters = {
        'start_date': '2025-10-01',
        'end_date': '2025-11-03'
    }
    
    overview = query_builder.get_kpi_overview(filters)
    top_products = query_builder.get_top_products(filters, 5)
    channels = query_builder.get_channel_performance(filters)
    hourly = query_builder.get_hourly_sales(filters)
    
    return {
        "overview": overview,
        "top_products": top_products[:3],  # Apenas 3 produtos
        "channels": channels,
        "hourly_sales": hourly
    }

@router.get("/test-sales-only")
async def test_sales_only(db: Session = Depends(get_db)):
    """Testar apenas sales trends com schema corrigido"""
    from app.services.query_builder import QueryBuilder
    
    query_builder = QueryBuilder(db)
    filters = {
        'start_date': '2025-10-01',
        'end_date': '2025-11-03'
    }
    
    trends = query_builder.get_sales_trends(filters, 'day')
    
    # Converter dates para strings para evitar problemas
    fixed_trends = []
    for trend in trends[:5]:  # Apenas 5 primeiros
        fixed_trends.append({
            'date': trend['period'].strftime('%Y-%m-%d') if hasattr(trend['period'], 'strftime') else str(trend['period']),
            'revenue': trend['revenue'],
            'orders': trend['orders'],
            'avg_ticket': trend['avg_ticket']
        })
    
    return {"sales_trends": fixed_trends}