from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.services.query_builder import QueryBuilder

class AnalyticsService:
    def __init__(self, db):
        self.db = db
        self.query_builder = QueryBuilder(db)
    
    def get_business_overview(self, start_date: Optional[str] = None, 
                            end_date: Optional[str] = None,
                            store_ids: Optional[List[int]] = None) -> Dict:
        """Overview completo do negócio"""
        filters = self._build_filters(start_date, end_date, store_ids)
        
        overview = self.query_builder.get_kpi_overview(filters)
        sales_trends = self.query_builder.get_sales_trends(filters, 'day')
        top_products = self.query_builder.get_top_products(filters, 10)
        channel_performance = self.query_builder.get_channel_performance(filters)
        hourly_sales = self.query_builder.get_hourly_sales(filters)
        
        # Calcular variações percentuais
        prev_filters = self._build_previous_period_filters(filters)
        prev_overview = self.query_builder.get_kpi_overview(prev_filters)
        
        overview['revenue_change'] = self._calculate_percentage_change(
            overview['total_revenue'], prev_overview['total_revenue']
        )
        overview['orders_change'] = self._calculate_percentage_change(
            overview['total_orders'], prev_overview['total_orders']
        )
        
        return {
            'overview': overview,
            'sales_trends': sales_trends,
            'top_products': top_products,
            'channel_performance': channel_performance,
            'hourly_sales': hourly_sales
        }
    
    def get_sales_trends(self, period: str = 'day',
                        start_date: Optional[str] = None,
                        end_date: Optional[str] = None,
                        store_ids: Optional[List[int]] = None) -> List[Dict]:
        """Tendências de vendas"""
        filters = self._build_filters(start_date, end_date, store_ids)
        return self.query_builder.get_sales_trends(filters, period)
    
    def get_top_products(self, limit: int = 10,
                        start_date: Optional[str] = None,
                        end_date: Optional[str] = None,
                        store_ids: Optional[List[int]] = None) -> List[Dict]:
        """Produtos mais vendidos"""
        filters = self._build_filters(start_date, end_date, store_ids)
        return self.query_builder.get_top_products(filters, limit)
    
    def get_channel_performance(self, start_date: Optional[str] = None,
                              end_date: Optional[str] = None,
                              store_ids: Optional[List[int]] = None) -> List[Dict]:
        """Performance por canal"""
        filters = self._build_filters(start_date, end_date, store_ids)
        return self.query_builder.get_channel_performance(filters)
    
    def _build_filters(self, start_date: Optional[str], end_date: Optional[str], 
                      store_ids: Optional[List[int]]) -> Dict:
        """Construir filtros padrão"""
        filters = {}
        
        if start_date:
            filters['start_date'] = start_date
        else:
            # Padrão: últimos 30 dias
            filters['start_date'] = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        if end_date:
            filters['end_date'] = end_date
        else:
            filters['end_date'] = datetime.now().strftime('%Y-%m-%d')
        
        if store_ids:
            filters['store_ids'] = store_ids
            
        return filters
    
    def _build_previous_period_filters(self, current_filters: Dict) -> Dict:
        """Construir filtros para período anterior (comparação)"""
        start_date = datetime.strptime(current_filters['start_date'], '%Y-%m-%d')
        end_date = datetime.strptime(current_filters['end_date'], '%Y-%m-%d')
        
        period_days = (end_date - start_date).days
        
        prev_start_date = start_date - timedelta(days=period_days)
        prev_end_date = start_date - timedelta(days=1)
        
        prev_filters = current_filters.copy()
        prev_filters['start_date'] = prev_start_date.strftime('%Y-%m-%d')
        prev_filters['end_date'] = prev_end_date.strftime('%Y-%m-%d')
        
        return prev_filters
    
    def _calculate_percentage_change(self, current: float, previous: float) -> float:
        """Calcular variação percentual"""
        if previous == 0:
            return 0.0
        return ((current - previous) / previous) * 100