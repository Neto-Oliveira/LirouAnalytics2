class RestaurantDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000/api/v1';
        this.currentData = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData(); // CORREÇÃO: mudar de loadData() para loadDashboardData()
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadDashboardData(); // CORREÇÃO: mudar para loadDashboardData()
        });

        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.handleTimeRangeChange(e.target.value);
        });
    }

    async loadDashboardData() {
    this.showLoading();
    
    try {
        const timeRange = this.getDateRange();
        const url = `${this.apiBaseUrl}/analytics/dashboard?start_date=${timeRange.startDate}&end_date=${timeRange.endDate}`;
        
        console.log('Carregando dados de:', url);
        
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            this.currentData = data;
            this.updateDashboard(data);
            return; // ⬅️ Success - hideLoading será chamado no updateDashboard
        }
        
    } catch (error) {
        console.log('Erro ao carregar dashboard:', error);
    }
    
    // Se chegou aqui, deu erro
    this.hideLoading();
    alert('Erro ao carregar dados do dashboard');
}

    async loadFallbackData() {
        try {
            console.log('Usando dados de fallback...');
            const response = await fetch(`${this.apiBaseUrl}/debug/test-overview`);
            const data = await response.json();
            
            // Converter para o formato esperado pelo dashboard
            const dashboardData = {
                overview: data.overview,
                sales_trends: this.generateMockTrends(data.overview),
                top_products: data.top_products || [],
                channel_performance: data.channels || [],
                hourly_sales: data.hourly_sales || []
            };
            
            this.currentData = dashboardData;
            this.updateDashboard(dashboardData);
            
        } catch (fallbackError) {
            console.error('Erro no fallback também:', fallbackError);
            this.hideLoading();
            alert('Erro ao carregar dados. Verifique se o backend está rodando na porta 8000.');
        }
    }

    getDateRange() {
        const timeRange = document.getElementById('timeRange').value;
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case 'custom':
                // Implementar seletor de datas customizado depois
                startDate.setDate(endDate.getDate() - 30);
                break;
        }
        
        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }

    generateMockTrends(overview) {
        const trends = [];
        const baseRevenue = overview.total_revenue / 30;
        const baseOrders = overview.total_orders / 30;
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Variação aleatória baseada nos dados médios
            const variation = 0.7 + (Math.random() * 0.6); // 0.7 a 1.3
            const dailyRevenue = baseRevenue * variation;
            const dailyOrders = Math.round(baseOrders * variation);
            
            trends.push({
                date: date.toISOString().split('T')[0],
                revenue: dailyRevenue,
                orders: dailyOrders,
                avg_ticket: dailyRevenue / dailyOrders
            });
        }
        
        return trends;
    }

    updateDashboard(data) {
        this.updateKPICards(data.overview);
        this.updateCharts(data);
        this.updateMetrics(data);
    }

    updateKPICards(overview) {
        // Formatar valores
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        };

        const formatNumber = (value) => {
            return new Intl.NumberFormat('pt-BR').format(value);
        };

        // Atualizar KPIs
        document.getElementById('totalRevenue').textContent = formatCurrency(overview.total_revenue);
        document.getElementById('totalOrders').textContent = formatNumber(overview.total_orders);
        document.getElementById('avgTicket').textContent = formatCurrency(overview.avg_ticket);
        document.getElementById('uniqueCustomers').textContent = formatNumber(overview.unique_customers);

        // Usar variações reais da API se disponíveis, senão simular
        const revenueChange = overview.revenue_change !== undefined ? overview.revenue_change : (Math.random() * 20 - 5);
        const ordersChange = overview.orders_change !== undefined ? overview.orders_change : (Math.random() * 15 - 3);
        
        this.updateChangeIndicator('revenueChange', revenueChange);
        this.updateChangeIndicator('ordersChange', ordersChange);
        this.updateChangeIndicator('ticketChange', 0);
        this.updateChangeIndicator('customersChange', 0);
    }

    updateChangeIndicator(elementId, change) {
        const element = document.getElementById(elementId);
        if (change === 0) {
            element.textContent = '±0%';
            element.className = 'kpi-change';
            return;
        }
        
        const isPositive = change >= 0;
        const symbol = isPositive ? '+' : '';
        
        element.textContent = `${symbol}${change.toFixed(1)}%`;
        element.className = `kpi-change ${isPositive ? '' : 'negative'}`;
    }

    updateCharts(data) {
        this.createRevenueTrendChart(data.sales_trends || []);
        this.createTopProductsChart(data.top_products || []);
        this.createChannelChart(data.channel_performance || data.channels || []);
        this.createHourlyChart(data.hourly_sales || []);
    }

    createRevenueTrendChart(salesTrends) {
        let dates, revenues;
        
        if (salesTrends.length > 0) {
            // Usar dados reais da API
            dates = salesTrends.map(trend => {
                const date = new Date(trend.date);
                return date.toLocaleDateString('pt-BR');
            });
            revenues = salesTrends.map(trend => trend.revenue);
        } else {
            // Gerar dados simulados
            dates = [];
            revenues = [];
            
            for (let i = 30; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                dates.push(date.toLocaleDateString('pt-BR'));
                
                const dailyRevenue = (this.currentData.overview.total_revenue / 30) * (0.8 + Math.random() * 0.4);
                revenues.push(dailyRevenue);
            }
        }

        const options = {
            series: [{
                name: 'Faturamento Diário',
                data: revenues
            }],
            chart: {
                type: 'area',
                height: 350,
                toolbar: {
                    show: true
                }
            },
            colors: ['#3498db'],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.3,
                    stops: [0, 90, 100]
                }
            },
            xaxis: {
                categories: dates,
                labels: {
                    rotate: -45
                }
            },
            yaxis: {
                labels: {
                    formatter: function(value) {
                        return 'R$ ' + (value / 1000).toFixed(0) + 'K';
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function(value) {
                        return 'R$ ' + value.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                    }
                }
            }
        };

        if (this.charts.revenueTrend) {
            this.charts.revenueTrend.updateOptions(options);
        } else {
            this.charts.revenueTrend = new ApexCharts(document.querySelector("#revenueTrendChart"), options);
            this.charts.revenueTrend.render();
        }
    }

    createTopProductsChart(products) {
        if (products.length === 0) {
            console.warn('Sem dados de produtos');
            return;
        }

        const productNames = products.map(p => {
            return p.product_name.length > 30 
                ? p.product_name.substring(0, 30) + '...' 
                : p.product_name;
        });
        const quantities = products.map(p => p.quantity_sold);

        const options = {
            series: [{
                data: quantities
            }],
            chart: {
                type: 'bar',
                height: 350
            },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    horizontal: true,
                    distributed: true,
                }
            },
            colors: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#34495e', '#1abc9c', '#d35400', '#c0392b', '#8e44ad'],
            dataLabels: {
                enabled: true,
                formatter: function(val) {
                    return Math.round(val).toLocaleString('pt-BR');
                }
            },
            xaxis: {
                categories: productNames,
                labels: {
                    formatter: function(val) {
                        return val.toLocaleString('pt-BR');
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function(val) {
                        return val.toLocaleString('pt-BR') + ' unidades';
                    }
                }
            }
        };

        if (this.charts.topProducts) {
            this.charts.topProducts.updateOptions(options);
        } else {
            this.charts.topProducts = new ApexCharts(document.querySelector("#topProductsChart"), options);
            this.charts.topProducts.render();
        }
    }

    createChannelChart(channels) {
        if (channels.length === 0) {
            console.warn('Sem dados de canais');
            return;
        }

        const channelNames = channels.map(c => c.channel_name);
        const revenues = channels.map(c => c.revenue);

        const options = {
            series: revenues,
            chart: {
                type: 'donut',
                height: 350
            },
            labels: channelNames,
            colors: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'],
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }],
            tooltip: {
                y: {
                    formatter: function(val) {
                        return 'R$ ' + val.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                    }
                }
            }
        };

        if (this.charts.channel) {
            this.charts.channel.updateSeries(revenues);
        } else {
            this.charts.channel = new ApexCharts(document.querySelector("#channelChart"), options);
            this.charts.channel.render();
        }
    }

    createHourlyChart(hourlyData) {
        let hours, sales;
        
        if (hourlyData.length > 0) {
            // Usar dados reais
            hours = hourlyData.map(h => h.hour);
            sales = hourlyData.map(h => h.orders);
        } else {
            // Gerar dados simulados
            hours = Array.from({length: 24}, (_, i) => i);
            sales = hours.map(hour => {
                let multiplier = 1;
                if (hour >= 11 && hour <= 14) multiplier = 2.5;
                else if (hour >= 18 && hour <= 21) multiplier = 3.0;
                else if (hour >= 6 && hour <= 9) multiplier = 1.5;
                
                return Math.floor((this.currentData.overview.total_orders / 30 / 24) * multiplier);
            });
        }

        const options = {
            series: [{
                name: 'Pedidos',
                data: sales
            }],
            chart: {
                type: 'line',
                height: 350,
                toolbar: {
                    show: false
                }
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            colors: ['#e74c3c'],
            markers: {
                size: 5
            },
            xaxis: {
                categories: hours.map(h => `${h}h`),
                title: {
                    text: 'Hora do Dia'
                }
            },
            yaxis: {
                title: {
                    text: 'Número de Pedidos'
                }
            },
            tooltip: {
                y: {
                    formatter: function(val) {
                        return val.toLocaleString('pt-BR') + ' pedidos';
                    }
                }
            }
        };

        if (this.charts.hourly) {
            this.charts.hourly.updateOptions(options);
        } else {
            this.charts.hourly = new ApexCharts(document.querySelector("#hourlySalesChart"), options);
            this.charts.hourly.render();
        }
    }

    updateMetrics(data) {
        const overview = data.overview;
        const daysInPeriod = 30;
        
        const avgOrdersPerDay = Math.round(overview.total_orders / daysInPeriod);
        const avgRevenuePerDay = overview.total_revenue / daysInPeriod;
        const avgCustomersPerDay = Math.round(overview.unique_customers / daysInPeriod);
        const retentionRate = Math.min(Math.round((overview.unique_customers / overview.total_orders) * 100), 100);

        document.getElementById('avgOrdersPerDay').textContent = avgOrdersPerDay.toLocaleString('pt-BR');
        document.getElementById('avgRevenuePerDay').textContent = 'R$ ' + Math.round(avgRevenuePerDay).toLocaleString('pt-BR');
        document.getElementById('avgCustomersPerDay').textContent = avgCustomersPerDay.toLocaleString('pt-BR');
        document.getElementById('retentionRate').textContent = retentionRate + '%';
    }

    handleTimeRangeChange(range) {
        console.log('Período alterado para:', range);
        this.loadDashboardData();
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }
}

// Inicializar o dashboard
document.addEventListener('DOMContentLoaded', () => {
    new RestaurantDashboard();
});