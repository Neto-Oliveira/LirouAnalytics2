class NolaAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000/api/v1';
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutos
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    async getDashboardData(startDate = null, endDate = null) {
        const cacheKey = `dashboard-${startDate}-${endDate}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            let url = `${this.baseURL}/analytics/dashboard`;
            const params = new URLSearchParams();
            
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log('Fetching dashboard data from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the data
            this.cache.set(cacheKey, data);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
            
            return data;
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }

    async getTopProducts(limit = 10, startDate = null, endDate = null) {
        try {
            let url = `${this.baseURL}/analytics/top-products?limit=${limit}`;
            const params = new URLSearchParams();
            
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            if (params.toString()) {
                url += `&${params.toString()}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            return data.products || [];
        } catch (error) {
            console.error('Error fetching top products:', error);
            return [];
        }
    }

    async getChannelPerformance(startDate = null, endDate = null) {
        try {
            let url = `${this.baseURL}/analytics/channel-performance`;
            const params = new URLSearchParams();
            
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            return data.channels || [];
        } catch (error) {
            console.error('Error fetching channel performance:', error);
            return [];
        }
    }

    async getSalesTrends(period = 'day', startDate = null, endDate = null) {
        try {
            let url = `${this.baseURL}/analytics/sales-trends`;
            const params = new URLSearchParams();
            
            params.append('period', period);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            url += `?${params.toString()}`;
            
            const response = await fetch(url);
            const data = await response.json();
            return data.trends || [];
        } catch (error) {
            console.error('Error fetching sales trends:', error);
            return [];
        }
    }

    // Método para queries customizadas (modo avançado)
    async executeCustomQuery(dimensions = [], measures = [], filters = []) {
        try {
            const response = await fetch(`${this.baseURL}/analytics/custom-query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dimensions,
                    measures,
                    filters
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error executing custom query:', error);
            throw error;
        }
    }

    // Limpar cache
    clearCache() {
        this.cache.clear();
    }
}

// Instância global da API
window.nolaAPI = new NolaAPI();