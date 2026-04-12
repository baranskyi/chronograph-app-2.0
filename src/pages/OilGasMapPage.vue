<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as topojson from 'topojson-client'
import {
  productionData,
  productionByNumeric,
  productionByIso3,
  countryNameAliases,
  getOilColor,
  getGasColor,
  totalOil,
  totalGas,
  type CountryProduction
} from '@/data/oilGasProduction'

const router = useRouter()

// State
const mapContainer = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const activeView = ref<'oil' | 'gas'>('oil')
const hoveredCountry = ref<CountryProduction | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const showRanking = ref(true)
const isMobile = ref(false)

let mapInstance: L.Map | null = null
let geoJsonLayer: L.GeoJSON | null = null

// Computed
const sortedByActive = computed(() => {
  return [...productionData]
    .filter(c => activeView.value === 'oil' ? c.oil > 0 : c.gas > 0)
    .sort((a, b) => {
      return activeView.value === 'oil' ? b.oil - a.oil : b.gas - a.gas
    })
})

const topProducers = computed(() => sortedByActive.value.slice(0, 20))

const totalValue = computed(() => activeView.value === 'oil' ? totalOil : totalGas)
const unitLabel = computed(() => activeView.value === 'oil' ? 'млн баррелей' : 'млрд м³')
const unitLabelShort = computed(() => activeView.value === 'oil' ? 'млн бр.' : 'млрд м³')

const legendSteps = computed(() => {
  if (activeView.value === 'oil') {
    return [
      { color: '#fef3c7', label: '< 50' },
      { color: '#fde68a', label: '50–200' },
      { color: '#fbbf24', label: '200–500' },
      { color: '#f59e0b', label: '500–1000' },
      { color: '#d97706', label: '1000–2000' },
      { color: '#b45309', label: '2000–3000' },
      { color: '#78350f', label: '> 3000' },
    ]
  }
  return [
    { color: '#cffafe', label: '< 10' },
    { color: '#a5f3fc', label: '10–30' },
    { color: '#22d3ee', label: '30–60' },
    { color: '#06b6d4', label: '60–100' },
    { color: '#0891b2', label: '100–200' },
    { color: '#0e7490', label: '200–500' },
    { color: '#164e63', label: '> 500' },
  ]
})

// Find production data by GeoJSON feature
function findProduction(feature: any): CountryProduction | null {
  // Try by numeric ID first
  const id = String(feature.id)
  const byNumeric = productionByNumeric.get(id)
  if (byNumeric) return byNumeric

  // Try by properties
  const props = feature.properties || {}
  const iso3 = props.ISO_A3 || props.iso_a3 || props.ADM0_A3 || props.adm0_a3
  if (iso3) {
    const byIso3 = productionByIso3.get(iso3)
    if (byIso3) return byIso3
  }

  // Try by name
  const name = props.NAME || props.name || props.ADMIN || props.admin
  if (name) {
    const aliasIso3 = countryNameAliases[name]
    if (aliasIso3) {
      return productionByIso3.get(aliasIso3) || null
    }
    // Direct name match
    const directMatch = productionData.find(c => c.name === name)
    if (directMatch) return directMatch
  }

  return null
}

// Style function for GeoJSON features
function getStyle(feature: any): L.PathOptions {
  const production = findProduction(feature)
  if (!production) {
    return {
      fillColor: '#1e293b',
      weight: 0.5,
      opacity: 0.6,
      color: '#334155',
      fillOpacity: 0.7,
    }
  }

  const value = activeView.value === 'oil' ? production.oil : production.gas
  const colorFn = activeView.value === 'oil' ? getOilColor : getGasColor
  const fillColor = colorFn(value)

  if (fillColor === 'transparent') {
    return {
      fillColor: '#1e293b',
      weight: 0.5,
      opacity: 0.6,
      color: '#334155',
      fillOpacity: 0.7,
    }
  }

  return {
    fillColor,
    weight: 1,
    opacity: 0.8,
    color: '#475569',
    fillOpacity: 0.85,
  }
}

// Highlight handlers
function highlightFeature(e: L.LeafletEvent) {
  const layer = e.target as L.Path
  const feature = (layer as any).feature
  const production = findProduction(feature)

  layer.setStyle({
    weight: 2,
    color: '#fff',
    fillOpacity: 0.95,
  })
  layer.bringToFront()

  if (production) {
    hoveredCountry.value = production
  }
}

