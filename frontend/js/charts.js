// ChartManager - Gerenciador centralizado de gráficos para todos os modos
class ChartManager {
    static defaultColors = [
        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
        '#9b59b6', '#1abc9c', '#34495e', '#d35400',
        '#c0392b', '#8e44ad', '#16a085', '#27ae60'
    ];

    static chartConfigs = {
        bar: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
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
                    grid: {
                        borderDash: [3, 3]
                    }
                }
            }
        },

        line: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        borderDash: [3, 3]
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        },

        pie: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        },

        doughnut: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            },
            cutout: '60%'
        }
    };

    // Métodos estáticos para criar gráficos
    static createBarChart(ctx, data, options = {}) {
        const config = {
            type: 'bar',
            data: data,
            options: { ...this.chartConfigs.bar, ...options }
        };
        return new Chart(ctx, config);
    }

    static createLineChart(ctx, data, options = {}) {
        const config = {
            type: 'line',
            data: data,
            options: { ...this.chartConfigs.line, ...options }
        };
        return new Chart(ctx, config);
    }

    static createPieChart(ctx, data, options = {}) {
        const config = {
            type: 'pie',
            data: data,
            options: { ...this.chartConfigs.pie, ...options }
        };
        return new Chart(ctx, config);
    }

    static createDoughnutChart(ctx, data, options = {}) {
        const config = {
            type: 'doughnut',
            data: data,
            options: { ...this.chartConfigs.doughnut, ...options }
        };
        return new Chart(ctx, config);
    }

    // Utilitários
    static formatCurrencyTooltip(value) {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    static formatNumberTooltip(value) {
        return value.toLocaleString('pt-BR');
    }

    static generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(this.defaultColors[i % this.defaultColors.length]);
        }
        return colors;
    }

    static destroyChart(chart) {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    }

    static updateChart(chart, newData) {
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }

    // Métodos específicos para tipos de gráficos comuns
    static createRevenueTrendChart(ctx, salesTrends) {
        const dates = salesTrends.map(t => {
            const date = new Date(t.date);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });

        const revenues = salesTrends.map(t => t.revenue);

        return this.createLineChart(ctx, {
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
        }, {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => this.formatCurrencyTooltip(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (value) => 'R$ ' + (value / 1000).toFixed(0) + 'k'
                    }
                }
            }
        });
    }

    static createTopProductsChart(ctx, products) {
        const top10 = products.slice(0, 10);
        const labels = top10.map(p => p.product_name);
        const quantities = top10.map(p => p.quantity_sold);

        return this.createBarChart(ctx, {
            labels: labels,
            datasets: [{
                label: 'Quantidade Vendida',
                data: quantities,
                backgroundColor: '#2ecc71'
            }]
        }, {
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.x} unidades`
                    }
                }
            }
        });
    }

    static createChannelPerformanceChart(ctx, channels) {
        const labels = channels.map(c => c.channel_name);
        const revenues = channels.map(c => c.revenue);

        return this.createDoughnutChart(ctx, {
            labels: labels,
            datasets: [{
                data: revenues,
                backgroundColor: this.generateColors(channels.length)
            }]
        }, {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${this.formatCurrencyTooltip(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        });
    }

    static createHourlySalesChart(ctx, hourlyData) {
        const labels = hourlyData.map(h => `${h.hour}h`);
        const revenues = hourlyData.map(h => h.revenue);
        const orders = hourlyData.map(h => h.orders);

        return this.createLineChart(ctx, {
            labels: labels,
            datasets: [
                {
                    label: 'Faturamento',
                    data: revenues,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    yAxisID: 'y',
                    fill: true
                },
                {
                    label: 'Pedidos',
                    data: orders,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    yAxisID: 'y1',
                    fill: true
                }
            ]
        }, {
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Faturamento (R$)' },
                    ticks: {
                        callback: (value) => 'R$ ' + (value / 1000).toFixed(0) + 'k'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Pedidos' },
                    grid: { drawOnChartArea: false }
                }
            }
        });
    }
}

// Exportar para uso global
window.ChartManager = ChartManager;

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 ChartManager carregado e pronto!');
});