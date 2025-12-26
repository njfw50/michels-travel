// Sistema de Exibição de Resultados
class FlightResultsManager {
    constructor() {
        this.currentFlights = [];
        this.currentPagination = {};
        this.currentInsights = {};
        this.favorites = new Set();
        this.sortBy = 'price';
        this.sortOrder = 'asc';
        this.filters = {};
        this.init();
    }

    init() {
        this.setupResultsContainer();
        this.setupSorting();
        this.setupFilters();
        this.setupPricePanels();
        this.loadFavorites();
    }

    // Configurar container de resultados
    setupResultsContainer() {
        const resultsContainer = document.getElementById('flight-results');
        if (!resultsContainer) return;

        // Adicionar event listeners para interações
        resultsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.flight-card')) {
                const flightId = e.target.closest('.flight-card').dataset.flightId;
                this.showFlightDetails(flightId);
            }
        });
    }

    // Configurar ordenação
    setupSorting() {
        const sortSelect = document.getElementById('sort-results');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                this.sortBy = sortBy;
                this.sortOrder = sortOrder;
                this.sortAndDisplayResults();
            });
        }
    }

    // Configurar filtros
    setupFilters() {
        // Filtros de preço
        const priceFilters = document.querySelectorAll('input[name="price-filter"]');
        priceFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Filtros de companhia aérea
        const airlineFilters = document.querySelectorAll('input[name="airline-filter"]');
        airlineFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Filtros de horário
        const timeFilters = document.querySelectorAll('input[name="time-filter"]');
        timeFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    // Configurar painéis de preços
    setupPricePanels() {
        // Event listeners para painéis de preços dinâmicos
        document.addEventListener('click', (e) => {
            if (e.target.closest('.price-panel')) {
                const panel = e.target.closest('.price-panel');
                this.handlePricePanelClick(panel);
            }
        });
    }

    // Carregar favoritos
    loadFavorites() {
        if (window.authManager && window.authManager.isLoggedIn()) {
            // Carregar favoritos do usuário logado
            this.loadUserFavorites();
        } else {
            // Carregar favoritos do localStorage
            const localFavorites = localStorage.getItem('favorites');
            if (localFavorites) {
                this.favorites = new Set(JSON.parse(localFavorites));
            }
        }
    }

    // Carregar favoritos do usuário
    async loadUserFavorites() {
        try {
            const response = await fetch('/api/users/favorites', {
                headers: {
                    'Authorization': `Bearer ${window.authManager.getToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.favorites = new Set(data.favorites.map(f => f.flightId));
            }
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
        }
    }

    // Exibir resultados
    displayResults(flights, pagination, insights) {
        this.currentFlights = flights;
        this.currentPagination = pagination;
        this.currentInsights = insights;

        this.renderResults();
        this.renderPagination();
        this.renderInsights();
        this.updatePricePanels();
        this.setupPriceAlerts();
    }

    // Renderizar resultados
    renderResults() {
        const resultsContainer = document.getElementById('flight-results');
        if (!resultsContainer) return;

        if (this.currentFlights.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-plane-slash"></i>
                    <h3>Nenhum voo encontrado</h3>
                    <p>Tente ajustar seus filtros ou datas de viagem</p>
                    <button class="btn btn-primary" onclick="window.flightSearchApp.navigateToSection('#search')">
                        <i class="fas fa-search"></i>
                        Nova Busca
                    </button>
                </div>
            `;
            return;
        }

        // Ordenar voos
        const sortedFlights = this.sortFlights(this.currentFlights);

        // Renderizar cards de voo
        resultsContainer.innerHTML = sortedFlights.map(flight => 
            this.renderFlightCard(flight)
        ).join('');

        // Adicionar event listeners aos cards
        this.setupFlightCardEvents();
    }

    // Renderizar card de voo
    renderFlightCard(flight) {
        const isFavorite = this.favorites.has(flight.id);
        const priceClass = this.getPriceClass(flight.price.economy);
        const duration = this.formatDuration(flight.duration);
        const departureTime = this.formatTime(flight.departureTime);
        const arrivalTime = this.formatTime(flight.arrivalTime);

        return `
            <div class="flight-card ${priceClass}" data-flight-id="${flight.id}">
                <div class="flight-header">
                    <div class="airline-info">
                        <img src="${flight.airlineLogo || '/images/airline-default.png'}" alt="${flight.airline}" class="airline-logo">
                        <div class="airline-details">
                            <h4>${flight.airline}</h4>
                            <span class="flight-number">${flight.flightNumber}</span>
                        </div>
                    </div>
                    <div class="flight-actions">
                        <button class="btn-favorite ${isFavorite ? 'active' : ''}" onclick="resultsManager.toggleFavorite('${flight.id}', event)">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="btn-share" onclick="resultsManager.shareFlight('${flight.id}', event)">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>

                <div class="flight-route">
                    <div class="route-segment">
                        <div class="airport-code">${flight.origin.code}</div>
                        <div class="departure-time">${departureTime}</div>
                        <div class="airport-city">${flight.origin.city}</div>
                    </div>
                    
                    <div class="route-connection">
                        <div class="flight-duration">
                            <i class="fas fa-plane"></i>
                            <span>${duration}</span>
                        </div>
                        <div class="flight-line">
                            <div class="line-segment"></div>
                            <div class="plane-icon">✈</div>
                            <div class="line-segment"></div>
                        </div>
                        <div class="flight-type">
                            ${flight.stops === 0 ? 'Direto' : `${flight.stops} parada${flight.stops > 1 ? 's' : ''}`}
                        </div>
                    </div>

                    <div class="route-segment">
                        <div class="airport-code">${flight.destination.code}</div>
                        <div class="arrival-time">${arrivalTime}</div>
                        <div class="airport-city">${flight.destination.city}</div>
                    </div>
                </div>

                <div class="flight-pricing">
                    <div class="price-main">
                        <span class="price-currency">R$</span>
                        <span class="price-value">${flight.price.economy.toLocaleString()}</span>
                        <span class="price-per">por passageiro</span>
                    </div>
                    
                    <div class="price-breakdown">
                        <div class="price-class">
                            <span class="class-name">Econômica</span>
                            <span class="class-price">R$ ${flight.price.economy.toLocaleString()}</span>
                        </div>
                        ${flight.price.business ? `
                            <div class="price-class">
                                <span class="class-name">Executiva</span>
                                <span class="class-price">R$ ${flight.price.business.toLocaleString()}</span>
                            </div>
                        ` : ''}
                        ${flight.price.first ? `
                            <div class="price-class">
                                <span class="class-name">Primeira</span>
                                <span class="class-price">R$ ${flight.price.first.toLocaleString()}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="price-features">
                        ${flight.features.map(feature => `
                            <span class="feature-tag">${feature}</span>
                        `).join('')}
                    </div>
                </div>

                <div class="flight-footer">
                    <div class="flight-details">
                        <button class="btn btn-outline btn-sm" onclick="resultsManager.showFlightDetails('${flight.id}')">
                            <i class="fas fa-info-circle"></i>
                            Detalhes
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="resultsManager.selectFlight('${flight.id}')">
                            <i class="fas fa-check"></i>
                            Selecionar
                        </button>
                    </div>
                    
                    <div class="flight-extras">
                        ${flight.baggage ? `<span class="extra-info"><i class="fas fa-suitcase"></i> ${flight.baggage}</span>` : ''}
                        ${flight.meal ? `<span class="extra-info"><i class="fas fa-utensils"></i> ${flight.meal}</span>` : ''}
                        ${flight.wifi ? `<span class="extra-info"><i class="fas fa-wifi"></i> Wi-Fi</span>` : ''}
                    </div>
                </div>

                ${flight.alerts.length > 0 ? `
                    <div class="flight-alerts">
                        ${flight.alerts.map(alert => `
                            <div class="alert-item alert-${alert.type}">
                                <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                                <span>${alert.message}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Configurar eventos dos cards de voo
    setupFlightCardEvents() {
        const flightCards = document.querySelectorAll('.flight-card');
        
        flightCards.forEach(card => {
            // Hover effects
            card.addEventListener('mouseenter', () => {
                card.classList.add('hover');
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('hover');
            });

            // Click para expandir detalhes
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-favorite') && !e.target.closest('.btn-share')) {
                    const flightId = card.dataset.flightId;
                    this.showFlightDetails(flightId);
                }
            });
        });
    }

    // Renderizar paginação
    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer || !this.currentPagination) return;

        const { currentPage, totalPages, totalItems, itemsPerPage } = this.currentPagination;

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'block';

        let paginationHTML = `
            <div class="pagination-info">
                <span>Mostrando ${((currentPage - 1) * itemsPerPage) + 1} a ${Math.min(currentPage * itemsPerPage, totalItems)} de ${totalItems} voos</span>
            </div>
            <div class="pagination-controls">
        `;

        // Botão anterior
        if (currentPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="resultsManager.changePage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                    Anterior
                </button>
            `;
        }

        // Páginas numeradas
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="resultsManager.changePage(${i})">
                    ${i}
                </button>
            `;
        }

        // Botão próximo
        if (currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn" onclick="resultsManager.changePage(${currentPage + 1})">
                    Próximo
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        paginationHTML += '</div>';

        paginationContainer.innerHTML = paginationHTML;
    }

    // Renderizar insights
    renderInsights() {
        const insightsContainer = document.getElementById('ai-insights');
        if (!insightsContainer || !this.currentInsights) return;

        insightsContainer.innerHTML = `
            <div class="insights-header">
                <i class="fas fa-brain"></i>
                <h3>Insights da IA</h3>
            </div>
            <div class="insights-content">
                ${this.currentInsights.recommendations ? `
                    <div class="insight-section">
                        <h4><i class="fas fa-lightbulb"></i> Recomendações</h4>
                        <ul>
                            ${this.currentInsights.recommendations.map(rec => `
                                <li>${rec}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${this.currentInsights.priceTrends ? `
                    <div class="insight-section">
                        <h4><i class="fas fa-chart-line"></i> Tendências de Preço</h4>
                        <p>${this.currentInsights.priceTrends}</p>
                    </div>
                ` : ''}
                
                ${this.currentInsights.tips ? `
                    <div class="insight-section">
                        <h4><i class="fas fa-info-circle"></i> Dicas</h4>
                        <ul>
                            ${this.currentInsights.tips.map(tip => `
                                <li>${tip}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Atualizar painéis de preços
    updatePricePanels() {
        if (!this.currentFlights.length) return;

        // Calcular estatísticas de preço
        const prices = this.currentFlights.map(f => f.price.economy);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

        // Atualizar painéis de preço
        this.updatePricePanel('price-min', minPrice, 'Menor Preço');
        this.updatePricePanel('price-avg', avgPrice, 'Preço Médio');
        this.updatePricePanel('price-max', maxPrice, 'Maior Preço');

        // Atualizar gráfico de preços
        this.updatePriceChart();
    }

    // Atualizar painel de preço
    updatePricePanel(panelId, price, label) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        panel.innerHTML = `
            <div class="price-panel-content">
                <div class="price-label">${label}</div>
                <div class="price-value">R$ ${price.toLocaleString()}</div>
                <div class="price-trend">
                    <i class="fas fa-arrow-up"></i>
                    <span>+5% vs semana passada</span>
                </div>
            </div>
        `;
    }

    // Atualizar gráfico de preços
    updatePriceChart() {
        const chartContainer = document.getElementById('price-chart');
        if (!chartContainer) return;

        // Criar gráfico simples de preços
        const prices = this.currentFlights.map(f => f.price.economy).sort((a, b) => a - b);
        const priceRanges = this.groupPricesByRange(prices);

        chartContainer.innerHTML = `
            <div class="price-chart">
                <h4>Distribuição de Preços</h4>
                <div class="chart-bars">
                    ${priceRanges.map(range => `
                        <div class="chart-bar" style="height: ${range.count * 10}px">
                            <span class="bar-label">R$ ${range.min.toLocaleString()}</span>
                            <span class="bar-count">${range.count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Agrupar preços por faixa
    groupPricesByRange(prices) {
        if (prices.length === 0) return [];

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min;
        const step = Math.ceil(range / 5);

        const ranges = [];
        for (let i = 0; i < 5; i++) {
            const rangeMin = min + (i * step);
            const rangeMax = rangeMin + step;
            const count = prices.filter(p => p >= rangeMin && p < rangeMax).length;
            
            if (count > 0) {
                ranges.push({
                    min: rangeMin,
                    max: rangeMax,
                    count: count
                });
            }
        }

        return ranges;
    }

    // Configurar alertas de preço
    setupPriceAlerts() {
        const alertBtn = document.getElementById('setup-price-alert');
        if (alertBtn) {
            alertBtn.addEventListener('click', () => {
                this.showPriceAlertModal();
            });
        }
    }

    // Mostrar modal de alerta de preço
    showPriceAlertModal() {
        const modal = document.createElement('div');
        modal.className = 'modal price-alert-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-bell"></i> Configurar Alerta de Preço</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Receba notificações quando o preço baixar para esta rota.</p>
                    <div class="alert-form">
                        <div class="form-group">
                            <label>Preço desejado (R$)</label>
                            <input type="number" id="alert-price" placeholder="Ex: 500">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="alert-email" placeholder="seu@email.com">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="alert-notifications">
                                Receber notificações no navegador
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="resultsManager.setupPriceAlert()">
                        <i class="fas fa-bell"></i>
                        Configurar Alerta
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Configurar alerta de preço
    async setupPriceAlert() {
        const price = document.getElementById('alert-price').value;
        const email = document.getElementById('alert-email').value;
        const notifications = document.getElementById('alert-notifications').checked;

        if (!price || !email) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        try {
            const response = await fetch('/api/ai/predictions/price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    price: parseInt(price),
                    email: email,
                    notifications: notifications
                })
            });

            if (response.ok) {
                this.showSuccess('Alerta de preço configurado com sucesso!');
                document.querySelector('.price-alert-modal').remove();
            } else {
                this.showError('Erro ao configurar alerta');
            }
        } catch (error) {
            console.error('Erro ao configurar alerta:', error);
            this.showError('Erro ao configurar alerta');
        }
    }

    // Ordenar voos
    sortFlights(flights) {
        return flights.sort((a, b) => {
            let aValue, bValue;

            switch (this.sortBy) {
                case 'price':
                    aValue = a.price.economy;
                    bValue = b.price.economy;
                    break;
                case 'duration':
                    aValue = a.duration;
                    bValue = b.duration;
                    break;
                case 'departure':
                    aValue = new Date(a.departureTime);
                    bValue = new Date(b.departureTime);
                    break;
                case 'airline':
                    aValue = a.airline.toLowerCase();
                    bValue = b.airline.toLowerCase();
                    break;
                default:
                    aValue = a.price.economy;
                    bValue = b.price.economy;
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    // Aplicar filtros
    applyFilters() {
        const filteredFlights = this.currentFlights.filter(flight => {
            // Filtro de preço
            const priceFilters = document.querySelectorAll('input[name="price-filter"]:checked');
            if (priceFilters.length > 0) {
                const price = flight.price.economy;
                const passesPriceFilter = Array.from(priceFilters).some(filter => {
                    const [min, max] = filter.value.split('-').map(Number);
                    return price >= min && price <= max;
                });
                if (!passesPriceFilter) return false;
            }

            // Filtro de companhia aérea
            const airlineFilters = document.querySelectorAll('input[name="airline-filter"]:checked');
            if (airlineFilters.length > 0) {
                const passesAirlineFilter = Array.from(airlineFilters).some(filter => 
                    flight.airline.toLowerCase().includes(filter.value.toLowerCase())
                );
                if (!passesAirlineFilter) return false;
            }

            // Filtro de horário
            const timeFilters = document.querySelectorAll('input[name="time-filter"]:checked');
            if (timeFilters.length > 0) {
                const departureHour = new Date(flight.departureTime).getHours();
                const passesTimeFilter = Array.from(timeFilters).some(filter => {
                    const [min, max] = filter.value.split('-').map(Number);
                    return departureHour >= min && departureHour <= max;
                });
                if (!passesTimeFilter) return false;
            }

            return true;
        });

        this.displayFilteredResults(filteredFlights);
    }

    // Exibir resultados filtrados
    displayFilteredResults(filteredFlights) {
        const resultsContainer = document.getElementById('flight-results');
        if (!resultsContainer) return;

        if (filteredFlights.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-filter"></i>
                    <h3>Nenhum voo encontrado</h3>
                    <p>Tente ajustar seus filtros</p>
                    <button class="btn btn-outline" onclick="resultsManager.clearFilters()">
                        <i class="fas fa-times"></i>
                        Limpar Filtros
                    </button>
                </div>
            `;
            return;
        }

        const sortedFlights = this.sortFlights(filteredFlights);
        resultsContainer.innerHTML = sortedFlights.map(flight => 
            this.renderFlightCard(flight)
        ).join('');

        this.setupFlightCardEvents();
    }

    // Limpar filtros
    clearFilters() {
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        this.displayResults(this.currentFlights, this.currentPagination, this.currentInsights);
    }

    // Ordenar e exibir resultados
    sortAndDisplayResults() {
        this.displayResults(this.currentFlights, this.currentPagination, this.currentInsights);
    }

    // Mudar página
    async changePage(page) {
        try {
            const response = await fetch('/api/flights/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...this.currentSearchParams,
                    page: page
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.displayResults(data.flights, data.pagination, data.insights);
            }
        } catch (error) {
            console.error('Erro ao mudar página:', error);
        }
    }

    // Alternar favorito
    async toggleFavorite(flightId, event) {
        event.stopPropagation();

        if (!window.authManager || !window.authManager.isLoggedIn()) {
            this.showError('Faça login para salvar favoritos');
            return;
        }

        try {
            if (this.favorites.has(flightId)) {
                // Remover favorito
                const response = await fetch(`/api/users/favorites/${flightId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${window.authManager.getToken()}`
                    }
                });

                if (response.ok) {
                    this.favorites.delete(flightId);
                    event.target.closest('.btn-favorite').classList.remove('active');
                    this.showSuccess('Removido dos favoritos');
                }
            } else {
                // Adicionar favorito
                const flight = this.currentFlights.find(f => f.id === flightId);
                const response = await fetch('/api/users/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.authManager.getToken()}`
                    },
                    body: JSON.stringify({
                        flightId: flightId,
                        flightData: JSON.stringify(flight)
                    })
                });

                if (response.ok) {
                    this.favorites.add(flightId);
                    event.target.closest('.btn-favorite').classList.add('active');
                    this.showSuccess('Adicionado aos favoritos');
                }
            }
        } catch (error) {
            console.error('Erro ao alternar favorito:', error);
            this.showError('Erro ao atualizar favoritos');
        }
    }

    // Compartilhar voo
    shareFlight(flightId, event) {
        event.stopPropagation();
        
        const flight = this.currentFlights.find(f => f.id === flightId);
        if (!flight) return;

        const shareData = {
            title: `Voo ${flight.origin.code} → ${flight.destination.code}`,
            text: `Encontrei um voo por R$ ${flight.price.economy.toLocaleString()}!`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback: copiar para clipboard
            const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
            navigator.clipboard.writeText(shareText).then(() => {
                this.showSuccess('Link copiado para a área de transferência');
            });
        }
    }

    // Mostrar detalhes do voo
    showFlightDetails(flightId) {
        const flight = this.currentFlights.find(f => f.id === flightId);
        if (!flight) return;

        const modal = document.createElement('div');
        modal.className = 'modal flight-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plane"></i> Detalhes do Voo</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.renderFlightDetails(flight)}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Fechar</button>
                    <button class="btn btn-primary" onclick="resultsManager.selectFlight('${flightId}')">
                        <i class="fas fa-check"></i>
                        Selecionar Voo
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Renderizar detalhes do voo
    renderFlightDetails(flight) {
        return `
            <div class="flight-details">
                <div class="flight-route-details">
                    <div class="route-segment">
                        <h4>${flight.origin.code} - ${flight.origin.city}</h4>
                        <p>${flight.origin.name}</p>
                        <div class="departure-info">
                            <span class="time">${this.formatTime(flight.departureTime)}</span>
                            <span class="date">${this.formatDate(flight.departureTime)}</span>
                        </div>
                    </div>
                    
                    <div class="route-connection">
                        <div class="flight-info">
                            <span class="duration">${this.formatDuration(flight.duration)}</span>
                            <span class="stops">${flight.stops === 0 ? 'Direto' : `${flight.stops} parada${flight.stops > 1 ? 's' : ''}`}</span>
                        </div>
                        <div class="flight-line">
                            <div class="line"></div>
                            <div class="plane">✈</div>
                            <div class="line"></div>
                        </div>
                    </div>

                    <div class="route-segment">
                        <h4>${flight.destination.code} - ${flight.destination.city}</h4>
                        <p>${flight.destination.name}</p>
                        <div class="arrival-info">
                            <span class="time">${this.formatTime(flight.arrivalTime)}</span>
                            <span class="date">${this.formatDate(flight.arrivalTime)}</span>
                        </div>
                    </div>
                </div>

                <div class="flight-pricing-details">
                    <h4>Preços por Classe</h4>
                    <div class="pricing-table">
                        <div class="price-row">
                            <span class="class-name">Econômica</span>
                            <span class="price">R$ ${flight.price.economy.toLocaleString()}</span>
                        </div>
                        ${flight.price.business ? `
                            <div class="price-row">
                                <span class="class-name">Executiva</span>
                                <span class="price">R$ ${flight.price.business.toLocaleString()}</span>
                            </div>
                        ` : ''}
                        ${flight.price.first ? `
                            <div class="price-row">
                                <span class="class-name">Primeira</span>
                                <span class="price">R$ ${flight.price.first.toLocaleString()}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="flight-features">
                    <h4>Serviços Inclusos</h4>
                    <div class="features-list">
                        ${flight.features.map(feature => `
                            <span class="feature-tag">${feature}</span>
                        `).join('')}
                    </div>
                </div>

                ${flight.alerts.length > 0 ? `
                    <div class="flight-alerts-details">
                        <h4>Alertas</h4>
                        ${flight.alerts.map(alert => `
                            <div class="alert-item alert-${alert.type}">
                                <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                                <span>${alert.message}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Selecionar voo
    selectFlight(flightId) {
        const flight = this.currentFlights.find(f => f.id === flightId);
        if (!flight) return;

        // Salvar voo selecionado
        localStorage.setItem('selectedFlight', JSON.stringify(flight));
        
        // Navegar para checkout
        window.location.href = '/checkout.html';
    }

    // Lidar com clique no painel de preço
    handlePricePanelClick(panel) {
        const price = panel.querySelector('.price-value').textContent.replace(/[^\d]/g, '');
        const priceInput = document.getElementById('price-range');
        if (priceInput) {
            priceInput.value = price;
            priceInput.dispatchEvent(new Event('input'));
            this.applyFilters();
        }
    }

    // Utilitários
    getPriceClass(price) {
        if (price < 500) return 'price-low';
        if (price < 1000) return 'price-medium';
        return 'price-high';
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h${mins > 0 ? mins + 'min' : ''}`;
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    getAlertIcon(type) {
        const icons = {
            'info': 'info-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'success': 'check-circle'
        };
        return icons[type] || 'info-circle';
    }

    showSuccess(message) {
        // Implementar notificação de sucesso
        console.log('Sucesso:', message);
    }

    showError(message) {
        // Implementar notificação de erro
        console.error('Erro:', message);
    }
}

// Inicializar gerenciador de resultados
const resultsManager = new FlightResultsManager();

// Exportar para uso global
window.resultsManager = resultsManager;
