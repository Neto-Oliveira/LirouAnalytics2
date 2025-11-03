from datetime import datetime, date
from typing import Optional

def format_currency(value: float) -> str:
    """Formatar valor como moeda brasileira"""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def parse_date(date_str: Optional[str]) -> Optional[date]:
    """Converter string para date"""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return None