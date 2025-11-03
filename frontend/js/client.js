class DashboardClient {
    constructor() {
        this.api = window.nolaAPI;
        this.charts = {};
        this.currentData = null;
        this.injectChartCSS();
        this.init();
    }

    injectChartCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .chart-container {
                width: 100% !important;
                height: 300px !important;
                position: relative;
            }
            
            .chart-card.full-width .chart-container {
                height: 400px !important;
            }
            
            canvas {
                display: block;
                max-width: 100% !important;
                max-height: 100% !important;
            }
            
            .chart-row {
                display: grid;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .chart-row:first-child {
                grid-template-columns: 1fr;
            }
            
            .chart-row:nth-child(2) {
                grid-template-columns: 1fr 1fr;
            }
            
            .chart-row:nth-child(3) {
                grid-template-columns: 1fr 1fr;
            }
            
            @media (max-width: 768px) {
                .chart-row:nth-child(2),
                .chart-row:nth-child(3) {
                    grid-template-columns: 1fr;
                }
                
                .chart-container {
                    height: 250px !important;
                }
                
                .chart-card.full-width .chart-container {
                    height: 300px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    init() {
        this.setupEventListeners();
        this.checkHealth();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Filtro de tempo
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.handleTimeRangeChange(e.target.value);
        });

        // Botão de atualizar
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.api.clearCache();
            this.loadDashboardData();
        });

        // Exportar dashboard
        document.getElementById('export-dashboard').addEventListener('click', () => {
            this.exportDashboard();
        });
    }

    async checkHealth() {
        const isHealthy = await this.api.healthCheck();
        const indicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (isHealthy) {
            indicator.className = 'status-indicator healthy';
            statusText.textContent = 'Sistema Online - Dados em Tempo Real';
        } else {
            indicator.className = 'status-indicator error';
            statusText.textContent = 'Sistema Offline - Verifique o Backend';
        }
    }

    async loadDashboardData() {
        this.showLoading();
        
        try {
            const timeRange = this.getDateRange();
            const data = await this.api.getDashboardData(timeRange.startDate, timeRange.endDate);
            
            this.currentData = data;
            this.updateDashboard(data);
            this.updateLastUpdate();
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Erro ao carregar dados do dashboard');
        } finally {
            this.hideLoading();
        }
    }

    getDateRange() {
        const timeRange = document.getElementById('timeRange').value;
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
            case '7':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case '180':
                startDate.setDate(endDate.getDate() - 180);
                break;
            case '365':
                startDate.setDate(endDate.getDate() - 365);
                break;
        }
        
        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }

    updateDashboard(data) {
        this.updateKPICards(data.overview);
        this.updateCharts(data);
        this.updateMetrics(data);
    }

    updateKPICards(overview) {
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

        // Atualizar variações
        this.updateChangeIndicator('revenueChange', overview.revenue_change || 0);
        this.updateChangeIndicator('ordersChange', overview.orders_change || 0);
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
        this.createChannelChart(data.channel_performance || []);
        this.createHourlyChart(data.hourly_sales || []);
    }

    createRevenueTrendChart(salesTrends) {
        const ctx = document.getElementById('revenueTrendChart');
        if (!ctx) {
            console.error('Elemento revenueTrendChart não encontrado');
            return;
        }

        // Destruir gráfico anterior se existir
        if (this.charts.revenueTrend) {
            this.charts.revenueTrend.destroy();
        }

        // Verificar se há dados
        if (!salesTrends || salesTrends.length === 0) {
            console.warn('Nenhum dado de tendência de vendas disponível');
            ctx.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum dado disponível para o período selecionado</p>';
            return;
        }

        const dates = salesTrends.map(t => {
            const date = new Date(t.date);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });

        const revenues = salesTrends.map(t => t.revenue);

        console.log('Criando gráfico de tendência:', { dates, revenues });

        try {
            this.charts.revenueTrend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Faturamento Diário',
                        data: revenues,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de tendência:', error);
        }
    }

    createTopProductsChart(products) {
        const ctx = document.getElementById('topProductsChart');
        if (!ctx) {
            console.error('Elemento topProductsChart não encontrado');
            return;
        }

        if (this.charts.topProducts) {
            this.charts.topProducts.destroy();
        }

        // Verificar se há dados
        if (!products || products.length === 0) {
            console.warn('Nenhum dado de produtos disponível');
            ctx.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum produto encontrado</p>';
            return;
        }

        const top10 = products.slice(0, 10);
        const labels = top10.map(p => p.product_name);
        const quantities = top10.map(p => p.quantity_sold);

        console.log('Criando gráfico de produtos:', { labels, quantities });

        try {
            this.charts.topProducts = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Quantidade Vendida',
                        data: quantities,
                        backgroundColor: '#2ecc71',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.parsed.x.toLocaleString('pt-BR')} unidades`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de produtos:', error);
        }
    }

    createChannelChart(channels) {
        const ctx = document.getElementById('channelChart');
        if (!ctx) {
            console.error('Elemento channelChart não encontrado');
            return;
        }

        if (this.charts.channel) {
            this.charts.channel.destroy();
        }

        // Verificar se há dados
        if (!channels || channels.length === 0) {
            console.warn('Nenhum dado de canais disponível');
            ctx.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum canal encontrado</p>';
            return;
        }

        const labels = channels.map(c => c.channel_name);
        const revenues = channels.map(c => c.revenue);

        console.log('Criando gráfico de canais:', { labels, revenues });

        try {
            this.charts.channel = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: revenues,
                        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `R$ ${value.toLocaleString('pt-BR')} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de canais:', error);
        }
    }

    createHourlyChart(hourlyData) {
        const ctx = document.getElementById('hourlySalesChart');
        if (!ctx) {
            console.error('Elemento hourlySalesChart não encontrado');
            return;
        }

        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        // Verificar se há dados
        if (!hourlyData || hourlyData.length === 0) {
            console.warn('Nenhum dado horário disponível');
            ctx.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum dado horário disponível</p>';
            return;
        }

        const labels = hourlyData.map(h => `${h.hour}h`);
        const revenues = hourlyData.map(h => h.revenue);
        const orders = hourlyData.map(h => h.orders);

        console.log('Criando gráfico horário:', { labels, revenues, orders });

        try {
            this.charts.hourly = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Faturamento',
                            data: revenues,
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            yAxisID: 'y',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Pedidos',
                            data: orders,
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            yAxisID: 'y1',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Faturamento (R$)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                                }
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Pedidos'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico horário:', error);
        }
    }

    updateMetrics(data) {
        const overview = data.overview;
        const daysInPeriod = 30; // Ajustar conforme o período
        
        const avgOrdersPerDay = Math.round(overview.total_orders / daysInPeriod);
        const avgRevenuePerDay = overview.total_revenue / daysInPeriod;
        const retentionRate = Math.min(Math.round((overview.unique_customers / overview.total_orders) * 100), 100);
        const monthlyGrowth = overview.revenue_change || 0;

        document.getElementById('avgOrdersPerDay').textContent = avgOrdersPerDay.toLocaleString('pt-BR');
        document.getElementById('avgRevenuePerDay').textContent = 'R$ ' + Math.round(avgRevenuePerDay).toLocaleString('pt-BR');
        document.getElementById('retentionRate').textContent = retentionRate + '%';
        document.getElementById('monthlyGrowth').textContent = monthlyGrowth.toFixed(1) + '%';
    }

    updateLastUpdate() {
        const now = new Date();
        document.getElementById('last-update').textContent = 
            `Última atualização: ${now.toLocaleString('pt-BR')}`;
    }

    handleTimeRangeChange(range) {
        console.log('Período alterado para:', range);
        this.loadDashboardData();
    }

    exportDashboard() {
        // Implementar exportação PDF
        alert('Exportação de relatório em desenvolvimento...');
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showError(message) {
        alert(message);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando DashboardClient...');
    new DashboardClient();
});