function resetHighlight(e: L.LeafletEvent) {
  if (geoJsonLayer) {
    geoJsonLayer.resetStyle(e.target)
  }
  hoveredCountry.value = null
}

function onMouseMove(e: MouseEvent) {
  tooltipPosition.value = { x: e.clientX, y: e.clientY }
}

// Initialize map
async function initMap() {
  if (!mapContainer.value) return

  try {
    // Create map
    mapInstance = L.map(mapContainer.value, {
      center: [25, 15],
      zoom: 2.5,
      minZoom: 2,
      maxZoom: 7,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    })

    // Add zoom control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance)

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapInstance)

    // Add labels as separate layer on top
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      pane: 'shadowPane',
    }).addTo(mapInstance)

    // Fetch world TopoJSON data
    const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json')
    if (!response.ok) throw new Error('Failed to load map data')
    const topology = await response.json()

    // Convert to GeoJSON
    const geojson = topojson.feature(topology, topology.objects.countries) as any

    // Create GeoJSON layer
    geoJsonLayer = L.geoJSON(geojson, {
      style: getStyle,
      onEachFeature: (_feature, layer) => {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
        })
      }
    }).addTo(mapInstance)

    isLoading.value = false
  } catch (err: any) {
    loadError.value = err.message || 'Failed to load map'
    isLoading.value = false
  }
}

// Update styles when view changes
watch(activeView, () => {
  if (geoJsonLayer) {
    geoJsonLayer.setStyle(getStyle as any)
  }
})

// Format numbers with spaces as thousand separator
function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

// Percentage of total
function pct(value: number): string {
  return ((value / totalValue.value) * 100).toFixed(1)
}

