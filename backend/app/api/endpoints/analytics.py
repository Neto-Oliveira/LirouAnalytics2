from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.models.schemas import AnalyticsResponse

router = APIRouter()

@router.get("/dashboard", response_model=AnalyticsResponse)
async def get_complete_dashboard(
    start_date: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    store_ids: Optional[List[int]] = Query(None, description="IDs das lojas"),
    db: Session = Depends(get_db)
):
    """
    Dashboard completo com todos os dados - CORRIGIDO
    """
    try:
        service = AnalyticsService(db)
        data = service.get_business_overview(start_date, end_date, store_ids)
        
        # CORREÇÃO: O QueryBuilder retorna 'period' mas o schema espera 'date'
        # Vamos converter corretamente
        if 'sales_trends' in data:
            fixed_trends = []
            for trend in data['sales_trends']:
                # Se o trend tem 'period', convertemos para 'date'
                if 'period' in trend:
                    fixed_trends.append({
                        'date': trend['period'],  # period vira date
                        'revenue': trend['revenue'],
                        'orders': trend['orders'],
                        'avg_ticket': trend['avg_ticket']
                    })
                else:
                    # Já está no formato correto
                    fixed_trends.append(trend)
            data['sales_trends'] = fixed_trends
        
        return data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados do dashboard: {str(e)}")

@router.get("/overview")
async def get_business_overview(
    start_date: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    store_ids: Optional[List[int]] = Query(None, description="IDs das lojas"),
    db: Session = Depends(get_db)
):
    """
    Overview completo do negócio com todas as métricas principais
    """
    try:
        service = AnalyticsService(db)
        result = service.get_business_overview(start_date, end_date, store_ids)
        
        # Aplicar a mesma correção para o overview
        if 'sales_trends' in result:
            fixed_trends = []
            for trend in result['sales_trends']:
                if 'period' in trend:
                    fixed_trends.append({
                        'date': trend['period'],
                        'revenue': trend['revenue'],
                        'orders': trend['orders'],
                        'avg_ticket': trend['avg_ticket']
                    })
                else:
                    fixed_trends.append(trend)
            result['sales_trends'] = fixed_trends
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados: {str(e)}")

@router.get("/sales-trends")
async def get_sales_trends(
    period: str = Query("day", description="Período: day, week, month"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Tendências de vendas ao longo do tempo
    """
    try:
        service = AnalyticsService(db)
        result = service.get_sales_trends(period, start_date, end_date, store_ids)
        
        # Converter period para date nos resultados
        fixed_trends = []
        for trend in result:
            if 'period' in trend:
                fixed_trends.append({
                    'date': trend['period'],
                    'revenue': trend['revenue'],
                    'orders': trend['orders'],
                    'avg_ticket': trend['avg_ticket']
                })
            else:
                fixed_trends.append(trend)
                
        return {"trends": fixed_trends}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tendências: {str(e)}")

@router.get("/top-products")
async def get_top_products(
    limit: int = Query(10, description="Número de produtos"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Produtos mais vendidos
    """
    try:
        service = AnalyticsService(db)
        result = service.get_top_products(limit, start_date, end_date, store_ids)
        return {"products": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar produtos: {str(e)}")

@router.get("/channel-performance")
async def get_channel_performance(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Performance por canal de venda
    """
    try:
        service = AnalyticsService(db)
        result = service.get_channel_performance(start_date, end_date, store_ids)
        return {"channels": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar canais: {str(e)}")

@router.get("/hourly-sales")
async def get_hourly_sales(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Vendas por hora do dia
    """
    try:
        service = AnalyticsService(db)
        result = service.get_hourly_sales(start_date, end_date, store_ids)
        return {"hourly_sales": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar vendas por hora: {str(e)}")

@router.get("/test-simple")
async def test_simple_endpoint():
    """
    Endpoint simples para testar a API
    """
    return {
        "status": "success",
        "message": "API está funcionando!",
        "timestamp": datetime.now().isoformat()
    }