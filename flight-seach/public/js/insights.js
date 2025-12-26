// Sistema de Insights da IA
class AIInsightsManager {
    constructor() {
        this.currentInsights = {};
        this.userPatterns = {};
        this.priceHistory = {};
        this.recommendations = [];
        this.init();
    }

    init() {
        this.setupInsightsContainer();
        this.loadUserPatterns();
        this.setupInsightsRefresh();
        this.setupPersonalization();
    }

    // Configurar container de insights
    setupInsightsContainer() {
        const insightsContainer = document.getElementById('ai-insights');
        if (!insightsContainer) return;

        // Adicionar event listeners para interações
        insightsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.insight-card')) {
                const insightId = e.target.closest('.insight-card').dataset.insightId;
                this.showInsightDetails(insightId);
            }
        });
    }

    // Carregar padrões do usuário
    loadUserPatterns() {
        if (window.authManager && window.authManager.isLoggedIn()) {
            this.loadUserData();
        } else {
            // Carregar dados anônimos do localStorage
            const patterns = localStorage.getItem('userPatterns');
            if (patterns) {
                this.userPatterns = JSON.parse(patterns);
            }
        }
    }

    // Carregar dados do usuário
    async loadUserData() {
        try {
            const response = await fetch('/api/ai/patterns/analysis', {
                headers: {
                    'Authorization': `Bearer ${window.authManager.getToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userPatterns = data.patterns;
                this.recommendations = data.recommendations;
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }

    // Configurar atualização de insights
    setupInsightsRefresh() {
        const refreshBtn = document.getElementById('refresh-insights');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshInsights();
            });
        }
    }

    // Configurar personalização
    setupPersonalization() {
        const personalizationToggle = document.getElementById('personalization-toggle');
        if (personalizationToggle) {
            personalizationToggle.addEventListener('change', (e) => {
                this.togglePersonalization(e.target.checked);
            });
        }
    }

    // Mostrar insights da busca
    showSearchInsights(insights) {
        this.currentInsights = insights;
        this.renderSearchInsights();
        this.updatePricePredictions();
        this.showPersonalizedRecommendations();
    }

    // Renderizar insights da busca
    renderSearchInsights() {
        const insightsContainer = document.getElementById('ai-insights');
        if (!insightsContainer || !this.currentInsights) return;

        insightsContainer.innerHTML = `
            <div class="insights-header">
                <div class="insights-title">
                    <i class="fas fa-brain"></i>
                    <h3>Análise Inteligente</h3>
                </div>
                <button class="btn btn-outline btn-sm" id="refresh-insights">
                    <i class="fas fa-sync-alt"></i>
                    Atualizar
                </button>
            </div>

            <div class="insights-grid">
                ${this.renderInsightCards()}
            </div>

            <div class="insights-details">
                ${this.renderDetailedInsights()}
            </div>
        `;

        // Reconfigurar event listeners
        this.setupInsightsRefresh();
    }

    // Renderizar cards de insights
    renderInsightCards() {
        const cards = [];

        // Card de preço
        if (this.currentInsights.priceAnalysis) {
            cards.push(`
                <div class="insight-card price-insight" data-insight-id="price">
                    <div class="insight-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="insight-content">
                        <h4>Análise de Preço</h4>
                        <p>${this.currentInsights.priceAnalysis.summary}</p>
                        <div class="insight-metrics">
                            <span class="metric">
                                <i class="fas fa-arrow-${this.currentInsights.priceAnalysis.trend === 'up' ? 'up' : 'down'}"></i>
                                ${this.currentInsights.priceAnalysis.change}%
                            </span>
                        </div>
                    </div>
                </div>
            `);
        }

        // Card de demanda
        if (this.currentInsights.demandAnalysis) {
            cards.push(`
                <div class="insight-card demand-insight" data-insight-id="demand">
                    <div class="insight-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="insight-content">
                        <h4>Análise de Demanda</h4>
                        <p>${this.currentInsights.demandAnalysis.summary}</p>
                        <div class="insight-metrics">
                            <span class="metric">
                                <i class="fas fa-users"></i>
                                ${this.currentInsights.demandAnalysis.level}
                            </span>
                        </div>
                    </div>
                </div>
            `);
        }

        // Card de tempo
        if (this.currentInsights.timingAnalysis) {
            cards.push(`
                <div class="insight-card timing-insight" data-insight-id="timing">
                    <div class="insight-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="insight-content">
                        <h4>Melhor Momento</h4>
                        <p>${this.currentInsights.timingAnalysis.summary}</p>
                        <div class="insight-metrics">
                            <span class="metric">
                                <i class="fas fa-calendar-alt"></i>
                                ${this.currentInsights.timingAnalysis.recommendedDays}
                            </span>
                        </div>
                    </div>
                </div>
            `);
        }

        // Card de companhia
        if (this.currentInsights.airlineAnalysis) {
            cards.push(`
                <div class="insight-card airline-insight" data-insight-id="airline">
                    <div class="insight-icon">
                        <i class="fas fa-plane"></i>
                    </div>
                    <div class="insight-content">
                        <h4>Companhias Aéreas</h4>
                        <p>${this.currentInsights.airlineAnalysis.summary}</p>
                        <div class="insight-metrics">
                            <span class="metric">
                                <i class="fas fa-star"></i>
                                ${this.currentInsights.airlineAnalysis.topAirline}
                            </span>
                        </div>
                    </div>
                </div>
            `);
        }

        return cards.join('');
    }

    // Renderizar insights detalhados
    renderDetailedInsights() {
        let details = '';

        // Recomendações
        if (this.currentInsights.recommendations) {
            details += `
                <div class="insight-section">
                    <h4><i class="fas fa-lightbulb"></i> Recomendações Inteligentes</h4>
                    <div class="recommendations-list">
                        ${this.currentInsights.recommendations.map((rec, index) => `
                            <div class="recommendation-item">
                                <div class="recommendation-number">${index + 1}</div>
                                <div class="recommendation-content">
                                    <p>${rec}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Dicas de economia
        if (this.currentInsights.savingsTips) {
            details += `
                <div class="insight-section">
                    <h4><i class="fas fa-piggy-bank"></i> Dicas para Economizar</h4>
                    <div class="tips-list">
                        ${this.currentInsights.savingsTips.map(tip => `
                            <div class="tip-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${tip}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Análise de tendências
        if (this.currentInsights.trendAnalysis) {
            details += `
                <div class="insight-section">
                    <h4><i class="fas fa-chart-area"></i> Análise de Tendências</h4>
                    <div class="trend-analysis">
                        <div class="trend-chart">
                            ${this.renderTrendChart()}
                        </div>
                        <div class="trend-insights">
                            ${this.currentInsights.trendAnalysis.insights.map(insight => `
                                <div class="trend-insight">
                                    <i class="fas fa-${insight.icon}"></i>
                                    <span>${insight.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        return details;
    }

    // Renderizar gráfico de tendências
    renderTrendChart() {
        if (!this.currentInsights.trendAnalysis) return '';

        const { data } = this.currentInsights.trendAnalysis;
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));

        return `
            <div class="chart-container">
                <div class="chart-labels">
                    ${data.map(d => `<span class="chart-label">${d.label}</span>`).join('')}
                </div>
                <div class="chart-bars">
                    ${data.map(d => {
                        const height = ((d.value - minValue) / (maxValue - minValue)) * 100;
                        return `
                            <div class="chart-bar" style="height: ${height}%">
                                <span class="bar-value">R$ ${d.value.toLocaleString()}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Atualizar previsões de preço
    updatePricePredictions() {
        if (!this.currentInsights.pricePredictions) return;

        const predictionsContainer = document.getElementById('price-predictions');
        if (!predictionsContainer) return;

        predictionsContainer.innerHTML = `
            <div class="predictions-header">
                <h4><i class="fas fa-crystal-ball"></i> Previsões de Preço</h4>
                <span class="prediction-accuracy">Precisão: ${this.currentInsights.pricePredictions.accuracy}%</span>
            </div>
            <div class="predictions-content">
                ${this.currentInsights.pricePredictions.predictions.map(pred => `
                    <div class="prediction-item">
                        <div class="prediction-period">
                            <span class="period-label">${pred.period}</span>
                            <span class="period-days">${pred.days} dias</span>
                        </div>
                        <div class="prediction-price">
                            <span class="price-range">R$ ${pred.minPrice.toLocaleString()} - R$ ${pred.maxPrice.toLocaleString()}</span>
                            <span class="price-trend ${pred.trend}">
                                <i class="fas fa-arrow-${pred.trend === 'up' ? 'up' : 'down'}"></i>
                                ${pred.change}%
                            </span>
                        </div>
                        <div class="prediction-confidence">
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${pred.confidence}%"></div>
                            </div>
                            <span class="confidence-text">${pred.confidence}% confiança</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Mostrar recomendações personalizadas
    showPersonalizedRecommendations() {
        if (!this.recommendations.length) return;

        const recommendationsContainer = document.getElementById('personalized-recommendations');
        if (!recommendationsContainer) return;

        recommendationsContainer.innerHTML = `
            <div class="recommendations-header">
                <h4><i class="fas fa-user-check"></i> Recomendações Personalizadas</h4>
                <label class="personalization-toggle">
                    <input type="checkbox" id="personalization-toggle" checked>
                    <span class="toggle-slider"></span>
                    Personalizar
                </label>
            </div>
            <div class="recommendations-content">
                ${this.recommendations.map(rec => `
                    <div class="recommendation-card">
                        <div class="recommendation-header">
                            <div class="recommendation-type">
                                <i class="fas fa-${rec.type === 'price' ? 'dollar-sign' : rec.type === 'timing' ? 'clock' : 'route'}"></i>
                                <span>${rec.category}</span>
                            </div>
                            <div class="recommendation-score">
                                <span class="score">${rec.score}%</span>
                                <span class="score-label">relevância</span>
                            </div>
                        </div>
                        <div class="recommendation-body">
                            <h5>${rec.title}</h5>
                            <p>${rec.description}</p>
                            ${rec.action ? `
                                <button class="btn btn-primary btn-sm" onclick="insightsManager.applyRecommendation('${rec.id}')">
                                    <i class="fas fa-check"></i>
                                    ${rec.action}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.setupPersonalization();
    }

    // Aplicar recomendação
    applyRecommendation(recommendationId) {
        const recommendation = this.recommendations.find(r => r.id === recommendationId);
        if (!recommendation) return;

        switch (recommendation.type) {
            case 'price':
                this.applyPriceRecommendation(recommendation);
                break;
            case 'timing':
                this.applyTimingRecommendation(recommendation);
                break;
            case 'route':
                this.applyRouteRecommendation(recommendation);
                break;
        }

        this.showSuccess('Recomendação aplicada com sucesso!');
    }

    // Aplicar recomendação de preço
    applyPriceRecommendation(recommendation) {
        const priceSlider = document.getElementById('price-range');
        if (priceSlider && recommendation.maxPrice) {
            priceSlider.value = recommendation.maxPrice;
            priceSlider.dispatchEvent(new Event('input'));
        }
    }

    // Aplicar recomendação de timing
    applyTimingRecommendation(recommendation) {
        const departureInput = document.getElementById('departure-date');
        if (departureInput && recommendation.optimalDate) {
            departureInput.value = recommendation.optimalDate;
        }
    }

    // Aplicar recomendação de rota
    applyRouteRecommendation(recommendation) {
        const originInput = document.getElementById('origin');
        const destinationInput = document.getElementById('destination');
        
        if (originInput && recommendation.origin) {
            originInput.value = recommendation.origin;
        }
        
        if (destinationInput && recommendation.destination) {
            destinationInput.value = recommendation.destination;
        }
    }

    // Mostrar detalhes do insight
    showInsightDetails(insightId) {
        const insight = this.getInsightById(insightId);
        if (!insight) return;

        const modal = document.createElement('div');
        modal.className = 'modal insight-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-${this.getInsightIcon(insightId)}"></i> ${this.getInsightTitle(insightId)}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.renderInsightDetails(insight)}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Fechar</button>
                    ${insight.action ? `
                        <button class="btn btn-primary" onclick="insightsManager.executeInsightAction('${insightId}')">
                            <i class="fas fa-play"></i>
                            ${insight.action}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Renderizar detalhes do insight
    renderInsightDetails(insight) {
        return `
            <div class="insight-details">
                <div class="insight-summary">
                    <h4>Resumo</h4>
                    <p>${insight.summary}</p>
                </div>
                
                ${insight.data ? `
                    <div class="insight-data">
                        <h4>Dados de Análise</h4>
                        <div class="data-grid">
                            ${Object.entries(insight.data).map(([key, value]) => `
                                <div class="data-item">
                                    <span class="data-label">${key}</span>
                                    <span class="data-value">${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${insight.chart ? `
                    <div class="insight-chart">
                        <h4>Visualização</h4>
                        <div class="chart-container">
                            ${this.renderInsightChart(insight.chart)}
                        </div>
                    </div>
                ` : ''}
                
                ${insight.recommendations ? `
                    <div class="insight-recommendations">
                        <h4>Recomendações</h4>
                        <ul>
                            ${insight.recommendations.map(rec => `
                                <li>${rec}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Renderizar gráfico do insight
    renderInsightChart(chartData) {
        // Implementar renderização de gráficos específicos
        return `<div class="chart-placeholder">Gráfico interativo aqui</div>`;
    }

    // Executar ação do insight
    executeInsightAction(insightId) {
        const insight = this.getInsightById(insightId);
        if (!insight || !insight.action) return;

        // Implementar ações específicas baseadas no tipo de insight
        switch (insightId) {
            case 'price':
                this.executePriceAction(insight);
                break;
            case 'demand':
                this.executeDemandAction(insight);
                break;
            case 'timing':
                this.executeTimingAction(insight);
                break;
            case 'airline':
                this.executeAirlineAction(insight);
                break;
        }

        this.showSuccess('Ação executada com sucesso!');
        document.querySelector('.insight-details-modal').remove();
    }

    // Executar ação de preço
    executePriceAction(insight) {
        // Aplicar filtros de preço baseados na análise
        const priceSlider = document.getElementById('price-range');
        if (priceSlider && insight.recommendedPrice) {
            priceSlider.value = insight.recommendedPrice;
            priceSlider.dispatchEvent(new Event('input'));
        }
    }

    // Executar ação de demanda
    executeDemandAction(insight) {
        // Mostrar alerta sobre alta demanda
        this.showAlert('Alta demanda detectada! Considere reservar com antecedência.', 'warning');
    }

    // Executar ação de timing
    executeTimingAction(insight) {
        // Sugerir datas alternativas
        if (insight.optimalDates) {
            this.showDateSuggestions(insight.optimalDates);
        }
    }

    // Executar ação de companhia aérea
    executeAirlineAction(insight) {
        // Aplicar filtro de companhia aérea recomendada
        const airlineFilter = document.querySelector(`input[name="airline-filter"][value="${insight.recommendedAirline}"]`);
        if (airlineFilter) {
            airlineFilter.checked = true;
            airlineFilter.dispatchEvent(new Event('change'));
        }
    }

    // Mostrar sugestões de datas
    showDateSuggestions(dates) {
        const modal = document.createElement('div');
        modal.className = 'modal date-suggestions-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-alt"></i> Datas Recomendadas</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Baseado na análise de preços e demanda, estas datas oferecem melhor valor:</p>
                    <div class="date-suggestions">
                        ${dates.map(date => `
                            <div class="date-suggestion">
                                <span class="date">${date.date}</span>
                                <span class="price">R$ ${date.price.toLocaleString()}</span>
                                <span class="savings">Economia de R$ ${date.savings.toLocaleString()}</span>
                                <button class="btn btn-primary btn-sm" onclick="insightsManager.selectDate('${date.date}')">
                                    Selecionar
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Selecionar data
    selectDate(dateString) {
        const departureInput = document.getElementById('departure-date');
        if (departureInput) {
            departureInput.value = dateString;
        }
        document.querySelector('.date-suggestions-modal').remove();
        this.showSuccess('Data selecionada!');
    }

    // Atualizar insights
    async refreshInsights() {
        try {
            const response = await fetch('/api/ai/insights/general');
            if (response.ok) {
                const data = await response.json();
                this.currentInsights = { ...this.currentInsights, ...data };
                this.renderSearchInsights();
                this.showSuccess('Insights atualizados!');
            }
        } catch (error) {
            console.error('Erro ao atualizar insights:', error);
            this.showError('Erro ao atualizar insights');
        }
    }

    // Alternar personalização
    togglePersonalization(enabled) {
        if (enabled) {
            this.loadUserPatterns();
            this.showPersonalizedRecommendations();
        } else {
            this.hidePersonalizedRecommendations();
        }
    }

    // Esconder recomendações personalizadas
    hidePersonalizedRecommendations() {
        const recommendationsContainer = document.getElementById('personalized-recommendations');
        if (recommendationsContainer) {
            recommendationsContainer.style.display = 'none';
        }
    }

    // Obter insight por ID
    getInsightById(insightId) {
        const insights = {
            price: this.currentInsights.priceAnalysis,
            demand: this.currentInsights.demandAnalysis,
            timing: this.currentInsights.timingAnalysis,
            airline: this.currentInsights.airlineAnalysis
        };
        return insights[insightId];
    }

    // Obter ícone do insight
    getInsightIcon(insightId) {
        const icons = {
            price: 'dollar-sign',
            demand: 'chart-line',
            timing: 'clock',
            airline: 'plane'
        };
        return icons[insightId] || 'info-circle';
    }

    // Obter título do insight
    getInsightTitle(insightId) {
        const titles = {
            price: 'Análise de Preço',
            demand: 'Análise de Demanda',
            timing: 'Melhor Momento',
            airline: 'Companhias Aéreas'
        };
        return titles[insightId] || 'Insight';
    }

    // Mostrar alerta
    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="alert-close" onclick="this.closest('.alert').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(alert);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // Mostrar sucesso
    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    // Mostrar erro
    showError(message) {
        this.showAlert(message, 'error');
    }

    // Obter insights atuais
    getCurrentInsights() {
        return this.currentInsights;
    }

    // Obter padrões do usuário
    getUserPatterns() {
        return this.userPatterns;
    }

    // Obter recomendações
    getRecommendations() {
        return this.recommendations;
    }
}

// Inicializar gerenciador de insights
const insightsManager = new AIInsightsManager();

// Exportar para uso global
window.insightsManager = insightsManager;
