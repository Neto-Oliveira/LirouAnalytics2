from sqlalchemy import text
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class QueryBuilder:
    def __init__(self, db):
        self.db = db
    
    def get_kpi_overview(self, filters: Dict) -> Dict:
        """Query para KPIs principais do dashboard"""
        base_conditions = ["s.sale_status_desc = 'COMPLETED'"]
        params = {}
        
        # Filtros de data
        if filters.get('start_date'):
            base_conditions.append("s.created_at >= :start_date")
            params['start_date'] = filters['start_date']
        
        if filters.get('end_date'):
            base_conditions.append("s.created_at <= :end_date")
            params['end_date'] = filters['end_date']
        
        # Filtros de loja
        if filters.get('store_ids'):
            base_conditions.append("s.store_id IN :store_ids")
            params['store_ids'] = tuple(filters['store_ids'])
        
        where_clause = " AND ".join(base_conditions)
        
        query = f"""
        SELECT 
            -- Faturamento total
            COALESCE(SUM(s.total_amount), 0) as total_revenue,
            
            -- Total de pedidos
            COUNT(*) as total_orders,
            
            -- Ticket médio
            CASE 
                WHEN COUNT(*) > 0 THEN SUM(s.total_amount) / COUNT(*)
                ELSE 0 
            END as avg_ticket,
            
            -- Clientes únicos
            COUNT(DISTINCT s.customer_id) as unique_customers
            
        FROM sales s
        WHERE {where_clause}
        """
        
        result = self.db.execute(text(query), params).fetchone()
        
        return {
            'total_revenue': float(result[0]) if result[0] else 0,
            'total_orders': result[1] or 0,
            'avg_ticket': float(result[2]) if result[2] else 0,
            'unique_customers': result[3] or 0
        }
    
    def get_sales_trends(self, filters: Dict, period: str = 'day') -> List[Dict]:
        """Tendências de vendas por período"""
        base_conditions = ["s.sale_status_desc = 'COMPLETED'"]
        params = {}
        
        if filters.get('start_date'):
            base_conditions.append("s.created_at >= :start_date")
            params['start_date'] = filters['start_date']
        
        if filters.get('end_date'):
            base_conditions.append("s.created_at <= :end_date")
            params['end_date'] = filters['end_date']
        
        if filters.get('store_ids'):
            base_conditions.append("s.store_id IN :store_ids")
            params['store_ids'] = tuple(filters['store_ids'])
        
        where_clause = " AND ".join(base_conditions)
        
        if period == 'day':
            group_by = "DATE(s.created_at)"
            date_format = "DATE(s.created_at)"
        elif period == 'week':
            group_by = "EXTRACT(YEAR FROM s.created_at), EXTRACT(WEEK FROM s.created_at)"
            date_format = "TO_CHAR(s.created_at, 'YYYY-WW')"
        else:  # month
            group_by = "EXTRACT(YEAR FROM s.created_at), EXTRACT(MONTH FROM s.created_at)"
            date_format = "TO_CHAR(s.created_at, 'YYYY-MM')"
        
        query = f"""
        SELECT 
            {date_format} as period,
            SUM(s.total_amount) as revenue,
            COUNT(*) as orders,
            AVG(s.total_amount) as avg_ticket
        FROM sales s
        WHERE {where_clause}
        GROUP BY {group_by}
        ORDER BY period
        """
        
        results = self.db.execute(text(query), params).fetchall()
        
        return [
            {
                'period': row[0],
                'revenue': float(row[1]) if row[1] else 0,
                'orders': row[2],
                'avg_ticket': float(row[3]) if row[3] else 0
            }
            for row in results
        ]
    
    def get_top_products(self, filters: Dict, limit: int = 10) -> List[Dict]:
        """Produtos mais vendidos"""
        base_conditions = ["s.sale_status_desc = 'COMPLETED'", "ps.product_id IS NOT NULL"]
        params = {'limit': limit}
        
        if filters.get('start_date'):
            base_conditions.append("s.created_at >= :start_date")
            params['start_date'] = filters['start_date']
        
        if filters.get('end_date'):
            base_conditions.append("s.created_at <= :end_date")
            params['end_date'] = filters['end_date']
        
        if filters.get('store_ids'):
            base_conditions.append("s.store_id IN :store_ids")
            params['store_ids'] = tuple(filters['store_ids'])
        
        where_clause = " AND ".join(base_conditions)
        
        query = f"""
        SELECT 
            p.id as product_id,
            p.name as product_name,
            c.name as category_name,
            SUM(ps.quantity) as quantity_sold,
            SUM(ps.total_price) as revenue
        FROM sales s
        JOIN product_sales ps ON s.id = ps.sale_id
        JOIN products p ON ps.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE {where_clause}
        GROUP BY p.id, p.name, c.name
        ORDER BY quantity_sold DESC
        LIMIT :limit
        """
        
        results = self.db.execute(text(query), params).fetchall()
        
        return [
            {
                'product_id': row[0],
                'product_name': row[1],
                'category': row[2],
                'quantity_sold': float(row[3]) if row[3] else 0,
                'revenue': float(row[4]) if row[4] else 0
            }
            for row in results
        ]
    
    def get_channel_performance(self, filters: Dict) -> List[Dict]:
        """Performance por canal de venda"""
        base_conditions = ["s.sale_status_desc = 'COMPLETED'"]
        params = {}
        
        if filters.get('start_date'):
            base_conditions.append("s.created_at >= :start_date")
            params['start_date'] = filters['start_date']
        
        if filters.get('end_date'):
            base_conditions.append("s.created_at <= :end_date")
            params['end_date'] = filters['end_date']
        
        if filters.get('store_ids'):
            base_conditions.append("s.store_id IN :store_ids")
            params['store_ids'] = tuple(filters['store_ids'])
        
        where_clause = " AND ".join(base_conditions)
        
        query = f"""
        SELECT 
            c.id as channel_id,
            c.name as channel_name,
            SUM(s.total_amount) as revenue,
            COUNT(*) as orders,
            CASE 
                WHEN COUNT(*) > 0 THEN SUM(s.total_amount) / COUNT(*)
                ELSE 0 
            END as avg_ticket
        FROM sales s
        JOIN channels c ON s.channel_id = c.id
        WHERE {where_clause}
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        """
        
        results = self.db.execute(text(query), params).fetchall()
        
        return [
            {
                'channel_id': row[0],
                'channel_name': row[1],
                'revenue': float(row[2]) if row[2] else 0,
                'orders': row[3],
                'avg_ticket': float(row[4]) if row[4] else 0
            }
            for row in results
        ]
    
    def get_hourly_sales(self, filters: Dict) -> List[Dict]:
        """Vendas por hora do dia"""
        base_conditions = ["s.sale_status_desc = 'COMPLETED'"]
        params = {}
        
        if filters.get('start_date'):
            base_conditions.append("s.created_at >= :start_date")
            params['start_date'] = filters['start_date']
        
        if filters.get('end_date'):
            base_conditions.append("s.created_at <= :end_date")
            params['end_date'] = filters['end_date']
        
        if filters.get('store_ids'):
            base_conditions.append("s.store_id IN :store_ids")
            params['store_ids'] = tuple(filters['store_ids'])
        
        where_clause = " AND ".join(base_conditions)
        
        query = f"""
        SELECT 
            EXTRACT(HOUR FROM s.created_at) as hour,
            SUM(s.total_amount) as revenue,
            COUNT(*) as orders,
            CASE 
                WHEN COUNT(*) > 0 THEN SUM(s.total_amount) / COUNT(*)
                ELSE 0 
            END as avg_ticket
        FROM sales s
        WHERE {where_clause}
        GROUP BY EXTRACT(HOUR FROM s.created_at)
        ORDER BY hour
        """
        
        results = self.db.execute(text(query), params).fetchall()
        
        return [
            {
                'hour': int(row[0]),
                'revenue': float(row[1]) if row[1] else 0,
                'orders': row[2],
                'avg_ticket': float(row[3]) if row[3] else 0
            }
            for row in results
        ]