// Check for mobile
function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) showRanking.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('mousemove', onMouseMove)
  initMap()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('mousemove', onMouseMove)
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div class="h-full flex flex-col" style="background: #0a0f1a; color: #e2e8f0;">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-2" style="padding: 12px 16px; background: #0f1520; border-bottom: 1px solid #1e293b;">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/')"
          class="flex items-center justify-center rounded-lg transition-colors"
          style="width: 36px; height: 36px; background: #1e293b;"
          title="На главную"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div>
          <h1 class="font-bold" style="font-size: 18px; line-height: 1.2;">
            <span style="margin-right: 6px;">{{ activeView === 'oil' ? '\u{1F6E2}' : '\u{1F525}' }}</span>
            {{ activeView === 'oil' ? 'Добыча нефти' : 'Добыча газа' }} — мир, 2025
          </h1>
          <p style="font-size: 12px; color: #64748b; margin-top: 2px;">
            Кумулятивные объёмы за 2025 год (оценка)
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- View toggle -->
        <div class="flex rounded-lg overflow-hidden" style="border: 1px solid #334155;">
          <button
            @click="activeView = 'oil'"
            class="transition-colors"
            :style="{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: activeView === 'oil' ? '#78350f' : 'transparent',
              color: activeView === 'oil' ? '#fbbf24' : '#94a3b8',
            }"
          >
            Нефть
          </button>
          <button
            @click="activeView = 'gas'"
            class="transition-colors"
            :style="{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: activeView === 'gas' ? '#164e63' : 'transparent',
              color: activeView === 'gas' ? '#22d3ee' : '#94a3b8',
            }"
          >
            Газ
          </button>
        </div>

        <!-- Ranking toggle -->
        <button
          @click="showRanking = !showRanking"
          class="flex items-center justify-center rounded-lg transition-colors"
          :style="{
            width: '36px',
            height: '36px',
            background: showRanking ? '#1e3a5f' : '#1e293b',
          }"
          title="Показать/скрыть рейтинг"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Map -->
      <div class="flex-1 relative">
        <div ref="mapContainer" class="absolute inset-0" />

        <!-- Loading overlay -->
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center"
          style="background: rgba(10, 15, 26, 0.9); z-index: 1000;"
        >
          <div class="text-center">
            <div class="inline-block rounded-full animate-spin" style="width: 40px; height: 40px; border: 3px solid #334155; border-top-color: #f59e0b;"></div>
            <p style="margin-top: 12px; color: #94a3b8; font-size: 14px;">Загрузка карты...</p>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="loadError"
          class="absolute inset-0 flex items-center justify-center"
          style="background: rgba(10, 15, 26, 0.9); z-index: 1000;"
        >
          <div class="text-center" style="max-width: 400px; padding: 24px;">
            <p style="color: #ef4444; font-size: 16px; font-weight: 600;">Ошибка загрузки</p>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">{{ loadError }}</p>
            <button
              @click="isLoading = true; loadError = ''; initMap()"
              style="margin-top: 16px; padding: 8px 20px; background: #1e3a5f; color: #93c5fd; border-radius: 8px; font-size: 14px;"
            >
              Повторить
            </button>
          </div>
        </div>

        <!-- Legend -->
        <div
          v-if="!isLoading && !loadError"
          class="absolute rounded-lg"
          style="bottom: 40px; left: 12px; z-index: 500; background: rgba(15, 21, 32, 0.92); backdrop-filter: blur(8px); padding: 12px 14px; border: 1px solid #1e293b;"
        >
          <p style="font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            {{ activeView === 'oil' ? 'Нефть (млн бр.)' : 'Газ (млрд м³)' }}
          </p>
          <div class="flex flex-col gap-1">
            <div
              v-for="step in legendSteps"
              :key="step.label"
              class="flex items-center gap-2"
            >
              <div
                class="rounded"
                :style="{ width: '16px', height: '12px', background: step.color }"
              />
              <span style="font-size: 11px; color: #cbd5e1;">{{ step.label }}</span>
            </div>
          </div>
        </div>

        <!-- Summary stats -->
        <div
          v-if="!isLoading && !loadError"
          class="absolute rounded-lg"
          style="top: 12px; left: 12px; z-index: 500; background: rgba(15, 21, 32, 0.92); backdrop-filter: blur(8px); padding: 12px 16px; border: 1px solid #1e293b;"
        >
          <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Мировая добыча 2025</p>
          <p class="font-bold" :style="{ fontSize: '22px', color: activeView === 'oil' ? '#fbbf24' : '#22d3ee', marginTop: '4px' }">
            {{ formatNumber(totalValue) }}
          </p>
          <p style="font-size: 12px; color: #94a3b8;">{{ unitLabel }}</p>
          <p style="font-size: 11px; color: #64748b; margin-top: 4px;">
            {{ sortedByActive.length }} стран-производителей
          </p>
        </div>

        <!-- Tooltip -->
        <Teleport to="body">
          <div
            v-if="hoveredCountry"
            class="fixed rounded-lg pointer-events-none"
            :style="{
              left: tooltipPosition.x + 16 + 'px',
              top: tooltipPosition.y - 10 + 'px',
              zIndex: 10000,
              background: 'rgba(15, 21, 32, 0.96)',
              backdropFilter: 'blur(8px)',
              padding: '10px 14px',
              border: '1px solid #334155',
              minWidth: '200px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }"
          >
            <p class="font-bold" style="font-size: 14px; color: #f1f5f9;">
              {{ hoveredCountry.nameRu }}
            </p>
            <p style="font-size: 11px; color: #64748b; margin-bottom: 8px;">{{ hoveredCountry.name }}</p>
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between gap-6">
                <span style="font-size: 12px; color: #94a3b8;">Нефть:</span>
                <span class="font-semibold" style="font-size: 13px; color: #fbbf24;">
                  {{ formatNumber(hoveredCountry.oil) }} млн бр.
                </span>
              </div>
              <div class="flex items-center justify-between gap-6">
                <span style="font-size: 12px; color: #94a3b8;">Добыча/день:</span>
                <span style="font-size: 12px; color: #e2e8f0;">
                  {{ formatNumber(hoveredCountry.oilDaily) }} тыс. бр/д
                </span>
              </div>
              <div style="height: 1px; background: #1e293b; margin: 4px 0;" />
              <div class="flex items-center justify-between gap-6">
                <span style="font-size: 12px; color: #94a3b8;">Газ:</span>
                <span class="font-semibold" style="font-size: 13px; color: #22d3ee;">
                  {{ formatNumber(hoveredCountry.gas) }} млрд м³
                </span>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <!-- Ranking panel -->
      <Transition name="slide">
        <div
          v-if="showRanking"
          class="overflow-hidden flex flex-col"
          :style="{
            width: isMobile ? '100%' : '320px',
            background: '#0f1520',
            borderLeft: '1px solid #1e293b',
            position: isMobile ? 'absolute' : 'relative',
            inset: isMobile ? '0' : undefined,
            zIndex: isMobile ? 600 : undefined,
          }"
        >
          <!-- Ranking header -->
          <div class="flex items-center justify-between" style="padding: 12px 16px; border-bottom: 1px solid #1e293b;">
            <h2 class="font-bold" style="font-size: 14px;">
              Топ-20 {{ activeView === 'oil' ? 'нефтедобытчиков' : 'газодобытчиков' }}
            </h2>
            <button
              v-if="isMobile"
              @click="showRanking = false"
              class="flex items-center justify-center"
              style="width: 28px; height: 28px; background: #1e293b; border-radius: 6px;"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Ranking list -->
          <div class="flex-1 overflow-y-auto scrollbar-thin" style="padding: 8px 0;">
            <div
              v-for="(country, index) in topProducers"
              :key="country.iso3"
              class="flex items-center gap-3 transition-colors cursor-default"
              :style="{
                padding: '8px 16px',
                background: hoveredCountry?.iso3 === country.iso3 ? 'rgba(255,255,255,0.05)' : 'transparent',
              }"
              @mouseenter="hoveredCountry = country"
              @mouseleave="hoveredCountry = null"
            >
              <!-- Rank -->
              <div
                class="flex items-center justify-center font-bold rounded"
                :style="{
                  width: '24px',
                  height: '24px',
                  fontSize: '11px',
                  background: index < 3 ? (activeView === 'oil' ? '#78350f' : '#164e63') : '#1e293b',
                  color: index < 3 ? (activeView === 'oil' ? '#fbbf24' : '#22d3ee') : '#64748b',
                }"
              >
                {{ index + 1 }}
              </div>

              <!-- Country info -->
              <div class="flex-1 min-w-0">
                <p class="font-semibold truncate" style="font-size: 13px; color: #e2e8f0;">
                  {{ country.nameRu }}
                </p>
                <div class="flex items-center gap-2" style="margin-top: 2px;">
                  <!-- Progress bar -->
                  <div class="flex-1 rounded-full overflow-hidden" style="height: 4px; background: #1e293b;">
                    <div
                      class="h-full rounded-full transition-all"
                      :style="{
                        width: pct(activeView === 'oil' ? country.oil : country.gas) + '%',
                        background: activeView === 'oil'
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : 'linear-gradient(90deg, #06b6d4, #0891b2)',
                        minWidth: '2px',
                      }"
                    />
                  </div>
                  <span style="font-size: 10px; color: #64748b; white-space: nowrap;">
                    {{ pct(activeView === 'oil' ? country.oil : country.gas) }}%
                  </span>
                </div>
              </div>

              <!-- Value -->
              <div class="text-right" style="min-width: 70px;">
                <p
                  class="font-bold"
                  :style="{ fontSize: '13px', color: activeView === 'oil' ? '#fbbf24' : '#22d3ee' }"
                >
                  {{ formatNumber(activeView === 'oil' ? country.oil : country.gas) }}
                </p>
                <p style="font-size: 10px; color: #64748b;">{{ unitLabelShort }}</p>
              </div>
            </div>
          </div>

          <!-- Total footer -->
          <div style="padding: 12px 16px; border-top: 1px solid #1e293b; background: #0c1018;">
            <div class="flex items-center justify-between">
              <span style="font-size: 12px; color: #64748b;">Мировой итого:</span>
              <span
                class="font-bold"
                :style="{ fontSize: '15px', color: activeView === 'oil' ? '#fbbf24' : '#22d3ee' }"
              >
                {{ formatNumber(totalValue) }} {{ unitLabelShort }}
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Leaflet overrides for dark theme */
:deep(.leaflet-container) {
  background: #0a0f1a;
  font-family: system-ui, -apple-system, sans-serif;
}

:deep(.leaflet-control-zoom) {
  border: 1px solid #334155 !important;
  border-radius: 8px !important;
  overflow: hidden;
}

:deep(.leaflet-control-zoom a) {
  background: rgba(15, 21, 32, 0.9) !important;
  color: #94a3b8 !important;
  border-color: #334155 !important;
  width: 32px !important;
  height: 32px !important;
  line-height: 32px !important;
  font-size: 16px !important;
}

:deep(.leaflet-control-zoom a:hover) {
  background: rgba(30, 41, 59, 0.95) !important;
  color: #e2e8f0 !important;
}

/* Slide transition for ranking panel */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Custom scrollbar for ranking */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 2px;
}
</style>
