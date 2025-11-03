class SimpleMode {
    constructor() {
        this.api = window.nolaAPI;
        this.currentAnalysis = null;
        this.currentData = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePeriodText();
    }

    setupEventListeners() {
        document.getElementById('time-period').addEventListener('change', (e) => {
            this.updatePeriodText();
        });
    }

    updatePeriodText() {
        const periodSelect = document.getElementById('time-period');
        const periodText = document.getElementById('current-period');
        
        const periods = {
            '7': 'últimos 7 dias',
            '30': 'últimos 30 dias',
            '90': 'últimos 3 meses', 
            '180': 'últimos 6 meses',
            '365': 'último ano'
        };
        
        periodText.textContent = periods[periodSelect.value] || 'últimos 30 dias';
    }

    async loadAnalysis(analysisType) {
        this.showLoading();
        
        try {
            const timeRange = this.getDateRange();
            let data;
            
            switch (analysisType) {
                case 'products':
                    data = await this.loadProductsAnalysis(timeRange);
                    break;
                case 'temporal':
                    data = await this.loadTemporalAnalysis(timeRange);
                    break;
                case 'channels':
                    data = await this.loadChannelsAnalysis(timeRange);
                    break;
                case 'payments':
                    data = await this.loadPaymentsAnalysis(timeRange);
                    break;
                case 'customers':
                    data = await this.loadCustomersAnalysis(timeRange);
                    break;
                case 'seasonality':
                    data = await this.loadSeasonalityAnalysis(timeRange);
                    break;
                default:
                    throw new Error('Tipo de análise não suportado');
            }
            
            this.currentAnalysis = analysisType;
            this.currentData = data;
            this.showAnalysisResult(analysisType, data);
            
        } catch (error) {
            console.error('Error loading analysis:', error);
            this.showError('Erro ao carregar análise');
        } finally {
            this.hideLoading();
        }
    }

    async loadProductsAnalysis(timeRange) {
        const [dashboardData, topProducts] = await Promise.all([
            this.api.getDashboardData(timeRange.startDate, timeRange.endDate),
            this.api.getTopProducts(10, timeRange.startDate, timeRange.endDate)
        ]);
        
        return {
            overview: dashboardData.overview,
            topProducts: topProducts,
            salesTrends: dashboardData.sales_trends || []
        };
    }

    async loadTemporalAnalysis(timeRange) {
        const [dashboardData, salesTrends] = await Promise.all([
            this.api.getDashboardData(timeRange.startDate, timeRange.endDate),
            this.api.getSalesTrends('day', timeRange.startDate, timeRange.endDate)
        ]);
        
        return {
            overview: dashboardData.overview,
            salesTrends: salesTrends,
            hourlySales: dashboardData.hourly_sales || []
        };
    }

    async loadChannelsAnalysis(timeRange) {
        const [dashboardData, channels] = await Promise.all([
            this.api.getDashboardData(timeRange.startDate, timeRange.endDate),
            this.api.getChannelPerformance(timeRange.startDate, timeRange.endDate)
        ]);
        
        return {
            overview: dashboardData.overview,
            channels: channels,
            salesTrends: dashboardData.sales_trends || []
        };
    }

    async loadPaymentsAnalysis(timeRange) {
        const dashboardData = await this.api.getDashboardData(timeRange.startDate, timeRange.endDate);
        
        const paymentMethods = [
            { method: 'Cartão de Crédito', revenue: dashboardData.overview.total_revenue * 0.6, orders: Math.round(dashboardData.overview.total_orders * 0.6) },
            { method: 'Cartão de Débito', revenue: dashboardData.overview.total_revenue * 0.2, orders: Math.round(dashboardData.overview.total_orders * 0.2) },
            { method: 'PIX', revenue: dashboardData.overview.total_revenue * 0.15, orders: Math.round(dashboardData.overview.total_orders * 0.15) },
            { method: 'Dinheiro', revenue: dashboardData.overview.total_revenue * 0.05, orders: Math.round(dashboardData.overview.total_orders * 0.05) }
        ];
        
        return {
            overview: dashboardData.overview,
            paymentMethods: paymentMethods,
            hourlySales: dashboardData.hourly_sales || []
        };
    }

    async loadCustomersAnalysis(timeRange) {
        const dashboardData = await this.api.getDashboardData(timeRange.startDate, timeRange.endDate);
        
        const customerSegments = [
            { segment: 'Clientes Frequentes', count: Math.round(dashboardData.overview.unique_customers * 0.2), avgTicket: dashboardData.overview.avg_ticket * 1.3 },
            { segment: 'Clientes Regulares', count: Math.round(dashboardData.overview.unique_customers * 0.5), avgTicket: dashboardData.overview.avg_ticket },
            { segment: 'Clientes Ocasionais', count: Math.round(dashboardData.overview.unique_customers * 0.3), avgTicket: dashboardData.overview.avg_ticket * 0.7 }
        ];
        
        return {
            overview: dashboardData.overview,
            customerSegments: customerSegments,
            salesTrends: dashboardData.sales_trends || []
        };
    }

    async loadSeasonalityAnalysis(timeRange) {
        const dashboardData = await this.api.getDashboardData(timeRange.startDate, timeRange.endDate);
        
        const hourlyPattern = Array.from({length: 24}, (_, i) => ({
            hour: i,
            orders: Math.round((dashboardData.overview.total_orders / 30 / 24) * this.getHourMultiplier(i)),
            revenue: (dashboardData.overview.total_revenue / 30 / 24) * this.getHourMultiplier(i)
        }));
        
        const weekdayPattern = [
            { day: 'Segunda', orders: Math.round(dashboardData.overview.total_orders / 30 * 0.8) },
            { day: 'Terça', orders: Math.round(dashboardData.overview.total_orders / 30 * 0.9) },
            { day: 'Quarta', orders: Math.round(dashboardData.overview.total_orders / 30 * 1.0) },
            { day: 'Quinta', orders: Math.round(dashboardData.overview.total_orders / 30 * 1.1) },
            { day: 'Sexta', orders: Math.round(dashboardData.overview.total_orders / 30 * 1.3) },
            { day: 'Sábado', orders: Math.round(dashboardData.overview.total_orders / 30 * 1.5) },
            { day: 'Domingo', orders: Math.round(dashboardData.overview.total_orders / 30 * 1.2) }
        ];
        
        return {
            overview: dashboardData.overview,
            hourlyPattern: hourlyPattern,
            weekdayPattern: weekdayPattern,
            hourlySales: dashboardData.hourly_sales || []
        };
    }

    getHourMultiplier(hour) {
        if (hour >= 11 && hour <= 14) return 2.5;
        if (hour >= 18 && hour <= 21) return 3.0;
        if (hour >= 6 && hour <= 9) return 1.5;
        return 1.0;
    }

    showAnalysisResult(analysisType, data) {
        this.hideAnalysisCards();
        
        const resultTitle = document.getElementById('result-title');
        const resultContent = document.getElementById('result-content');
        
        const titles = {
            'products': 'Análise de Produtos',
            'temporal': 'Análise Temporal de Vendas', 
            'channels': 'Análise de Canais de Venda',
            'payments': 'Análise de Métodos de Pagamento',
            'customers': 'Análise de Clientes',
            'seasonality': 'Análise de Sazonalidade'
        };
        
        resultTitle.textContent = titles[analysisType] || 'Análise';
        
        let contentHTML = '';
        
        switch (analysisType) {
            case 'products':
                contentHTML = this.generateProductsContent(data);
                break;
            case 'temporal':
                contentHTML = this.generateTemporalContent(data);
                break;
            case 'channels':
                contentHTML = this.generateChannelsContent(data);
                break;
            case 'payments':
                contentHTML = this.generatePaymentsContent(data);
                break;
            case 'customers':
                contentHTML = this.generateCustomersContent(data);
                break;
            case 'seasonality':
                contentHTML = this.generateSeasonalityContent(data);
                break;
        }
        
        resultContent.innerHTML = contentHTML;
        
        document.getElementById('analysis-result').classList.remove('hidden');
        
        setTimeout(() => {
            this.renderAnalysisCharts(analysisType, data);
        }, 100);
    }

    generateProductsContent(data) {
        return `
            <div class="result-kpis">
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${data.topProducts.length}</div>
                    <div class="kpi-mini-label">Produtos Analisados</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${Math.round(data.topProducts.reduce((sum, p) => sum + p.quantity_sold, 0)).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Unidades Vendidas</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">R$ ${Math.round(data.topProducts.reduce((sum, p) => sum + p.revenue, 0)).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Faturamento Total</div>
                </div>
            </div>
            
            <div class="result-charts">
                <div class="chart-container-result">
                    <h4>Top 10 Produtos por Quantidade</h4>
                    <canvas id="products-quantity-chart"></canvas>
                </div>
                <div class="chart-container-result">
                    <h4>Top 10 Produtos por Faturamento</h4>
                    <canvas id="products-revenue-chart"></canvas>
                </div>
            </div>
            
            <div class="chart-container-result">
                <h4>Distribuição por Categoria</h4>
                <canvas id="products-category-chart"></canvas>
            </div>
        `;
    }

    generateTemporalContent(data) {
        return `
            <div class="result-kpis">
                <div class="kpi-mini">
                    <div class="kpi-mini-value">R$ ${Math.round(data.overview.total_revenue).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Faturamento Total</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${data.overview.total_orders.toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Total de Pedidos</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">R$ ${Math.round(data.overview.avg_ticket).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Ticket Médio</div>
                </div>
            </div>
            
            <div class="result-charts full-width">
                <div class="chart-container-result">
                    <h4>Evolução do Faturamento Diário</h4>
                    <canvas id="temporal-revenue-chart"></canvas>
                </div>
            </div>
            
            <div class="result-charts">
                <div class="chart-container-result">
                    <h4>Vendas por Dia da Semana</h4>
                    <canvas id="weekday-chart"></canvas>
                </div>
                <div class="chart-container-result">
                    <h4>Vendas por Hora do Dia</h4>
                    <canvas id="hourly-pattern-chart"></canvas>
                </div>
            </div>
        `;
    }

    generateChannelsContent(data) {
        return `
            <div class="result-kpis">
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${data.channels.length}</div>
                    <div class="kpi-mini-label">Canais Ativos</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">R$ ${Math.round(data.channels.reduce((sum, c) => sum + c.revenue, 0)).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Faturamento Total</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${data.channels.reduce((sum, c) => sum + c.orders, 0).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Total de Pedidos</div>
                </div>
            </div>
            
            <div class="result-charts">
                <div class="chart-container-result">
                    <h4>Distribuição por Canal</h4>
                    <canvas id="channels-pie-chart"></canvas>
                </div>
                <div class="chart-container-result">
                    <h4>Performance por Canal</h4>
                    <canvas id="channels-bar-chart"></canvas>
                </div>
            </div>
            
            <div class="chart-container-result">
                <h4>Ticket Médio por Canal</h4>
                <canvas id="channels-ticket-chart"></canvas>
            </div>
        `;
    }

    generatePaymentsContent(data) {
        return `
            <div class="result-kpis">
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${data.paymentMethods.length}</div>
                    <div class="kpi-mini-label">Métodos</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">R$ ${Math.round(data.paymentMethods.reduce((sum, p) => sum + p.revenue, 0)).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Faturamento Total</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${data.paymentMethods.reduce((sum, p) => sum + p.orders, 0).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Total de Pedidos</div>
                </div>
            </div>
            
            <div class="result-charts">
                <div class="chart-container-result">
                    <h4>Distribuição por Método</h4>
                    <canvas id="payments-pie-chart"></canvas>
                </div>
                <div class="chart-container-result">
                    <h4>Faturamento por Método</h4>
                    <canvas id="payments-bar-chart"></canvas>
                </div>
            </div>
        `;
    }

    generateCustomersContent(data) {
        return `
            <div class="result-kpis">
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${data.overview.unique_customers.toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Clientes Únicos</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${Math.round(data.overview.total_orders / data.overview.unique_customers)}</div>
                    <div class="kpi-mini-label">Pedidos/Cliente</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">R$ ${Math.round(data.overview.avg_ticket).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Ticket Médio</div>
                </div>
            </div>
            
            <div class="result-charts">
                <div class="chart-container-result">
                    <h4>Segmentação de Clientes</h4>
                    <canvas id="customers-segments-chart"></canvas>
                </div>
                <div class="chart-container-result">
                    <h4>Ticket Médio por Segmento</h4>
                    <canvas id="customers-ticket-chart"></canvas>
                </div>
            </div>
        `;
    }

    generateSeasonalityContent(data) {
        return `
            <div class="result-kpis">
                <div class="kpi-mini">
                    <div class="kpi-mini-value">24h</div>
                    <div class="kpi-mini-label">Análise Horária</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">7</div>
                    <div class="kpi-mini-label">Dias da Semana</div>
                </div>
                <div class="kpi-mini">
                    <div class="kpi-mini-value">${data.weekdayPattern.reduce((sum, d) => sum + d.orders, 0).toLocaleString('pt-BR')}</div>
                    <div class="kpi-mini-label">Pedidos/Semana</div>
                </div>
            </div>
            
            <div class="result-charts full-width">
                <div class="chart-container-result">
                    <h4>Padrão de Vendas por Hora</h4>
                    <canvas id="seasonality-hourly-chart"></canvas>
                </div>
            </div>
            
            <div class="result-charts">
                <div class="chart-container-result">
                    <h4>Vendas por Dia da Semana</h4>
                    <canvas id="seasonality-weekday-chart"></canvas>
                </div>
                <div class="chart-container-result">
                    <h4>Comparativo Horário vs. Real</h4>
                    <canvas id="seasonality-comparison-chart"></canvas>
                </div>
            </div>
        `;
    }

    renderAnalysisCharts(analysisType, data) {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};

        setTimeout(() => {
            this.forceChartContainersSize();
            
            console.log(`Renderizando gráficos para: ${analysisType}`, data);
            
            switch (analysisType) {
                case 'products':
                    this.renderProductsCharts(data);
                    break;
                case 'temporal':
                    this.renderTemporalCharts(data);
                    break;
                case 'channels':
                    this.renderChannelsCharts(data);
                    break;
                case 'payments':
                    this.renderPaymentsCharts(data);
                    break;
                case 'customers':
                    this.renderCustomersCharts(data);
                    break;
                case 'seasonality':
                    this.renderSeasonalityCharts(data);
                    break;
            }
            
        }, 200);
    }

    forceChartContainersSize() {
        const chartContainers = document.querySelectorAll('.chart-container-result');
        chartContainers.forEach(container => {
            container.style.height = '280px';
            container.style.minHeight = '280px';
            container.style.maxHeight = '280px';
            container.style.padding = '15px';
            container.style.overflow = 'visible';
        });

        const fullWidthContainers = document.querySelectorAll('.result-charts.full-width .chart-container-result');
        fullWidthContainers.forEach(container => {
            container.style.height = '320px';
            container.style.minHeight = '320px';
            container.style.maxHeight = '320px';
            container.style.padding = '20px';
            container.style.overflow = 'visible';
        });

        // Ajustar os canvases para ficarem 100% visíveis
        const canvases = document.querySelectorAll('.chart-container-result canvas');
        canvases.forEach(canvas => {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxHeight = 'none';
        });
    }

    renderProductsCharts(data) {
        const top10 = data.topProducts.slice(0, 10);
        
        // Gráfico de quantidade
        const quantityCtx = document.getElementById('products-quantity-chart');
        if (quantityCtx) {
            this.charts.quantity = new Chart(quantityCtx, {
                type: 'bar',
                data: {
                    labels: top10.map(p => p.product_name),
                    datasets: [{
                        label: 'Quantidade Vendida',
                        data: top10.map(p => p.quantity_sold),
                        backgroundColor: '#3498db'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    },
                    indexAxis: 'y',
                    plugins: { 
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Gráfico de faturamento
        const revenueCtx = document.getElementById('products-revenue-chart');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: top10.map(p => p.product_name),
                    datasets: [{
                        label: 'Faturamento (R$)',
                        data: top10.map(p => p.revenue),
                        backgroundColor: '#2ecc71'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    },
                    indexAxis: 'y',
                    scales: {
                        x: {
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
        }

        // Gráfico de categorias
        const categoryCtx = document.getElementById('products-category-chart');
        if (categoryCtx) {
            // Agrupar por categoria
            const categoryGroups = {};
            top10.forEach(product => {
                const category = product.category || 'Outros';
                if (!categoryGroups[category]) {
                    categoryGroups[category] = 0;
                }
                categoryGroups[category] += product.revenue;
            });

            this.charts.category = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categoryGroups),
                    datasets: [{
                        data: Object.values(categoryGroups),
                        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    renderTemporalCharts(data) {
        // Gráfico de tendência de faturamento
        const revenueCtx = document.getElementById('temporal-revenue-chart');
        if (revenueCtx && data.salesTrends && data.salesTrends.length > 0) {
            const dates = data.salesTrends.map(t => {
                const date = new Date(t.date);
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            });
            
            this.charts.revenueTrend = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Faturamento Diário',
                        data: data.salesTrends.map(t => t.revenue),
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
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    },
                    scales: {
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
        }

        // Gráfico de dias da semana
        const weekdayCtx = document.getElementById('weekday-chart');
        if (weekdayCtx) {
            const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
            const weekdayData = [1200, 1500, 1400, 1600, 2200, 2800, 2000];
            
            this.charts.weekday = new Chart(weekdayCtx, {
                type: 'bar',
                data: {
                    labels: weekdays,
                    datasets: [{
                        label: 'Pedidos',
                        data: weekdayData,
                        backgroundColor: '#3498db'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }

        // Gráfico de padrão horário
        const hourlyCtx = document.getElementById('hourly-pattern-chart');
        if (hourlyCtx && data.hourlySales && data.hourlySales.length > 0) {
            const labels = data.hourlySales.map(h => `${h.hour}h`);
            const revenues = data.hourlySales.map(h => h.revenue);
            
            this.charts.hourly = new Chart(hourlyCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Faturamento por Hora',
                        data: revenues,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }
    }

    renderChannelsCharts(data) {
        // Gráfico de pizza para canais
        const pieCtx = document.getElementById('channels-pie-chart');
        if (pieCtx && data.channels && data.channels.length > 0) {
            this.charts.channelsPie = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: data.channels.map(c => c.channel_name),
                    datasets: [{
                        data: data.channels.map(c => c.revenue),
                        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }

        // Gráfico de barras para performance
        const barCtx = document.getElementById('channels-bar-chart');
        if (barCtx && data.channels && data.channels.length > 0) {
            this.charts.channelsBar = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: data.channels.map(c => c.channel_name),
                    datasets: [
                        {
                            label: 'Faturamento',
                            data: data.channels.map(c => c.revenue),
                            backgroundColor: '#3498db'
                        },
                        {
                            label: 'Pedidos',
                            data: data.channels.map(c => c.orders),
                            backgroundColor: '#2ecc71'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }

        // Gráfico de ticket médio
        const ticketCtx = document.getElementById('channels-ticket-chart');
        if (ticketCtx && data.channels && data.channels.length > 0) {
            this.charts.channelsTicket = new Chart(ticketCtx, {
                type: 'bar',
                data: {
                    labels: data.channels.map(c => c.channel_name),
                    datasets: [{
                        label: 'Ticket Médio',
                        data: data.channels.map(c => c.avg_ticket),
                        backgroundColor: '#9b59b6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }
    }

    renderPaymentsCharts(data) {
        const pieCtx = document.getElementById('payments-pie-chart');
        if (pieCtx && data.paymentMethods) {
            this.charts.paymentsPie = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: data.paymentMethods.map(p => p.method),
                    datasets: [{
                        data: data.paymentMethods.map(p => p.revenue),
                        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }

        const barCtx = document.getElementById('payments-bar-chart');
        if (barCtx && data.paymentMethods) {
            this.charts.paymentsBar = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: data.paymentMethods.map(p => p.method),
                    datasets: [
                        {
                            label: 'Faturamento',
                            data: data.paymentMethods.map(p => p.revenue),
                            backgroundColor: '#3498db'
                        },
                        {
                            label: 'Pedidos',
                            data: data.paymentMethods.map(p => p.orders),
                            backgroundColor: '#2ecc71'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }
    }

    renderCustomersCharts(data) {
        const segmentsCtx = document.getElementById('customers-segments-chart');
        if (segmentsCtx && data.customerSegments) {
            this.charts.customersSegments = new Chart(segmentsCtx, {
                type: 'pie',
                data: {
                    labels: data.customerSegments.map(c => c.segment),
                    datasets: [{
                        data: data.customerSegments.map(c => c.count),
                        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }

        const ticketCtx = document.getElementById('customers-ticket-chart');
        if (ticketCtx && data.customerSegments) {
            this.charts.customersTicket = new Chart(ticketCtx, {
                type: 'bar',
                data: {
                    labels: data.customerSegments.map(c => c.segment),
                    datasets: [{
                        label: 'Ticket Médio',
                        data: data.customerSegments.map(c => c.avg_ticket),
                        backgroundColor: '#9b59b6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }
    }

    renderSeasonalityCharts(data) {
        const hourlyCtx = document.getElementById('seasonality-hourly-chart');
        if (hourlyCtx && data.hourlyPattern) {
            this.charts.seasonalityHourly = new Chart(hourlyCtx, {
                type: 'line',
                data: {
                    labels: data.hourlyPattern.map(h => `${h.hour}h`),
                    datasets: [{
                        label: 'Padrão de Vendas',
                        data: data.hourlyPattern.map(h => h.orders),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }

        const weekdayCtx = document.getElementById('seasonality-weekday-chart');
        if (weekdayCtx && data.weekdayPattern) {
            this.charts.seasonalityWeekday = new Chart(weekdayCtx, {
                type: 'bar',
                data: {
                    labels: data.weekdayPattern.map(d => d.day),
                    datasets: [{
                        label: 'Pedidos',
                        data: data.weekdayPattern.map(d => d.orders),
                        backgroundColor: '#2ecc71'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }

        const comparisonCtx = document.getElementById('seasonality-comparison-chart');
        if (comparisonCtx && data.hourlyPattern && data.hourlySales) {
            this.charts.seasonalityComparison = new Chart(comparisonCtx, {
                type: 'line',
                data: {
                    labels: data.hourlyPattern.map(h => `${h.hour}h`),
                    datasets: [
                        {
                            label: 'Padrão Esperado',
                            data: data.hourlyPattern.map(h => h.orders),
                            borderColor: '#3498db',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Real Observado',
                            data: data.hourlySales.map(h => h.orders),
                            borderColor: '#e74c3c'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            });
        }
    }

    exportChart() {
        if (!this.currentAnalysis || Object.keys(this.charts).length === 0) {
            alert('Nenhum gráfico disponível para exportar');
            return;
        }

        try {
            const chartKey = Object.keys(this.charts)[0];
            const chart = this.charts[chartKey];
            
            if (chart && typeof chart.toBase64Image === 'function') {
                const base64Image = chart.toBase64Image();
                const link = document.createElement('a');
                link.download = `grafico-${this.currentAnalysis}-${new Date().toISOString().split('T')[0]}.png`;
                link.href = base64Image;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert('Gráfico não está pronto para exportação');
            }
        } catch (error) {
            console.error('Erro ao exportar gráfico:', error);
            alert('Erro ao exportar gráfico');
        }
    }

    exportCSV() {
        alert('Exportação CSV em desenvolvimento...');
    }

    getDateRange() {
        const timeRange = document.getElementById('time-period').value;
        const endDate = new Date();
        const startDate = new Date();
        
        startDate.setDate(endDate.getDate() - parseInt(timeRange));
        
        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }

    showAnalysisCards() {
        document.getElementById('analysis-result').classList.add('hidden');
        document.getElementById('analysis-cards').classList.remove('hidden');
        
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    hideAnalysisCards() {
        document.getElementById('analysis-cards').classList.add('hidden');
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

// Instância global
window.simpleMode = new SimpleMode();