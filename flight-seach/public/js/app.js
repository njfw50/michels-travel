console.log('JavaScript carregado!');

document.addEventListener('DOMContentLoaded', function () {
  console.log('Página carregada completamente!');

  const searchForm = document.getElementById('flightSearchForm');
  const resultsDiv = document.getElementById('flightResults');
  const tripTypeRadios = document.querySelectorAll('input[name="itineraryType"]');
  const simpleTripFields = document.getElementById('simpleTripFields');
  const returnDateWrapper = document.getElementById('returnDateWrapper');
  const multiCityFields = document.getElementById('multiCityFields');
  const segmentsContainer = document.getElementById('segmentsContainer');
  const addSegmentBtn = document.getElementById('addSegmentBtn');

  if (!searchForm) {
    return;
  }

  // UI: alternar entre tipos de viagem
  function getSelectedTripType() {
    const checked = document.querySelector('input[name="itineraryType"]:checked');
    return checked ? checked.value : 'ONE_WAY';
  }

  function updateTripTypeUI() {
    const type = getSelectedTripType();
    if (type === 'MULTI_CITY') {
      simpleTripFields.classList.add('d-none');
      multiCityFields.classList.remove('d-none');
      // Garante pelo menos 2 trechos
      if (segmentsContainer.children.length === 0) {
        addSegmentRow();
        addSegmentRow();
      }
    } else {
      simpleTripFields.classList.remove('d-none');
      multiCityFields.classList.add('d-none');
      // Mostrar/ocultar data de volta
      if (type === 'ROUND_TRIP') {
        returnDateWrapper.classList.remove('d-none');
      } else {
        returnDateWrapper.classList.add('d-none');
      }
    }
  }

  tripTypeRadios.forEach(r => r.addEventListener('change', updateTripTypeUI));
  updateTripTypeUI();

  // MultiCity: adicionar/remover trechos
  function addSegmentRow() {
    const index = segmentsContainer.children.length + 1;
    const row = document.createElement('div');
    row.className = 'segment row g-3 align-items-end';
    row.innerHTML = `
      <div class="col-md-4">
        <label class="form-label">Origem</label>
        <input type="text" class="form-control seg-origin" placeholder="Ex.: EWR" required>
      </div>
      <div class="col-md-4">
        <label class="form-label">Destino</label>
        <input type="text" class="form-control seg-destination" placeholder="Ex.: MCO" required>
      </div>
      <div class="col-md-3">
        <label class="form-label">Data</label>
        <input type="date" class="form-control seg-date" required>
      </div>
      <div class="col-md-1 d-grid">
        <button type="button" class="btn btn-outline-danger btn-sm seg-remove">Remover</button>
      </div>
    `;
    segmentsContainer.appendChild(row);

    const removeBtn = row.querySelector('.seg-remove');
    removeBtn.addEventListener('click', () => {
      // manter pelo menos 1 linha? Para multi-city, idealmente >= 2
      if (segmentsContainer.children.length > 1) {
        segmentsContainer.removeChild(row);
      }
    });
  }

  if (addSegmentBtn) {
    addSegmentBtn.addEventListener('click', addSegmentRow);
  }

  searchForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const itineraryType = getSelectedTripType();

    // Passageiros por faixa etária
    const infants02 = parseInt(document.getElementById('infants02').value || '0', 10);
    const children211 = parseInt(document.getElementById('children211').value || '0', 10);
    const adults11p = parseInt(document.getElementById('adults11p').value || '1', 10);
    const totalPassengers = Math.max(1, infants02 + children211 + adults11p);

    const fareClass = document.getElementById('fareClass').value;

    let params = { itineraryType, infants02, children211, adults11p, fareClass, passengers: totalPassengers };

    if (itineraryType === 'MULTI_CITY') {
      // Coletar segmentos
      const segments = Array.from(segmentsContainer.querySelectorAll('.segment')).map(seg => ({
        origin: seg.querySelector('.seg-origin').value.trim(),
        destination: seg.querySelector('.seg-destination').value.trim(),
        departureDate: seg.querySelector('.seg-date').value,
      })).filter(s => s.origin && s.destination && s.departureDate);

      if (segments.length < 2) {
        showError('Adicione pelo menos dois trechos para viagem multi-cidades.');
        return;
      }

      // Enviar segmentos como JSON
      params.segments = JSON.stringify(segments);
    } else {
      // ONE_WAY / ROUND_TRIP
      params.origin = document.getElementById('origin').value.trim();
      params.destination = document.getElementById('destination').value.trim();
      params.departureDate = document.getElementById('departureDate').value;
      const returnDateEl = document.getElementById('returnDate');
      if (itineraryType === 'ROUND_TRIP') {
        params.returnDate = returnDateEl ? returnDateEl.value : '';
      }
    }

    try {
      const usp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          usp.append(k, String(v));
        }
      });
      const queryString = usp.toString();
      const response = await fetch(`/api/flights/search?${queryString}`);
      if (!response.ok) {
        throw new Error('Falha na busca de voos');
      }
      const data = await response.json();
      if (data.flights) {
        displayFlights(data.flights);
      } else {
        showError('Nenhum resultado retornado.');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Erro ao buscar voos. Tente novamente.');
    }
  });

  function displayFlights(flights) {
    if (!flights || flights.length === 0) {
      resultsDiv.innerHTML = '<div class="alert alert-info">Nenhum voo encontrado.</div>';
      return;
    }

    const flightsHTML = flights
      .map(
        (flight) => `
            <div class="card">
              <div class="card-body">
                <div class="row align-items-center">
                  <div class="col-md-4">
                    <h5 class="card-title mb-0">${flight.airline.name}</h5>
                    <small class="text-muted">Voo ${flight.flightNumber}</small>
                  </div>
                  <div class="col-md-5">
                    <div class="d-flex justify-content-between">
                      <div class="text-center">
                        <strong>${flight.departure.airport}</strong>
                      </div>
                      <div class="text-center">
                        <i class="fas fa-plane"></i>
                      </div>
                      <div class="text-center">
                        <strong>${flight.arrival.airport}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 text-end">
                    <h5 class="mb-0">R$ ${flight.price}</h5>
                    <button class="btn btn-primary btn-sm mt-2">Selecionar</button>
                  </div>
                </div>
              </div>
            </div>`
      )
      .join('');

    resultsDiv.innerHTML = flightsHTML;
  }

  function showError(message) {
    resultsDiv.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
  }
});
