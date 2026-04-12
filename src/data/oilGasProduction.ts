// Cumulative oil and gas production by country for 2025
// Oil: million barrels (estimated annual total)
// Gas: billion cubic meters (estimated annual total)
// ISO numeric codes match world-atlas TopoJSON dataset

export interface CountryProduction {
  name: string
  nameRu: string
  iso3: string
  isoNumeric: string
  oil: number // million barrels per year
  gas: number // billion cubic meters per year
  oilDaily: number // thousand barrels per day (for display)
}

export const productionData: CountryProduction[] = [
  // North America
  { name: 'United States', nameRu: 'США', iso3: 'USA', isoNumeric: '840', oil: 4818, gas: 1050, oilDaily: 13200 },
  { name: 'Canada', nameRu: 'Канада', iso3: 'CAN', isoNumeric: '124', oil: 2117, gas: 185, oilDaily: 5800 },
  { name: 'Mexico', nameRu: 'Мексика', iso3: 'MEX', isoNumeric: '484', oil: 694, gas: 22, oilDaily: 1900 },

  // South America
  { name: 'Brazil', nameRu: 'Бразилия', iso3: 'BRA', isoNumeric: '076', oil: 1351, gas: 25, oilDaily: 3700 },
  { name: 'Venezuela', nameRu: 'Венесуэла', iso3: 'VEN', isoNumeric: '862', oil: 329, gas: 22, oilDaily: 900 },
  { name: 'Colombia', nameRu: 'Колумбия', iso3: 'COL', isoNumeric: '170', oil: 274, gas: 10, oilDaily: 750 },
  { name: 'Argentina', nameRu: 'Аргентина', iso3: 'ARG', isoNumeric: '032', oil: 292, gas: 45, oilDaily: 800 },
  { name: 'Ecuador', nameRu: 'Эквадор', iso3: 'ECU', isoNumeric: '218', oil: 175, gas: 1, oilDaily: 480 },
  { name: 'Trinidad and Tobago', nameRu: 'Тринидад и Тобаго', iso3: 'TTO', isoNumeric: '780', oil: 25, gas: 30, oilDaily: 70 },
  { name: 'Bolivia', nameRu: 'Боливия', iso3: 'BOL', isoNumeric: '068', oil: 18, gas: 12, oilDaily: 50 },
  { name: 'Peru', nameRu: 'Перу', iso3: 'PER', isoNumeric: '604', oil: 15, gas: 12, oilDaily: 40 },
  { name: 'Guyana', nameRu: 'Гайана', iso3: 'GUY', isoNumeric: '328', oil: 219, gas: 0, oilDaily: 600 },
  { name: 'Suriname', nameRu: 'Суринам', iso3: 'SUR', isoNumeric: '740', oil: 6, gas: 0, oilDaily: 16 },

  // Europe
  { name: 'Norway', nameRu: 'Норвегия', iso3: 'NOR', isoNumeric: '578', oil: 730, gas: 125, oilDaily: 2000 },
  { name: 'United Kingdom', nameRu: 'Великобритания', iso3: 'GBR', isoNumeric: '826', oil: 256, gas: 35, oilDaily: 700 },
  { name: 'Netherlands', nameRu: 'Нидерланды', iso3: 'NLD', isoNumeric: '528', oil: 7, gas: 5, oilDaily: 20 },
  { name: 'Romania', nameRu: 'Румыния', iso3: 'ROU', isoNumeric: '642', oil: 25, gas: 9, oilDaily: 68 },
  { name: 'Italy', nameRu: 'Италия', iso3: 'ITA', isoNumeric: '380', oil: 18, gas: 3, oilDaily: 50 },
  { name: 'Denmark', nameRu: 'Дания', iso3: 'DNK', isoNumeric: '208', oil: 27, gas: 3, oilDaily: 73 },

  // Middle East
  { name: 'Saudi Arabia', nameRu: 'Саудовская Аравия', iso3: 'SAU', isoNumeric: '682', oil: 3285, gas: 120, oilDaily: 9000 },
  { name: 'Iraq', nameRu: 'Ирак', iso3: 'IRQ', isoNumeric: '368', oil: 1643, gas: 15, oilDaily: 4500 },
  { name: 'United Arab Emirates', nameRu: 'ОАЭ', iso3: 'ARE', isoNumeric: '784', oil: 1460, gas: 55, oilDaily: 4000 },
  { name: 'Iran', nameRu: 'Иран', iso3: 'IRN', isoNumeric: '364', oil: 1168, gas: 260, oilDaily: 3200 },
  { name: 'Kuwait', nameRu: 'Кувейт', iso3: 'KWT', isoNumeric: '414', oil: 986, gas: 18, oilDaily: 2700 },
  { name: 'Qatar', nameRu: 'Катар', iso3: 'QAT', isoNumeric: '634', oil: 219, gas: 180, oilDaily: 600 },
  { name: 'Oman', nameRu: 'Оман', iso3: 'OMN', isoNumeric: '512', oil: 365, gas: 40, oilDaily: 1000 },
  { name: 'Bahrain', nameRu: 'Бахрейн', iso3: 'BHR', isoNumeric: '048', oil: 73, gas: 18, oilDaily: 200 },
  { name: 'Syria', nameRu: 'Сирия', iso3: 'SYR', isoNumeric: '760', oil: 15, gas: 3, oilDaily: 40 },
  { name: 'Yemen', nameRu: 'Йемен', iso3: 'YEM', isoNumeric: '887', oil: 18, gas: 1, oilDaily: 50 },

  // Africa
  { name: 'Nigeria', nameRu: 'Нигерия', iso3: 'NGA', isoNumeric: '566', oil: 511, gas: 45, oilDaily: 1400 },
  { name: 'Libya', nameRu: 'Ливия', iso3: 'LBY', isoNumeric: '434', oil: 438, gas: 12, oilDaily: 1200 },
  { name: 'Algeria', nameRu: 'Алжир', iso3: 'DZA', isoNumeric: '012', oil: 365, gas: 100, oilDaily: 1000 },
  { name: 'Angola', nameRu: 'Ангола', iso3: 'AGO', isoNumeric: '024', oil: 402, gas: 8, oilDaily: 1100 },
  { name: 'Egypt', nameRu: 'Египет', iso3: 'EGY', isoNumeric: '818', oil: 201, gas: 60, oilDaily: 550 },
  { name: 'Republic of the Congo', nameRu: 'Конго', iso3: 'COG', isoNumeric: '178', oil: 109, gas: 2, oilDaily: 300 },
  { name: 'Equatorial Guinea', nameRu: 'Экваториальная Гвинея', iso3: 'GNQ', isoNumeric: '226', oil: 37, gas: 6, oilDaily: 100 },
  { name: 'Gabon', nameRu: 'Габон', iso3: 'GAB', isoNumeric: '266', oil: 73, gas: 1, oilDaily: 200 },
  { name: 'South Sudan', nameRu: 'Южный Судан', iso3: 'SSD', isoNumeric: '728', oil: 55, gas: 0, oilDaily: 150 },
  { name: 'Ghana', nameRu: 'Гана', iso3: 'GHA', isoNumeric: '288', oil: 55, gas: 2, oilDaily: 150 },
  { name: 'Chad', nameRu: 'Чад', iso3: 'TCD', isoNumeric: '148', oil: 44, gas: 0, oilDaily: 120 },
  { name: 'Mozambique', nameRu: 'Мозамбик', iso3: 'MOZ', isoNumeric: '508', oil: 0, gas: 5, oilDaily: 0 },
  { name: 'Tanzania', nameRu: 'Танзания', iso3: 'TZA', isoNumeric: '834', oil: 0, gas: 2, oilDaily: 0 },

  // CIS / Central Asia
  { name: 'Russia', nameRu: 'Россия', iso3: 'RUS', isoNumeric: '643', oil: 3468, gas: 700, oilDaily: 9500 },
  { name: 'Kazakhstan', nameRu: 'Казахстан', iso3: 'KAZ', isoNumeric: '398', oil: 657, gas: 25, oilDaily: 1800 },
  { name: 'Azerbaijan', nameRu: 'Азербайджан', iso3: 'AZE', isoNumeric: '031', oil: 219, gas: 35, oilDaily: 600 },
  { name: 'Turkmenistan', nameRu: 'Туркменистан', iso3: 'TKM', isoNumeric: '795', oil: 73, gas: 85, oilDaily: 200 },
  { name: 'Uzbekistan', nameRu: 'Узбекистан', iso3: 'UZB', isoNumeric: '860', oil: 22, gas: 50, oilDaily: 60 },

  // Asia-Pacific
  { name: 'China', nameRu: 'Китай', iso3: 'CHN', isoNumeric: '156', oil: 1533, gas: 230, oilDaily: 4200 },
  { name: 'India', nameRu: 'Индия', iso3: 'IND', isoNumeric: '356', oil: 281, gas: 30, oilDaily: 770 },
  { name: 'Indonesia', nameRu: 'Индонезия', iso3: 'IDN', isoNumeric: '360', oil: 234, gas: 65, oilDaily: 640 },
  { name: 'Malaysia', nameRu: 'Малайзия', iso3: 'MYS', isoNumeric: '458', oil: 204, gas: 75, oilDaily: 560 },
  { name: 'Australia', nameRu: 'Австралия', iso3: 'AUS', isoNumeric: '036', oil: 120, gas: 155, oilDaily: 330 },
  { name: 'Thailand', nameRu: 'Таиланд', iso3: 'THA', isoNumeric: '764', oil: 77, gas: 30, oilDaily: 210 },
  { name: 'Vietnam', nameRu: 'Вьетнам', iso3: 'VNM', isoNumeric: '704', oil: 55, gas: 10, oilDaily: 150 },
  { name: 'Pakistan', nameRu: 'Пакистан', iso3: 'PAK', isoNumeric: '586', oil: 29, gas: 33, oilDaily: 80 },
  { name: 'Bangladesh', nameRu: 'Бангладеш', iso3: 'BGD', isoNumeric: '050', oil: 4, gas: 25, oilDaily: 10 },
  { name: 'Myanmar', nameRu: 'Мьянма', iso3: 'MMR', isoNumeric: '104', oil: 5, gas: 17, oilDaily: 14 },
  { name: 'Brunei', nameRu: 'Бруней', iso3: 'BRN', isoNumeric: '096', oil: 37, gas: 12, oilDaily: 100 },
  { name: 'Papua New Guinea', nameRu: 'Папуа-Новая Гвинея', iso3: 'PNG', isoNumeric: '598', oil: 15, gas: 10, oilDaily: 40 },
  { name: 'Japan', nameRu: 'Япония', iso3: 'JPN', isoNumeric: '392', oil: 4, gas: 2, oilDaily: 10 },
]

