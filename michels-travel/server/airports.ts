/**
 * Comprehensive worldwide airport database
 * This provides fallback data when Amadeus API doesn't return results
 */

export interface AirportData {
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
}

// Major worldwide airports database
export const AIRPORTS_DATABASE: AirportData[] = [
  // ============ BRAZIL ============
  { code: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo", country: "Brazil", countryCode: "BR" },
  { code: "GIG", name: "Rio de Janeiro/Galeão International Airport", city: "Rio de Janeiro", country: "Brazil", countryCode: "BR" },
  { code: "CGH", name: "São Paulo/Congonhas Airport", city: "São Paulo", country: "Brazil", countryCode: "BR" },
  { code: "SDU", name: "Rio de Janeiro/Santos Dumont Airport", city: "Rio de Janeiro", country: "Brazil", countryCode: "BR" },
  { code: "BSB", name: "Brasília International Airport", city: "Brasília", country: "Brazil", countryCode: "BR" },
  { code: "CNF", name: "Belo Horizonte/Confins International Airport", city: "Belo Horizonte", country: "Brazil", countryCode: "BR" },
  { code: "SSA", name: "Salvador International Airport", city: "Salvador", country: "Brazil", countryCode: "BR" },
  { code: "REC", name: "Recife/Guararapes International Airport", city: "Recife", country: "Brazil", countryCode: "BR" },
  { code: "FOR", name: "Fortaleza International Airport", city: "Fortaleza", country: "Brazil", countryCode: "BR" },
  { code: "POA", name: "Porto Alegre International Airport", city: "Porto Alegre", country: "Brazil", countryCode: "BR" },
  { code: "CWB", name: "Curitiba/Afonso Pena International Airport", city: "Curitiba", country: "Brazil", countryCode: "BR" },
  { code: "FLN", name: "Florianópolis International Airport", city: "Florianópolis", country: "Brazil", countryCode: "BR" },
  { code: "VCP", name: "Campinas/Viracopos International Airport", city: "Campinas", country: "Brazil", countryCode: "BR" },
  { code: "MAO", name: "Manaus/Eduardo Gomes International Airport", city: "Manaus", country: "Brazil", countryCode: "BR" },
  { code: "BEL", name: "Belém/Val de Cans International Airport", city: "Belém", country: "Brazil", countryCode: "BR" },
  { code: "NAT", name: "Natal/São Gonçalo do Amarante International Airport", city: "Natal", country: "Brazil", countryCode: "BR" },
  { code: "MCZ", name: "Maceió/Zumbi dos Palmares International Airport", city: "Maceió", country: "Brazil", countryCode: "BR" },
  { code: "VIX", name: "Vitória/Eurico de Aguiar Salles Airport", city: "Vitória", country: "Brazil", countryCode: "BR" },
  { code: "GYN", name: "Goiânia/Santa Genoveva Airport", city: "Goiânia", country: "Brazil", countryCode: "BR" },
  { code: "CGB", name: "Cuiabá/Marechal Rondon International Airport", city: "Cuiabá", country: "Brazil", countryCode: "BR" },

  // ============ PORTUGAL ============
  { code: "LIS", name: "Lisbon Humberto Delgado Airport", city: "Lisboa", country: "Portugal", countryCode: "PT" },
  { code: "OPO", name: "Porto Francisco Sá Carneiro Airport", city: "Porto", country: "Portugal", countryCode: "PT" },
  { code: "FAO", name: "Faro Airport", city: "Faro", country: "Portugal", countryCode: "PT" },
  { code: "FNC", name: "Madeira/Funchal Airport", city: "Funchal", country: "Portugal", countryCode: "PT" },
  { code: "PDL", name: "Ponta Delgada/João Paulo II Airport", city: "Ponta Delgada", country: "Portugal", countryCode: "PT" },

  // ============ SPAIN ============
  { code: "MAD", name: "Madrid Barajas International Airport", city: "Madrid", country: "Spain", countryCode: "ES" },
  { code: "BCN", name: "Barcelona El Prat Airport", city: "Barcelona", country: "Spain", countryCode: "ES" },
  { code: "PMI", name: "Palma de Mallorca Airport", city: "Palma de Mallorca", country: "Spain", countryCode: "ES" },
  { code: "AGP", name: "Málaga Costa del Sol Airport", city: "Málaga", country: "Spain", countryCode: "ES" },
  { code: "ALC", name: "Alicante-Elche Airport", city: "Alicante", country: "Spain", countryCode: "ES" },
  { code: "VLC", name: "Valencia Airport", city: "Valencia", country: "Spain", countryCode: "ES" },
  { code: "SVQ", name: "Seville Airport", city: "Seville", country: "Spain", countryCode: "ES" },
  { code: "BIO", name: "Bilbao Airport", city: "Bilbao", country: "Spain", countryCode: "ES" },
  { code: "TFS", name: "Tenerife South Airport", city: "Tenerife", country: "Spain", countryCode: "ES" },
  { code: "LPA", name: "Gran Canaria Airport", city: "Las Palmas", country: "Spain", countryCode: "ES" },

  // ============ UNITED STATES ============
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", countryCode: "US" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States", countryCode: "US" },
  { code: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "United States", countryCode: "US" },
  { code: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "United States", countryCode: "US" },
  { code: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States", countryCode: "US" },
  { code: "DEN", name: "Denver International Airport", city: "Denver", country: "United States", countryCode: "US" },
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "United States", countryCode: "US" },
  { code: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "United States", countryCode: "US" },
  { code: "MIA", name: "Miami International Airport", city: "Miami", country: "United States", countryCode: "US" },
  { code: "BOS", name: "Boston Logan International Airport", city: "Boston", country: "United States", countryCode: "US" },
  { code: "EWR", name: "Newark Liberty International Airport", city: "Newark", country: "United States", countryCode: "US" },
  { code: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", countryCode: "US" },
  { code: "MCO", name: "Orlando International Airport", city: "Orlando", country: "United States", countryCode: "US" },
  { code: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "United States", countryCode: "US" },
  { code: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", country: "United States", countryCode: "US" },
  { code: "LAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "United States", countryCode: "US" },
  { code: "MSP", name: "Minneapolis-Saint Paul International Airport", city: "Minneapolis", country: "United States", countryCode: "US" },
  { code: "DTW", name: "Detroit Metropolitan Airport", city: "Detroit", country: "United States", countryCode: "US" },
  { code: "PHL", name: "Philadelphia International Airport", city: "Philadelphia", country: "United States", countryCode: "US" },
  { code: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte", country: "United States", countryCode: "US" },
  { code: "FLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale", country: "United States", countryCode: "US" },
  { code: "BWI", name: "Baltimore/Washington International Airport", city: "Baltimore", country: "United States", countryCode: "US" },
  { code: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington D.C.", country: "United States", countryCode: "US" },
  { code: "IAD", name: "Washington Dulles International Airport", city: "Washington D.C.", country: "United States", countryCode: "US" },
  { code: "SAN", name: "San Diego International Airport", city: "San Diego", country: "United States", countryCode: "US" },
  { code: "TPA", name: "Tampa International Airport", city: "Tampa", country: "United States", countryCode: "US" },
  { code: "SLC", name: "Salt Lake City International Airport", city: "Salt Lake City", country: "United States", countryCode: "US" },
  { code: "PDX", name: "Portland International Airport", city: "Portland", country: "United States", countryCode: "US" },
  { code: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu", country: "United States", countryCode: "US" },
  { code: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin", country: "United States", countryCode: "US" },

  // ============ UNITED KINGDOM ============
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  { code: "LGW", name: "London Gatwick Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  { code: "STN", name: "London Stansted Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  { code: "LTN", name: "London Luton Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  { code: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", countryCode: "GB" },
  { code: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", countryCode: "GB" },
  { code: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom", countryCode: "GB" },
  { code: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", countryCode: "GB" },
  { code: "BRS", name: "Bristol Airport", city: "Bristol", country: "United Kingdom", countryCode: "GB" },
  { code: "LCY", name: "London City Airport", city: "London", country: "United Kingdom", countryCode: "GB" },

  // ============ FRANCE ============
  { code: "CDG", name: "Paris Charles de Gaulle Airport", city: "Paris", country: "France", countryCode: "FR" },
  { code: "ORY", name: "Paris Orly Airport", city: "Paris", country: "France", countryCode: "FR" },
  { code: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", countryCode: "FR" },
  { code: "LYS", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "France", countryCode: "FR" },
  { code: "MRS", name: "Marseille Provence Airport", city: "Marseille", country: "France", countryCode: "FR" },
  { code: "TLS", name: "Toulouse-Blagnac Airport", city: "Toulouse", country: "France", countryCode: "FR" },
  { code: "BOD", name: "Bordeaux-Mérignac Airport", city: "Bordeaux", country: "France", countryCode: "FR" },
  { code: "NTE", name: "Nantes Atlantique Airport", city: "Nantes", country: "France", countryCode: "FR" },

  // ============ GERMANY ============
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", countryCode: "DE" },
  { code: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", countryCode: "DE" },
  { code: "BER", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", countryCode: "DE" },
  { code: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Germany", countryCode: "DE" },
  { code: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Germany", countryCode: "DE" },
  { code: "CGN", name: "Cologne Bonn Airport", city: "Cologne", country: "Germany", countryCode: "DE" },
  { code: "STR", name: "Stuttgart Airport", city: "Stuttgart", country: "Germany", countryCode: "DE" },
  { code: "HAJ", name: "Hannover Airport", city: "Hannover", country: "Germany", countryCode: "DE" },

  // ============ ITALY ============
  { code: "FCO", name: "Rome Fiumicino Airport", city: "Rome", country: "Italy", countryCode: "IT" },
  { code: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "Italy", countryCode: "IT" },
  { code: "LIN", name: "Milan Linate Airport", city: "Milan", country: "Italy", countryCode: "IT" },
  { code: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "Italy", countryCode: "IT" },
  { code: "NAP", name: "Naples International Airport", city: "Naples", country: "Italy", countryCode: "IT" },
  { code: "BGY", name: "Milan Bergamo Airport", city: "Bergamo", country: "Italy", countryCode: "IT" },
  { code: "BLQ", name: "Bologna Guglielmo Marconi Airport", city: "Bologna", country: "Italy", countryCode: "IT" },
  { code: "FLR", name: "Florence Airport", city: "Florence", country: "Italy", countryCode: "IT" },
  { code: "PSA", name: "Pisa International Airport", city: "Pisa", country: "Italy", countryCode: "IT" },
  { code: "CIA", name: "Rome Ciampino Airport", city: "Rome", country: "Italy", countryCode: "IT" },

  // ============ NETHERLANDS ============
  { code: "AMS", name: "Amsterdam Schiphol Airport", city: "Amsterdam", country: "Netherlands", countryCode: "NL" },
  { code: "EIN", name: "Eindhoven Airport", city: "Eindhoven", country: "Netherlands", countryCode: "NL" },
  { code: "RTM", name: "Rotterdam The Hague Airport", city: "Rotterdam", country: "Netherlands", countryCode: "NL" },

  // ============ BELGIUM ============
  { code: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", countryCode: "BE" },
  { code: "CRL", name: "Brussels South Charleroi Airport", city: "Charleroi", country: "Belgium", countryCode: "BE" },

  // ============ SWITZERLAND ============
  { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", countryCode: "CH" },
  { code: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", countryCode: "CH" },
  { code: "BSL", name: "EuroAirport Basel-Mulhouse-Freiburg", city: "Basel", country: "Switzerland", countryCode: "CH" },

  // ============ AUSTRIA ============
  { code: "VIE", name: "Vienna International Airport", city: "Vienna", country: "Austria", countryCode: "AT" },
  { code: "SZG", name: "Salzburg Airport", city: "Salzburg", country: "Austria", countryCode: "AT" },
  { code: "INN", name: "Innsbruck Airport", city: "Innsbruck", country: "Austria", countryCode: "AT" },

  // ============ IRELAND ============
  { code: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", countryCode: "IE" },
  { code: "SNN", name: "Shannon Airport", city: "Shannon", country: "Ireland", countryCode: "IE" },
  { code: "ORK", name: "Cork Airport", city: "Cork", country: "Ireland", countryCode: "IE" },

  // ============ SCANDINAVIA ============
  { code: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", countryCode: "DK" },
  { code: "OSL", name: "Oslo Gardermoen Airport", city: "Oslo", country: "Norway", countryCode: "NO" },
  { code: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden", countryCode: "SE" },
  { code: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland", countryCode: "FI" },
  { code: "GOT", name: "Gothenburg Landvetter Airport", city: "Gothenburg", country: "Sweden", countryCode: "SE" },
  { code: "BGO", name: "Bergen Airport", city: "Bergen", country: "Norway", countryCode: "NO" },

  // ============ EASTERN EUROPE ============
  { code: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "Czech Republic", countryCode: "CZ" },
  { code: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland", countryCode: "PL" },
  { code: "KRK", name: "Kraków John Paul II International Airport", city: "Kraków", country: "Poland", countryCode: "PL" },
  { code: "BUD", name: "Budapest Ferenc Liszt International Airport", city: "Budapest", country: "Hungary", countryCode: "HU" },
  { code: "OTP", name: "Henri Coandă International Airport", city: "Bucharest", country: "Romania", countryCode: "RO" },
  { code: "SOF", name: "Sofia Airport", city: "Sofia", country: "Bulgaria", countryCode: "BG" },

  // ============ GREECE ============
  { code: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece", countryCode: "GR" },
  { code: "SKG", name: "Thessaloniki Airport", city: "Thessaloniki", country: "Greece", countryCode: "GR" },
  { code: "HER", name: "Heraklion International Airport", city: "Heraklion", country: "Greece", countryCode: "GR" },
  { code: "RHO", name: "Rhodes International Airport", city: "Rhodes", country: "Greece", countryCode: "GR" },
  { code: "JMK", name: "Mykonos Island National Airport", city: "Mykonos", country: "Greece", countryCode: "GR" },
  { code: "JTR", name: "Santorini Airport", city: "Santorini", country: "Greece", countryCode: "GR" },

  // ============ TURKEY ============
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", countryCode: "TR" },
  { code: "SAW", name: "Istanbul Sabiha Gökçen Airport", city: "Istanbul", country: "Turkey", countryCode: "TR" },
  { code: "AYT", name: "Antalya Airport", city: "Antalya", country: "Turkey", countryCode: "TR" },
  { code: "ESB", name: "Ankara Esenboğa Airport", city: "Ankara", country: "Turkey", countryCode: "TR" },
  { code: "ADB", name: "Izmir Adnan Menderes Airport", city: "Izmir", country: "Turkey", countryCode: "TR" },

  // ============ MIDDLE EAST ============
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE" },
  { code: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE" },
  { code: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar", countryCode: "QA" },
  { code: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel", countryCode: "IL" },
  { code: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "Jordan", countryCode: "JO" },
  { code: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt", countryCode: "EG" },
  { code: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia", countryCode: "SA" },
  { code: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia", countryCode: "SA" },
  { code: "KWI", name: "Kuwait International Airport", city: "Kuwait City", country: "Kuwait", countryCode: "KW" },
  { code: "BAH", name: "Bahrain International Airport", city: "Manama", country: "Bahrain", countryCode: "BH" },
  { code: "MCT", name: "Muscat International Airport", city: "Muscat", country: "Oman", countryCode: "OM" },

  // ============ ASIA ============
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", countryCode: "JP" },
  { code: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", countryCode: "JP" },
  { code: "KIX", name: "Kansai International Airport", city: "Osaka", country: "Japan", countryCode: "JP" },
  { code: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea", countryCode: "KR" },
  { code: "GMP", name: "Gimpo International Airport", city: "Seoul", country: "South Korea", countryCode: "KR" },
  { code: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "China", countryCode: "CN" },
  { code: "PKX", name: "Beijing Daxing International Airport", city: "Beijing", country: "China", countryCode: "CN" },
  { code: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China", countryCode: "CN" },
  { code: "SHA", name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: "China", countryCode: "CN" },
  { code: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China", countryCode: "CN" },
  { code: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", countryCode: "HK" },
  { code: "TPE", name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", countryCode: "TW" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", countryCode: "SG" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", countryCode: "TH" },
  { code: "DMK", name: "Don Mueang International Airport", city: "Bangkok", country: "Thailand", countryCode: "TH" },
  { code: "HKT", name: "Phuket International Airport", city: "Phuket", country: "Thailand", countryCode: "TH" },
  { code: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY" },
  { code: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia", countryCode: "ID" },
  { code: "DPS", name: "Ngurah Rai International Airport", city: "Bali", country: "Indonesia", countryCode: "ID" },
  { code: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines", countryCode: "PH" },
  { code: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN" },
  { code: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam", countryCode: "VN" },
  { code: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", countryCode: "IN" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India", countryCode: "IN" },
  { code: "BLR", name: "Kempegowda International Airport", city: "Bangalore", country: "India", countryCode: "IN" },
  { code: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India", countryCode: "IN" },
  { code: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India", countryCode: "IN" },

  // ============ OCEANIA ============
  { code: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", countryCode: "AU" },
  { code: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", countryCode: "AU" },
  { code: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", countryCode: "AU" },
  { code: "PER", name: "Perth Airport", city: "Perth", country: "Australia", countryCode: "AU" },
  { code: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "Australia", countryCode: "AU" },
  { code: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", countryCode: "NZ" },
  { code: "WLG", name: "Wellington International Airport", city: "Wellington", country: "New Zealand", countryCode: "NZ" },
  { code: "CHC", name: "Christchurch International Airport", city: "Christchurch", country: "New Zealand", countryCode: "NZ" },

  // ============ AFRICA ============
  { code: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg", country: "South Africa", countryCode: "ZA" },
  { code: "CPT", name: "Cape Town International Airport", city: "Cape Town", country: "South Africa", countryCode: "ZA" },
  { code: "DUR", name: "King Shaka International Airport", city: "Durban", country: "South Africa", countryCode: "ZA" },
  { code: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya", countryCode: "KE" },
  { code: "ADD", name: "Addis Ababa Bole International Airport", city: "Addis Ababa", country: "Ethiopia", countryCode: "ET" },
  { code: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria", countryCode: "NG" },
  { code: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "Morocco", countryCode: "MA" },
  { code: "RAK", name: "Marrakech Menara Airport", city: "Marrakech", country: "Morocco", countryCode: "MA" },
  { code: "TUN", name: "Tunis-Carthage International Airport", city: "Tunis", country: "Tunisia", countryCode: "TN" },
  { code: "ALG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria", countryCode: "DZ" },

  // ============ LATIN AMERICA ============
  { code: "MEX", name: "Mexico City International Airport", city: "Mexico City", country: "Mexico", countryCode: "MX" },
  { code: "CUN", name: "Cancún International Airport", city: "Cancún", country: "Mexico", countryCode: "MX" },
  { code: "GDL", name: "Guadalajara International Airport", city: "Guadalajara", country: "Mexico", countryCode: "MX" },
  { code: "MTY", name: "Monterrey International Airport", city: "Monterrey", country: "Mexico", countryCode: "MX" },
  { code: "SJO", name: "Juan Santamaría International Airport", city: "San José", country: "Costa Rica", countryCode: "CR" },
  { code: "PTY", name: "Tocumen International Airport", city: "Panama City", country: "Panama", countryCode: "PA" },
  { code: "BOG", name: "El Dorado International Airport", city: "Bogotá", country: "Colombia", countryCode: "CO" },
  { code: "MDE", name: "José María Córdova International Airport", city: "Medellín", country: "Colombia", countryCode: "CO" },
  { code: "CTG", name: "Rafael Núñez International Airport", city: "Cartagena", country: "Colombia", countryCode: "CO" },
  { code: "LIM", name: "Jorge Chávez International Airport", city: "Lima", country: "Peru", countryCode: "PE" },
  { code: "CUZ", name: "Alejandro Velasco Astete International Airport", city: "Cusco", country: "Peru", countryCode: "PE" },
  { code: "SCL", name: "Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile", countryCode: "CL" },
  { code: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina", countryCode: "AR" },
  { code: "AEP", name: "Jorge Newbery Airfield", city: "Buenos Aires", country: "Argentina", countryCode: "AR" },
  { code: "COR", name: "Ingeniero Aeronáutico Ambrosio L.V. Taravella International Airport", city: "Córdoba", country: "Argentina", countryCode: "AR" },
  { code: "MVD", name: "Carrasco International Airport", city: "Montevideo", country: "Uruguay", countryCode: "UY" },
  { code: "ASU", name: "Silvio Pettirossi International Airport", city: "Asunción", country: "Paraguay", countryCode: "PY" },
  { code: "VVI", name: "Viru Viru International Airport", city: "Santa Cruz", country: "Bolivia", countryCode: "BO" },
  { code: "LPB", name: "El Alto International Airport", city: "La Paz", country: "Bolivia", countryCode: "BO" },
  { code: "UIO", name: "Mariscal Sucre International Airport", city: "Quito", country: "Ecuador", countryCode: "EC" },
  { code: "GYE", name: "José Joaquín de Olmedo International Airport", city: "Guayaquil", country: "Ecuador", countryCode: "EC" },
  { code: "CCS", name: "Simón Bolívar International Airport", city: "Caracas", country: "Venezuela", countryCode: "VE" },

  // ============ CARIBBEAN ============
  { code: "HAV", name: "José Martí International Airport", city: "Havana", country: "Cuba", countryCode: "CU" },
  { code: "SJU", name: "Luis Muñoz Marín International Airport", city: "San Juan", country: "Puerto Rico", countryCode: "PR" },
  { code: "SDQ", name: "Las Américas International Airport", city: "Santo Domingo", country: "Dominican Republic", countryCode: "DO" },
  { code: "PUJ", name: "Punta Cana International Airport", city: "Punta Cana", country: "Dominican Republic", countryCode: "DO" },
  { code: "MBJ", name: "Sangster International Airport", city: "Montego Bay", country: "Jamaica", countryCode: "JM" },
  { code: "KIN", name: "Norman Manley International Airport", city: "Kingston", country: "Jamaica", countryCode: "JM" },
  { code: "NAS", name: "Lynden Pindling International Airport", city: "Nassau", country: "Bahamas", countryCode: "BS" },
  { code: "AUA", name: "Queen Beatrix International Airport", city: "Oranjestad", country: "Aruba", countryCode: "AW" },
  { code: "CUR", name: "Curaçao International Airport", city: "Willemstad", country: "Curaçao", countryCode: "CW" },
  { code: "BGI", name: "Grantley Adams International Airport", city: "Bridgetown", country: "Barbados", countryCode: "BB" },

  // ============ CANADA ============
  { code: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada", countryCode: "CA" },
  { code: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "Canada", countryCode: "CA" },
  { code: "YUL", name: "Montréal-Pierre Elliott Trudeau International Airport", city: "Montreal", country: "Canada", countryCode: "CA" },
  { code: "YYC", name: "Calgary International Airport", city: "Calgary", country: "Canada", countryCode: "CA" },
  { code: "YEG", name: "Edmonton International Airport", city: "Edmonton", country: "Canada", countryCode: "CA" },
  { code: "YOW", name: "Ottawa Macdonald-Cartier International Airport", city: "Ottawa", country: "Canada", countryCode: "CA" },
  { code: "YWG", name: "Winnipeg James Armstrong Richardson International Airport", city: "Winnipeg", country: "Canada", countryCode: "CA" },
  { code: "YHZ", name: "Halifax Stanfield International Airport", city: "Halifax", country: "Canada", countryCode: "CA" },

  // ============ RUSSIA ============
  { code: "SVO", name: "Sheremetyevo International Airport", city: "Moscow", country: "Russia", countryCode: "RU" },
  { code: "DME", name: "Domodedovo International Airport", city: "Moscow", country: "Russia", countryCode: "RU" },
  { code: "VKO", name: "Vnukovo International Airport", city: "Moscow", country: "Russia", countryCode: "RU" },
  { code: "LED", name: "Pulkovo Airport", city: "Saint Petersburg", country: "Russia", countryCode: "RU" },
];

/**
 * Search airports from local database
 */
export function searchLocalAirports(keyword: string): AirportData[] {
  if (!keyword || keyword.length < 2) return [];
  
  const searchTerm = keyword.toLowerCase().trim();
  
  // First, try exact code match
  const exactMatch = AIRPORTS_DATABASE.filter(
    airport => airport.code.toLowerCase() === searchTerm
  );
  
  if (exactMatch.length > 0) {
    return exactMatch;
  }
  
  // Then search by code, city, name, or country
  const results = AIRPORTS_DATABASE.filter(airport => {
    const code = airport.code.toLowerCase();
    const name = airport.name.toLowerCase();
    const city = airport.city.toLowerCase();
    const country = airport.country.toLowerCase();
    
    return (
      code.includes(searchTerm) ||
      city.includes(searchTerm) ||
      name.includes(searchTerm) ||
      country.includes(searchTerm)
    );
  });
  
  // Sort results: exact city match first, then by relevance
  results.sort((a, b) => {
    const aCity = a.city.toLowerCase();
    const bCity = b.city.toLowerCase();
    const aCode = a.code.toLowerCase();
    const bCode = b.code.toLowerCase();
    
    // Exact city match gets priority
    if (aCity === searchTerm && bCity !== searchTerm) return -1;
    if (bCity === searchTerm && aCity !== searchTerm) return 1;
    
    // Code starts with search term
    if (aCode.startsWith(searchTerm) && !bCode.startsWith(searchTerm)) return -1;
    if (bCode.startsWith(searchTerm) && !aCode.startsWith(searchTerm)) return 1;
    
    // City starts with search term
    if (aCity.startsWith(searchTerm) && !bCity.startsWith(searchTerm)) return -1;
    if (bCity.startsWith(searchTerm) && !aCity.startsWith(searchTerm)) return 1;
    
    return 0;
  });
  
  return results.slice(0, 15);
}

/**
 * Get airport by IATA code
 */
export function getAirportByCode(code: string): AirportData | undefined {
  return AIRPORTS_DATABASE.find(
    airport => airport.code.toLowerCase() === code.toLowerCase()
  );
}
