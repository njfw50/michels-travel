// Sistema de Busca de Voos
class FlightSearchManager {
    constructor() {
        this.airports = [];
        this.suggestions = [];
        this.currentFocus = -1;
        this.searchHistory = [];
        this.init();
    }

    init() {
        this.setupSearchForm();
        this.setupAutocomplete();
        this.setupAdvancedFilters();
        this.loadSearchHistory();
        this.setupDatePickers();
        this.setupPassengerCounter();
    }

    // Configurar formulário de busca
    setupSearchForm() {
        const form = document.getElementById('search-form');
        if (!form) return;

        // Event listener para busca
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.performSearch();
        });

        // Event listeners para campos de origem e destino
        const originInput = document.getElementById('origin');
        const destinationInput = document.getElementById('destination');

        if (originInput) {
            originInput.addEventListener('input', (e) => {
                this.handleAirportInput(e.target, 'origin');
            });

            originInput.addEventListener('keydown', (e) => {
                this.handleSuggestionNavigation(e, 'origin');
            });
        }

        if (destinationInput) {
            destinationInput.addEventListener('input', (e) => {
                this.handleAirportInput(e.target, 'destination');
            });

            destinationInput.addEventListener('keydown', (e) => {
                this.handleSuggestionNavigation(e, 'destination');
            });
        }

        // Event listener para trocar origem/destino
        const swapBtn = document.getElementById('swap-airports');
        if (swapBtn) {
            swapBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.swapAirports();
            });
        }
    }

    // Configurar autocomplete
    setupAutocomplete() {
        // Carregar aeroportos
        this.loadAirports();

        // Event listeners para cliques fora das sugestões
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.suggestions-container')) {
                this.hideSuggestions();
            }
        });
    }

    // Carregar aeroportos
    async loadAirports() {
        try {
            const response = await fetch('/api/flights/airports/list');
            if (response.ok) {
                this.airports = await response.json();
            }
        } catch (error) {
            console.error('Erro ao carregar aeroportos:', error);
            // Usar dados mock em caso de erro
            this.airports = this.getMockAirports();
        }
    }

    // Obter aeroportos mock
    getMockAirports() {
        return [
            { code: 'GRU', name: 'Aeroporto Internacional de São Paulo/Guarulhos', city: 'São Paulo', country: 'Brasil' },
            { code: 'CGH', name: 'Aeroporto de Congonhas', city: 'São Paulo', country: 'Brasil' },
            { code: 'BSB', name: 'Aeroporto Internacional de Brasília', city: 'Brasília', country: 'Brasil' },
            { code: 'GIG', name: 'Aeroporto Internacional do Rio de Janeiro/Galeão', city: 'Rio de Janeiro', country: 'Brasil' },
            { code: 'SDU', name: 'Aeroporto Santos Dumont', city: 'Rio de Janeiro', country: 'Brasil' },
            { code: 'SSA', name: 'Aeroporto Internacional de Salvador', city: 'Salvador', country: 'Brasil' },
            { code: 'REC', name: 'Aeroporto Internacional do Recife', city: 'Recife', country: 'Brasil' },
            { code: 'FOR', name: 'Aeroporto Internacional de Fortaleza', city: 'Fortaleza', country: 'Brasil' },
            { code: 'BEL', name: 'Aeroporto Internacional de Belém', city: 'Belém', country: 'Brasil' },
            { code: 'MAO', name: 'Aeroporto Internacional de Manaus', city: 'Manaus', country: 'Brasil' },
            { code: 'CWB', name: 'Aeroporto Internacional de Curitiba', city: 'Curitiba', country: 'Brasil' },
            { code: 'POA', name: 'Aeroporto Internacional de Porto Alegre', city: 'Porto Alegre', country: 'Brasil' },
            { code: 'FLN', name: 'Aeroporto Internacional de Florianópolis', city: 'Florianópolis', country: 'Brasil' },
            { code: 'NAT', name: 'Aeroporto Internacional de Natal', city: 'Natal', country: 'Brasil' },
            { code: 'JPA', name: 'Aeroporto Internacional de João Pessoa', city: 'João Pessoa', country: 'Brasil' },
            { code: 'MCP', name: 'Aeroporto Internacional de Macapá', city: 'Macapá', country: 'Brasil' },
            { code: 'CGB', name: 'Aeroporto Internacional de Cuiabá', city: 'Cuiabá', country: 'Brasil' },
            { code: 'CGR', name: 'Aeroporto Internacional de Campo Grande', city: 'Campo Grande', country: 'Brasil' },
            { code: 'GYN', name: 'Aeroporto de Goiânia', city: 'Goiânia', country: 'Brasil' },
            { code: 'VIX', name: 'Aeroporto de Vitória', city: 'Vitória', country: 'Brasil' },
            { code: 'Uberlândia', name: 'Aeroporto de Uberlândia', city: 'Uberlândia', country: 'Brasil' },
            { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
            { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
            { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK' },
            { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
            { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
            { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain' },
            { code: 'BCN', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain' },
            { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
            { code: 'FCO', name: 'Leonardo da Vinci International Airport', city: 'Rome', country: 'Italy' },
            { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy' },
            { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
            { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria' },
            { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden' },
            { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark' },
            { code: 'OSL', name: 'Oslo Airport', city: 'Oslo', country: 'Norway' },
            { code: 'HEL', name: 'Helsinki Airport', city: 'Helsinki', country: 'Finland' },
            { code: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland' },
            { code: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic' },
            { code: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest', country: 'Hungary' },
            { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
            { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
            { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' },
            { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
            { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
            { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China' },
            { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
            { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea' },
            { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
            { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
            { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand' },
            { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada' },
            { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada' },
            { code: 'YUL', name: 'Montréal–Trudeau International Airport', city: 'Montreal', country: 'Canada' },
            { code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico' },
            { code: 'GDL', name: 'Guadalajara International Airport', city: 'Guadalajara', country: 'Mexico' },
            { code: 'MTY', name: 'Monterrey International Airport', city: 'Monterrey', country: 'Mexico' },
            { code: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia' },
            { code: 'MDE', name: 'José María Córdova International Airport', city: 'Medellín', country: 'Colombia' },
            { code: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru' },
            { code: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile' },
            { code: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina' },
            { code: 'MVD', name: 'Carrasco International Airport', city: 'Montevideo', country: 'Uruguay' },
            { code: 'ASU', name: 'Silvio Pettirossi International Airport', city: 'Asunción', country: 'Paraguay' }
        ];
    }

    // Lidar com input de aeroporto
    handleAirportInput(input, type) {
        const value = input.value.toLowerCase();
        
        if (value.length < 2) {
            this.hideSuggestions();
            return;
        }

        // Filtrar aeroportos
        this.suggestions = this.airports.filter(airport => 
            airport.code.toLowerCase().includes(value) ||
            airport.city.toLowerCase().includes(value) ||
            airport.name.toLowerCase().includes(value)
        ).slice(0, 8);

        this.showSuggestions(input, type);
    }

    // Mostrar sugestões
    showSuggestions(input, type) {
        this.hideSuggestions();

        if (this.suggestions.length === 0) return;

        const container = document.createElement('div');
        container.className = 'suggestions-container';
        container.id = `${type}-suggestions`;

        this.suggestions.forEach((airport, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <div class="suggestion-code">${airport.code}</div>
                <div class="suggestion-details">
                    <div class="suggestion-city">${airport.city}</div>
                    <div class="suggestion-name">${airport.name}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                this.selectAirport(input, airport, type);
            });

            item.addEventListener('mouseenter', () => {
                this.currentFocus = index;
                this.updateSuggestionFocus();
            });

            container.appendChild(item);
        });

        // Posicionar container
        const rect = input.getBoundingClientRect();
        container.style.position = 'absolute';
        container.style.top = `${rect.bottom + window.scrollY}px`;
        container.style.left = `${rect.left + window.scrollX}px`;
        container.style.width = `${rect.width}px`;
        container.style.zIndex = '1000';

        document.body.appendChild(container);
    }

    // Atualizar foco das sugestões
    updateSuggestionFocus() {
        const items = document.querySelectorAll('.suggestion-item');
        items.forEach((item, index) => {
            if (index === this.currentFocus) {
                item.classList.add('focused');
            } else {
                item.classList.remove('focused');
            }
        });
    }

    // Navegar pelas sugestões
    handleSuggestionNavigation(e, type) {
        const container = document.getElementById(`${type}-suggestions`);
        if (!container) return;

        const items = container.querySelectorAll('.suggestion-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.currentFocus = Math.min(this.currentFocus + 1, items.length - 1);
                this.updateSuggestionFocus();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.currentFocus = Math.max(this.currentFocus - 1, -1);
                this.updateSuggestionFocus();
                break;

            case 'Enter':
                e.preventDefault();
                if (this.currentFocus >= 0 && items[this.currentFocus]) {
                    const airport = this.suggestions[this.currentFocus];
                    const input = document.getElementById(type);
                    this.selectAirport(input, airport, type);
                }
                break;

            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    // Selecionar aeroporto
    selectAirport(input, airport, type) {
        input.value = `${airport.code} - ${airport.city}`;
        input.dataset.airportCode = airport.code;
        this.hideSuggestions();
        this.currentFocus = -1;

        // Validar se origem e destino são diferentes
        this.validateAirports();
    }

    // Validar aeroportos
    validateAirports() {
        const originInput = document.getElementById('origin');
        const destinationInput = document.getElementById('destination');
        const swapBtn = document.getElementById('swap-airports');

        if (originInput && destinationInput) {
            const originCode = originInput.dataset.airportCode;
            const destinationCode = destinationInput.dataset.airportCode;

            if (originCode && destinationCode && originCode === destinationCode) {
                this.showError('Origem e destino não podem ser iguais');
                destinationInput.value = '';
                destinationInput.dataset.airportCode = '';
            }
        }
    }

    // Trocar aeroportos
    swapAirports() {
        const originInput = document.getElementById('origin');
        const destinationInput = document.getElementById('destination');

        if (originInput && destinationInput) {
            const originValue = originInput.value;
            const originCode = originInput.dataset.airportCode;
            const destinationValue = destinationInput.value;
            const destinationCode = destinationInput.dataset.airportCode;

            originInput.value = destinationValue;
            originInput.dataset.airportCode = destinationCode;
            destinationInput.value = originValue;
            destinationInput.dataset.airportCode = originCode;
        }
    }

    // Esconder sugestões
    hideSuggestions() {
        const containers = document.querySelectorAll('.suggestions-container');
        containers.forEach(container => container.remove());
    }

    // Configurar filtros avançados
    setupAdvancedFilters() {
        const advancedToggle = document.getElementById('advanced-filters-toggle');
        const advancedSection = document.getElementById('advanced-filters');

        if (advancedToggle && advancedSection) {
            advancedToggle.addEventListener('click', () => {
                advancedSection.classList.toggle('show');
                const icon = advancedToggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        }

        // Configurar sliders de preço
        this.setupPriceSliders();
        
        // Configurar filtros de companhia aérea
        this.setupAirlineFilters();
        
        // Configurar filtros de horário
        this.setupTimeFilters();
    }

    // Configurar sliders de preço
    setupPriceSliders() {
        const priceSlider = document.getElementById('price-range');
        const priceValue = document.getElementById('price-value');

        if (priceSlider && priceValue) {
            priceSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                priceValue.textContent = `R$ ${value}`;
            });
        }
    }

    // Configurar filtros de companhia aérea
    setupAirlineFilters() {
        const airlineCheckboxes = document.querySelectorAll('input[name="airlines"]');
        
        airlineCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateActiveFilters();
            });
        });
    }

    // Configurar filtros de horário
    setupTimeFilters() {
        const timeCheckboxes = document.querySelectorAll('input[name="departure-time"]');
        
        timeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateActiveFilters();
            });
        });
    }

    // Atualizar filtros ativos
    updateActiveFilters() {
        const activeFilters = [];
        
        // Companhias aéreas
        const selectedAirlines = Array.from(document.querySelectorAll('input[name="airlines"]:checked'))
            .map(cb => cb.value);
        if (selectedAirlines.length > 0) {
            activeFilters.push(`${selectedAirlines.length} companhia(s)`);
        }

        // Horários
        const selectedTimes = Array.from(document.querySelectorAll('input[name="departure-time"]:checked'))
            .map(cb => cb.value);
        if (selectedTimes.length > 0) {
            activeFilters.push(`${selectedTimes.length} horário(s)`);
        }

        // Preço
        const priceSlider = document.getElementById('price-range');
        if (priceSlider && priceSlider.value < priceSlider.max) {
            activeFilters.push(`Até R$ ${priceSlider.value}`);
        }

        // Mostrar filtros ativos
        const activeFiltersContainer = document.getElementById('active-filters');
        if (activeFiltersContainer) {
            if (activeFilters.length > 0) {
                activeFiltersContainer.innerHTML = `
                    <div class="active-filters-list">
                        ${activeFilters.map(filter => `
                            <span class="active-filter">${filter}</span>
                        `).join('')}
                        <button class="clear-filters-btn" onclick="searchManager.clearAllFilters()">
                            <i class="fas fa-times"></i>
                            Limpar
                        </button>
                    </div>
                `;
                activeFiltersContainer.style.display = 'block';
            } else {
                activeFiltersContainer.style.display = 'none';
            }
        }
    }

    // Limpar todos os filtros
    clearAllFilters() {
        // Limpar companhias aéreas
        document.querySelectorAll('input[name="airlines"]').forEach(cb => {
            cb.checked = false;
        });

        // Limpar horários
        document.querySelectorAll('input[name="departure-time"]').forEach(cb => {
            cb.checked = false;
        });

        // Resetar preço
        const priceSlider = document.getElementById('price-range');
        if (priceSlider) {
            priceSlider.value = priceSlider.max;
            const priceValue = document.getElementById('price-value');
            if (priceValue) {
                priceValue.textContent = `R$ ${priceSlider.max}`;
            }
        }

        this.updateActiveFilters();
    }

    // Configurar seletores de data
    setupDatePickers() {
        const departureInput = document.getElementById('departure-date');
        const returnInput = document.getElementById('return-date');

        if (departureInput) {
            // Data mínima: hoje
            const today = new Date().toISOString().split('T')[0];
            departureInput.min = today;

            departureInput.addEventListener('change', () => {
                if (returnInput) {
                    returnInput.min = departureInput.value;
                    if (returnInput.value && returnInput.value < departureInput.value) {
                        returnInput.value = departureInput.value;
                    }
                }
            });
        }

        if (returnInput) {
            returnInput.addEventListener('change', () => {
                if (departureInput && returnInput.value < departureInput.value) {
                    this.showError('Data de retorno deve ser posterior à data de ida');
                    returnInput.value = '';
                }
            });
        }
    }

    // Configurar contador de passageiros
    setupPassengerCounter() {
        const passengersSelect = document.getElementById('passengers');
        if (!passengersSelect) return;

        // Adicionar opções de 1 a 9 passageiros
        for (let i = 1; i <= 9; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} ${i === 1 ? 'passageiro' : 'passageiros'}`;
            passengersSelect.appendChild(option);
        }
    }

    // Carregar histórico de busca
    loadSearchHistory() {
        const history = localStorage.getItem('searchHistory');
        if (history) {
            this.searchHistory = JSON.parse(history);
        }
    }

    // Salvar busca no histórico
    saveSearchToHistory(searchParams) {
        const search = {
            ...searchParams,
            timestamp: new Date().toISOString()
        };

        // Adicionar ao início do histórico
        this.searchHistory.unshift(search);

        // Manter apenas as últimas 10 buscas
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }

        // Salvar no localStorage
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    // Executar busca
    async performSearch() {
        const form = document.getElementById('search-form');
        if (!form) return;

        const formData = new FormData(form);
        const searchParams = this.buildSearchParams(formData);

        // Validar parâmetros obrigatórios
        if (!this.validateSearchParams(searchParams)) {
            return;
        }

        // Salvar no histórico
        this.saveSearchToHistory(searchParams);

        // Mostrar loading
        this.showSearchLoading();

        try {
            // Chamar API de busca
            const response = await fetch('/api/flights/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchParams)
            });

            if (response.ok) {
                const data = await response.json();
                this.handleSearchResults(data);
            } else {
                const errorData = await response.json();
                this.showError(errorData.message || 'Erro na busca');
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            this.showError('Erro de conexão. Tente novamente.');
        } finally {
            this.hideSearchLoading();
        }
    }

    // Construir parâmetros de busca
    buildSearchParams(formData) {
        const params = {
            origin: formData.get('origin')?.split(' - ')[0] || '',
            destination: formData.get('destination')?.split(' - ')[0] || '',
            departureDate: formData.get('departure-date') || '',
            returnDate: formData.get('return-date') || '',
            passengers: parseInt(formData.get('passengers')) || 1,
            cabinClass: formData.get('cabin-class') || 'economy',
            tripType: formData.get('trip-type') || 'round-trip'
        };

        // Adicionar filtros avançados
        const priceRange = document.getElementById('price-range');
        if (priceRange) {
            params.maxPrice = parseInt(priceRange.value);
        }

        const selectedAirlines = Array.from(document.querySelectorAll('input[name="airlines"]:checked'))
            .map(cb => cb.value);
        if (selectedAirlines.length > 0) {
            params.airlines = selectedAirlines;
        }

        const selectedTimes = Array.from(document.querySelectorAll('input[name="departure-time"]:checked'))
            .map(cb => cb.value);
        if (selectedTimes.length > 0) {
            params.departureTimes = selectedTimes;
        }

        return params;
    }

    // Validar parâmetros de busca
    validateSearchParams(params) {
        if (!params.origin) {
            this.showError('Por favor, selecione a origem');
            return false;
        }

        if (!params.destination) {
            this.showError('Por favor, selecione o destino');
            return false;
        }

        if (params.origin === params.destination) {
            this.showError('Origem e destino não podem ser iguais');
            return false;
        }

        if (!params.departureDate) {
            this.showError('Por favor, selecione a data de ida');
            return false;
        }

        if (params.tripType === 'round-trip' && !params.returnDate) {
            this.showError('Por favor, selecione a data de retorno');
            return false;
        }

        return true;
    }

    // Lidar com resultados da busca
    handleSearchResults(data) {
        // Navegar para seção de resultados
        window.flightSearchApp.navigateToSection('#results');

        // Atualizar estatísticas
        this.updateSearchStats(data.stats);

        // Renderizar resultados
        if (window.resultsManager) {
            window.resultsManager.displayResults(data.flights, data.pagination, data.insights);
        }

        // Mostrar insights da IA
        if (data.insights && window.insightsManager) {
            window.insightsManager.showSearchInsights(data.insights);
        }
    }

    // Atualizar estatísticas de busca
    updateSearchStats(stats) {
        const statsContainer = document.getElementById('search-stats');
        if (statsContainer && stats) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <i class="fas fa-plane"></i>
                    <span>${stats.totalFlights} voos encontrados</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-clock"></i>
                    <span>Busca em ${stats.searchTime}ms</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-dollar-sign"></i>
                    <span>Preços de R$ ${stats.minPrice} a R$ ${stats.maxPrice}</span>
                </div>
            `;
        }
    }

    // Mostrar loading da busca
    showSearchLoading() {
        const searchBtn = document.querySelector('#search-form button[type="submit"]');
        if (searchBtn) {
            searchBtn.disabled = true;
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        }

        // Mostrar overlay de loading
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'search-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <i class="fas fa-plane fa-spin"></i>
                <h3>Buscando voos...</h3>
                <p>Analisando ${this.airports.length} aeroportos e milhares de rotas</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    }

    // Esconder loading da busca
    hideSearchLoading() {
        const searchBtn = document.querySelector('#search-form button[type="submit"]');
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Buscar Voos';
        }

        // Remover overlay de loading
        const loadingOverlay = document.querySelector('.search-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    // Mostrar erro
    showError(message) {
        // Criar notificação de erro
        const notification = document.createElement('div');
        notification.className = 'notification notification-error';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Mostrar notificação
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Event listener para fechar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }

    // Obter aeroportos
    getAirports() {
        return this.airports;
    }

    // Obter histórico de busca
    getSearchHistory() {
        return this.searchHistory;
    }
}

// Inicializar gerenciador de busca
const searchManager = new FlightSearchManager();

// Exportar para uso global
window.searchManager = searchManager;