// Country name mapping from English (as in GeoJSON) to our data
// This handles various naming conventions in different GeoJSON sources
export const countryNameAliases: Record<string, string> = {
  'United States of America': 'USA',
  'United States': 'USA',
  'US': 'USA',
  'Russian Federation': 'RUS',
  'Russia': 'RUS',
  'Iran (Islamic Republic of)': 'IRN',
  'Iran, Islamic Rep.': 'IRN',
  'Korea, Republic of': 'KOR',
  'South Korea': 'KOR',
  'Venezuela (Bolivarian Republic of)': 'VEN',
  'Venezuela, RB': 'VEN',
  'Bolivia (Plurinational State of)': 'BOL',
  'Bolivia': 'BOL',
  'Viet Nam': 'VNM',
  'Vietnam': 'VNM',
  'Lao People\'s Democratic Republic': 'LAO',
  'Republic of the Congo': 'COG',
  'Congo': 'COG',
  'Dem. Rep. Congo': 'COD',
  'Democratic Republic of the Congo': 'COD',
  'Côte d\'Ivoire': 'CIV',
  'Ivory Coast': 'CIV',
  'Czech Republic': 'CZE',
  'Czechia': 'CZE',
  'Syrian Arab Republic': 'SYR',
  'Syria': 'SYR',
  'Myanmar': 'MMR',
  'Burma': 'MMR',
  'Brunei Darussalam': 'BRN',
  'Brunei': 'BRN',
  'Tanzania, United Republic of': 'TZA',
  'Tanzania': 'TZA',
  'S. Sudan': 'SSD',
  'South Sudan': 'SSD',
  'Eq. Guinea': 'GNQ',
  'Equatorial Guinea': 'GNQ',
}

