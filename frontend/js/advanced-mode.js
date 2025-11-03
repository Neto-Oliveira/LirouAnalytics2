class AdvancedMode {
    constructor() {
        this.api = window.nolaAPI;
        this.currentQuery = {
            dimensions: [],
            measures: [],
            filters: []
        };
        this.currentResults = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupEventListeners();
        this.setDefaultDates();
    }

    setupDragAndDrop() {
        // Configurar arrastar para todos os field-items
        document.querySelectorAll('.field-item').forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
        });
    }

    setupEventListeners() {
        // Aplicar datas
        document.getElementById('apply-dates').addEventListener('click', () => {
            this.updateQueryPreview();
        });
    }

    setDefaultDates() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
    }

    handleDragStart(e) {
        const fieldData = {
            field: e.target.dataset.field,
            type: e.target.dataset.type,
            aggregation: e.target.dataset.aggregation
        };
        e.dataTransfer.setData('application/json', JSON.stringify(fieldData));
        e.target.classList.add('field-dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDrop(e, areaType) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        try {
            const fieldData = JSON.parse(e.dataTransfer.getData('application/json'));
            this.addFieldToArea(fieldData, areaType);
            this.updateQueryPreview();
        } catch (error) {
            console.error('Error parsing dropped data:', error);
        }
        
        // Remover classe de dragging de todos os elementos
        document.querySelectorAll('.field-dragging').forEach(el => {
            el.classList.remove('field-dragging');
        });
    }

    addFieldToArea(fieldData, areaType) {
        const area = document.getElementById(`${areaType}-area`);
        
        // Remover classe empty
        area.classList.remove('empty');
        
        // Verificar se o campo já existe
        const existingField = Array.from(area.children).find(child => 
            child.dataset.field === fieldData.field && child.dataset.type === fieldData.type
        );
        
        if (existingField) {
            return; // Campo já adicionado
        }
        
        // Criar elemento do campo na área
        const fieldElement = document.createElement('div');
        fieldElement.className = 'field-in-area';
        fieldElement.dataset.field = fieldData.field;
        fieldElement.dataset.type = fieldData.type;
        fieldElement.dataset.aggregation = fieldData.aggregation;
        
        let displayText = fieldData.field;
        if (fieldData.aggregation) {
            displayText = `${fieldData.aggregation.toUpperCase()}(${fieldData.field})`;
        }
        
        fieldElement.innerHTML = `
            <span>${this.getFieldIcon(fieldData.type)} ${displayText}</span>
            <button class="remove-field" onclick="advancedMode.removeField('${areaType}', '${fieldData.field}')">✕</button>
        `;
        
        area.appendChild(fieldElement);
        
        // Adicionar ao currentQuery
        if (!this.currentQuery[areaType].some(item => item.field === fieldData.field)) {
            this.currentQuery[areaType].push(fieldData);
        }
    }

    removeField(areaType, fieldName) {
        const area = document.getElementById(`${areaType}-area`);
        const fieldElement = area.querySelector(`[data-field="${fieldName}"]`);
        
        if (fieldElement) {
            fieldElement.remove();
        }
        
        // Remover do currentQuery
        this.currentQuery[areaType] = this.currentQuery[areaType].filter(
            item => item.field !== fieldName
        );
        
        // Se área ficou vazia, mostrar placeholder
        if (area.children.length === 0) {
            area.classList.add('empty');
            area.innerHTML = 'Solte ' + (areaType === 'dimensions' ? 'dimensões' : 'medidas') + ' aqui...';
        }
        
        this.updateQueryPreview();
    }

    addFilter() {
        const filtersArea = document.getElementById('filters-area');
        const filterRow = document.createElement('div');
        filterRow.className = 'filter-row';
        filterRow.innerHTML = `
            <select class="filter-select filter-field" onchange="advancedMode.updateFilter()">
                <option value="">Selecione um campo</option>
                <option value="date">Data</option>
                <option value="product_name">Produto</option>
                <option value="category">Categoria</option>
                <option value="channel">Canal</option>
                <option value="store">Loja</option>
                <option value="payment_type">Tipo Pagamento</option>
            </select>
            <select class="filter-select filter-operator" onchange="advancedMode.updateFilter()">
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
                <option value="LIKE">LIKE</option>
                <option value="IN">IN</option>
            </select>
            <input type="text" class="filter-input filter-value" placeholder="Valor..." onchange="advancedMode.updateFilter()">
            <button class="remove-filter" type="button" onclick="this.parentElement.remove(); advancedMode.updateFilter()">✕</button>
        `;
        
        filtersArea.insertBefore(filterRow, filtersArea.querySelector('.filter-actions'));
        this.updateQueryPreview();
    }

    updateFilter() {
        // Coletar todos os filtros atuais
        const filterRows = document.querySelectorAll('.filter-row');
        this.currentQuery.filters = [];
        
        filterRows.forEach(row => {
            const field = row.querySelector('.filter-field').value;
            const operator = row.querySelector('.filter-operator').value;
            const value = row.querySelector('.filter-value').value;
            
            if (field && operator && value) {
                this.currentQuery.filters.push({ field, operator, value });
            }
        });
        
        this.updateQueryPreview();
    }

    getFieldIcon(type) {
        const icons = {
            dimension: '📊',
            measure: '📈',
            filter: '🔍'
        };
        return icons[type] || '📝';
    }

    updateQueryPreview() {
        const preview = document.getElementById('query-preview');
        
        if (this.currentQuery.dimensions.length === 0 && this.currentQuery.measures.length === 0) {
            preview.textContent = 'Adicione campos para ver a preview da query';
            return;
        }
        
        let queryText = 'SELECT ';
        
        // Medidas
        if (this.currentQuery.measures.length > 0) {
            queryText += this.currentQuery.measures.map(m => 
                `${m.aggregation.toUpperCase()}(${m.field}) as ${m.field}`
            ).join(', ');
        } else {
            queryText += '*';
        }
        
        queryText += ' FROM sales WHERE 1=1';
        
        // Filtros de data
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (startDate) {
            queryText += ` AND date >= '${startDate}'`;
        }
        if (endDate) {
            queryText += ` AND date <= '${endDate}'`;
        }
        
        // Filtros adicionais
        this.currentQuery.filters.forEach(filter => {
            queryText += ` AND ${filter.field} ${filter.operator} '${filter.value}'`;
        });
        
        // Agrupamento
        if (this.currentQuery.dimensions.length > 0) {
            queryText += ' GROUP BY ' + this.currentQuery.dimensions.map(d => d.field).join(', ');
        }
        
        // Ordenação
        if (this.currentQuery.measures.length > 0) {
            queryText += ` ORDER BY ${this.currentQuery.measures[0].field} DESC`;
        }
        
        preview.textContent = queryText;
    }

    async executeQuery() {
        if (this.currentQuery.dimensions.length === 0 && this.currentQuery.measures.length === 0) {
            this.showError('Adicione pelo menos uma dimensão ou medida para executar a query');
            return;
        }
        
        this.showLoading();
        
        try {
            const startTime = performance.now();
            
            // Em produção, isso chamaria a API de queries customizadas
            // Por enquanto, vamos simular com dados existentes
            const timeRange = this.getDateRange();
            const data = await this.api.getDashboardData(timeRange.startDate, timeRange.endDate);
            
            const endTime = performance.now();
            const executionTime = ((endTime - startTime) / 1000).toFixed(2);
            
            this.currentResults = this.simulateQueryResults(data);
            this.displayResults(this.currentResults);
            this.updateExecutionInfo(this.currentResults.length, executionTime);
            
            // Gerar visualizações
            this.generateVisualizations(this.currentResults);
            
        } catch (error) {
            console.error('Error executing query:', error);
            this.showError('Erro ao executar query: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    simulateQueryResults(data) {
        // Simular resultados baseados na query atual
        // Em produção, isso viria do backend
        const results = [];
        
        if (this.currentQuery.dimensions.some(d => d.field === 'channel') && 
            this.currentQuery.measures.some(m => m.field === 'total_sales')) {
            
            // Simular dados de canais
            if (data.channel_performance) {
                data.channel_performance.forEach(channel => {
                    const result = { channel: channel.channel_name };
                    this.currentQuery.measures.forEach(measure => {
                        if (measure.field === 'total_sales') {
                            result.total_sales = channel.revenue;
                        } else if (measure.field === 'order_count') {
                            result.order_count = channel.orders;
                        } else if (measure.field === 'avg_ticket') {
                            result.avg_ticket = channel.avg_ticket;
                        }
                    });
                    results.push(result);
                });
            }
        } else if (this.currentQuery.dimensions.some(d => d.field === 'product_name')) {
            // Simular dados de produtos
            if (data.top_products) {
                data.top_products.forEach(product => {
                    const result = { product_name: product.product_name };
                    this.currentQuery.measures.forEach(measure => {
                        if (measure.field === 'quantity') {
                            result.quantity = product.quantity_sold;
                        } else if (measure.field === 'total_sales') {
                            result.total_sales = product.revenue;
                        }
                    });
                    results.push(result);
                });
            }
        } else {
            // Resultado padrão com overview
            const result = {};
            this.currentQuery.measures.forEach(measure => {
                if (measure.field === 'total_sales') {
                    result.total_sales = data.overview.total_revenue;
                } else if (measure.field === 'order_count') {
                    result.order_count = data.overview.total_orders;
                } else if (measure.field === 'avg_ticket') {
                    result.avg_ticket = data.overview.avg_ticket;
                } else if (measure.field === 'unique_customers') {
                    result.unique_customers = data.overview.unique_customers;
                }
            });
            results.push(result);
        }
        
        return results;
    }

    displayResults(results) {
        const table = document.getElementById('results-table');
        const tbody = table.querySelector('tbody');
        
        if (results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        Nenhum resultado encontrado para a query atual
                    </td>
                </tr>
            `;
            return;
        }
        
        // Obter colunas dos resultados
        const columns = Object.keys(results[0]);
        
        // Atualizar cabeçalho
        let theadHTML = '<tr>';
        columns.forEach(col => {
            theadHTML += `<th>${this.formatColumnName(col)}</th>`;
        });
        theadHTML += '</tr>';
        table.querySelector('thead').innerHTML = theadHTML;
        
        // Atualizar corpo
        let tbodyHTML = '';
        results.forEach(row => {
            tbodyHTML += '<tr>';
            columns.forEach(col => {
                const value = row[col];
                tbodyHTML += `<td>${this.formatValue(value, col)}</td>`;
            });
            tbodyHTML += '</tr>';
        });
        tbody.innerHTML = tbodyHTML;
    }

    formatColumnName(column) {
        const names = {
            'total_sales': 'Vendas Totais',
            'order_count': 'Nº de Pedidos',
            'avg_ticket': 'Ticket Médio',
            'unique_customers': 'Clientes Únicos',
            'product_name': 'Produto',
            'channel': 'Canal',
            'quantity': 'Quantidade'
        };
        return names[column] || column;
    }

    formatValue(value, column) {
        if (typeof value === 'number') {
            if (column.includes('sales') || column.includes('ticket')) {
                return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            }
            return value.toLocaleString('pt-BR');
        }
        return value;
    }

    updateExecutionInfo(resultCount, executionTime) {
        document.getElementById('result-count').textContent = `${resultCount} registros`;
        document.getElementById('execution-time').textContent = `${executionTime}s`;
    }

    generateVisualizations(results) {
        const chartsGrid = document.getElementById('charts-grid');
        chartsGrid.innerHTML = '';
        
        if (results.length === 0) return;
        
        // Gerar gráficos baseados nos dados e query
        const columns = Object.keys(results[0]);
        
        // Gráfico de barras para a primeira medida numérica
        const numericColumns = columns.filter(col => 
            typeof results[0][col] === 'number' && !col.includes('avg')
        );
        
        if (numericColumns.length > 0) {
            this.createBarChart(results, numericColumns[0], columns[0]);
        }
        
        // Gráfico de pizza se tiver categorias
        const categoryColumn = columns.find(col => 
            typeof results[0][col] === 'string' && results.length > 1
        );
        
        if (categoryColumn && numericColumns.length > 0) {
            this.createPieChart(results, categoryColumn, numericColumns[0]);
        }
    }

    createBarChart(results, valueColumn, labelColumn) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container-advanced';
        chartContainer.innerHTML = `<h4>${this.formatColumnName(valueColumn)} por ${this.formatColumnName(labelColumn)}</h4><canvas height="250"></canvas>`;
        
        document.getElementById('charts-grid').appendChild(chartContainer);
        
        const ctx = chartContainer.querySelector('canvas').getContext('2d');
        const labels = results.map(r => r[labelColumn]);
        const data = results.map(r => r[valueColumn]);
        
        this.charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: this.formatColumnName(valueColumn),
                    data: data,
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createPieChart(results, categoryColumn, valueColumn) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container-advanced';
        chartContainer.innerHTML = `<h4>Distribuição de ${this.formatColumnName(valueColumn)}</h4><canvas height="250"></canvas>`;
        
        document.getElementById('charts-grid').appendChild(chartContainer);
        
        const ctx = chartContainer.querySelector('canvas').getContext('2d');
        const labels = results.map(r => r[categoryColumn]);
        const data = results.map(r => r[valueColumn]);
        
        this.charts.pie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
                        '#9b59b6', '#1abc9c', '#d35400', '#c0392b'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    toggleCharts() {
        const container = document.getElementById('charts-container');
        const button = document.getElementById('toggle-charts');
        
        if (container.style.display === 'none') {
            container.style.display = 'block';
            button.textContent = '📊 Ocultar Gráficos';
        } else {
            container.style.display = 'none';
            button.textContent = '📈 Mostrar Gráficos';
        }
    }

    testEndpoint() {
        this.showLoading();
        
        this.api.healthCheck().then(healthy => {
            this.hideLoading();
            if (healthy) {
                alert('✅ Endpoint da API está funcionando corretamente!');
            } else {
                alert('❌ Erro ao conectar com a API. Verifique se o backend está rodando.');
            }
        });
    }

    clearQuery() {
        // Limpar áreas
        ['dimensions', 'measures'].forEach(areaType => {
            const area = document.getElementById(`${areaType}-area`);
            area.innerHTML = 'Solte ' + (areaType === 'dimensions' ? 'dimensões' : 'medidas') + ' aqui...';
            area.classList.add('empty');
        });
        
        // Limpar filtros
        const filtersArea = document.getElementById('filters-area');
        const filterRows = filtersArea.querySelectorAll('.filter-row');
        filterRows.forEach(row => row.remove());
        
        // Limpar query atual
        this.currentQuery = {
            dimensions: [],
            measures: [],
            filters: []
        };
        
        // Limpar resultados
        this.clearResults();
        this.updateQueryPreview();
    }

    clearResults() {
        const table = document.getElementById('results-table');
        table.querySelector('thead').innerHTML = '<tr><th>Selecione dimensões e medidas para ver resultados</th></tr>';
        table.querySelector('tbody').innerHTML = `
            <tr>
                <td style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    🚀 Arraste campos das dimensões e medidas para construir sua query personalizada
                </td>
            </tr>
        `;
        
        document.getElementById('result-count').textContent = '0 registros';
        document.getElementById('execution-time').textContent = '-';
        
        // Limpar gráficos
        document.getElementById('charts-grid').innerHTML = `
            <div class="chart-placeholder">
                <p>Execute uma query para ver as visualizações</p>
            </div>
        `;
        
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    saveQuery() {
        const queryName = prompt('Digite um nome para salvar esta query:');
        if (queryName) {
            // Em produção, isso salvaria no localStorage ou backend
            const savedQueries = JSON.parse(localStorage.getItem('nola_saved_queries') || '[]');
            savedQueries.push({
                name: queryName,
                query: this.currentQuery,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('nola_saved_queries', JSON.stringify(savedQueries));
            alert(`✅ Query "${queryName}" salva com sucesso!`);
        }
    }

    exportResults() {
        if (!this.currentResults || this.currentResults.length === 0) {
            this.showError('Não há resultados para exportar');
            return;
        }
        
        // Simular exportação CSV
        const columns = Object.keys(this.currentResults[0]);
        let csvContent = columns.map(col => this.formatColumnName(col)).join(',') + '\n';
        
        this.currentResults.forEach(row => {
            const rowData = columns.map(col => {
                const value = row[col];
                return typeof value === 'string' ? `"${value}"` : value;
            });
            csvContent += rowData.join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportCharts() {
        alert('Exportação de gráficos em desenvolvimento...');
    }

    getDateRange() {
        return {
            startDate: document.getElementById('start-date').value,
            endDate: document.getElementById('end-date').value
        };
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
window.advancedMode = new AdvancedMode();