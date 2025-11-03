// Configurações e utilitários para gráficos
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
}

// Exportar para uso global
window.ChartManager = ChartManager;