// Build lookup maps for fast access
export const productionByIso3 = new Map<string, CountryProduction>()
export const productionByNumeric = new Map<string, CountryProduction>()

for (const country of productionData) {
  productionByIso3.set(country.iso3, country)
  productionByNumeric.set(country.isoNumeric, country)
}

// Summary statistics
export const totalOil = productionData.reduce((sum, c) => sum + c.oil, 0)
export const totalGas = productionData.reduce((sum, c) => sum + c.gas, 0)

// Top producers
export const topOilProducers = [...productionData].sort((a, b) => b.oil - a.oil).slice(0, 15)
export const topGasProducers = [...productionData].sort((a, b) => b.gas - a.gas).slice(0, 15)

// Color scales
export function getOilColor(value: number): string {
  if (value === 0) return 'transparent'
  if (value < 50) return '#fef3c7'    // amber-100
  if (value < 200) return '#fde68a'   // amber-200
  if (value < 500) return '#fbbf24'   // amber-400
  if (value < 1000) return '#f59e0b'  // amber-500
  if (value < 2000) return '#d97706'  // amber-600
  if (value < 3000) return '#b45309'  // amber-700
  return '#78350f'                     // amber-900
}

export function getGasColor(value: number): string {
  if (value === 0) return 'transparent'
  if (value < 10) return '#cffafe'    // cyan-100
  if (value < 30) return '#a5f3fc'    // cyan-200
  if (value < 60) return '#22d3ee'    // cyan-400
  if (value < 100) return '#06b6d4'   // cyan-500
  if (value < 200) return '#0891b2'   // cyan-600
  if (value < 500) return '#0e7490'   // cyan-700
  return '#164e63'                     // cyan-900
}
