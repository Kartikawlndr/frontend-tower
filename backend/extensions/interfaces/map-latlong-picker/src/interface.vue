<template>
  <div class="map-picker-wrapper">
    <span class="field-hint instructions">
      Isi Longitude dan Latitude untuk memperbarui titik secara otomatis, atau tempel link/koordinat
      di atas lalu klik Pasang titik. Simpan data menggunakan tombol Save.
    </span>

    <!-- INPUT OPSIONAL UNTUK TAUTAN MAPS / PASANGAN KOORDINAT -->
    <div class="field-group">
      <label class="field-label">Tempel link / koordinat Google Maps</label>
      <div class="input-with-button">
        <input
          v-model="pasteInput"
          type="text"
          class="v-input"
          placeholder="-6.175392, 106.827153 atau link Google Maps"
          :disabled="disabled"
          @input="handlePasteInput"
          @keyup.enter="handlePastePoint"
        />
        <button
          type="button"
          class="btn-pasang"
          :class="isPointSet ? 'btn-active' : 'btn-inactive'"
          :disabled="disabled"
          :aria-pressed="isPointSet"
          @click="handlePastePoint"
        >
          {{ isPointSet ? 'Titik terpasang ✓' : 'Pasang titik' }}
        </button>
      </div>
      <span class="field-hint">
        Tombol Pasang titik hanya memproses nilai dari kolom ini.
      </span>
    </div>

    <!-- PETA LEAFLET -->
    <div ref="mapElement" class="map-container"></div>

    <!-- KOLOM MANUAL LONGITUDE & LATITUDE -->
    <div class="coords-grid">
      <div class="field-group">
        <label class="field-label">Longitude</label>
        <input
          v-model.number="lngValue"
          type="number"
          step="any"
          class="v-input"
          :disabled="disabled"
          placeholder="Contoh: 106.827153"
          @input="handleManualInput"
        />
        <span class="field-hint">Rentang Longitude: 95° BT – 141° BT</span>
      </div>

      <div class="field-group">
        <label class="field-label">Latitude</label>
        <input
          v-model.number="latValue"
          type="number"
          step="any"
          class="v-input"
          :disabled="disabled"
          placeholder="Contoh: -6.175392"
          @input="handleManualInput"
        />
        <span class="field-hint">Rentang Latitude: 11° LS – 6° LU</span>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icon marker Leaflet via CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default {
  props: {
    value: { type: Object, default: null },
    disabled: { type: Boolean, default: false },
  },
  emits: ['input'],
  setup(props, { emit }) {
    const mapElement = ref(null);
    const pasteInput = ref('');
    const latValue = ref(null);
    const lngValue = ref(null);
    const isPointSet = ref(false);
    const manualCoordinatesEdited = ref(false);

    let map = null;
    let marker = null;

    const defaultLat = -6.175392;
    const defaultLng = 106.827153;
    let lastValidPoint = null;

    const clearPoint = (clearCoordinates = true) => {
      if (marker && map) {
        map.removeLayer(marker);
        marker = null;
      }
      isPointSet.value = false;
      if (clearCoordinates) {
        latValue.value = null;
        lngValue.value = null;
        pasteInput.value = '';
      }
      if (map) {
        map.setView([defaultLat, defaultLng], 14);
      }
    };

    const applyValue = (value) => {
      const coordinates = value?.coordinates;
      if (
        value?.type !== 'Point' ||
        !Array.isArray(coordinates) ||
        coordinates.length < 2 ||
        !isValidPoint(coordinates[1], coordinates[0])
      ) {
        clearPoint();
        return;
      }

      const lat = Number(coordinates[1]);
      const lng = Number(coordinates[0]);
      latValue.value = lat;
      lngValue.value = lng;
      pasteInput.value = `${lat}, ${lng}`;
      lastValidPoint = { lat, lng };
      updateMarker(lat, lng, true);
      if (map) map.setView([lat, lng], map.getZoom());
    };

    // Parseling URL Google Maps / Pasangan Angka Koordinat
    const parseCoordinates = (text) => {
      if (!text) return null;
      const str = text.trim();

      // Google Maps links can encode coordinates in the map path or query.
      const urlPatterns = [
        /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
        /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
        /[?&](?:q|query|ll|center)=(-?\d+(?:\.\d+)?)(?:,|%2c|%20|\+)+(-?\d+(?:\.\d+)?)/i,
      ];
      for (const pattern of urlPatterns) {
        const match = str.match(pattern);
        if (match) {
          return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }
      }

      // Plain coordinate pair: "latitude, longitude" or "latitude longitude".
      const coordsRegex = /^\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)\s*$/;
      const coordsMatch = str.match(coordsRegex);
      if (coordsMatch) {
        return { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) };
      }

      return null;
    };

    const isValidPoint = (lat, lng) =>
      lat !== null &&
      lat !== undefined &&
      lat !== '' &&
      lng !== null &&
      lng !== undefined &&
      lng !== '' &&
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lng)) &&
      Number(lat) >= -11 &&
      Number(lat) <= 6 &&
      Number(lng) >= 95 &&
      Number(lng) <= 141;

    const roundCoordinate = (value) => Number(Number(value).toFixed(6));

    const handleMarkerDrag = (event) => {
      const { lat, lng } = event.target.getLatLng();
      if (!isValidPoint(lat, lng)) {
        if (lastValidPoint) marker.setLatLng([lastValidPoint.lat, lastValidPoint.lng]);
        alert('Koordinat harus berada di rentang Indonesia: longitude 95°–141° BT dan latitude 11° LS–6° LU.');
        return;
      }

      latValue.value = roundCoordinate(lat);
      lngValue.value = roundCoordinate(lng);
      pasteInput.value = `${latValue.value}, ${lngValue.value}`;
      lastValidPoint = { lat: latValue.value, lng: lngValue.value };
      manualCoordinatesEdited.value = true;
      isPointSet.value = false;
      emitPoint(latValue.value, lngValue.value);
    };

    const updateMarker = (lat, lng, draggable) => {
      if (!map) return;

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', handleMarkerDrag);
      }

      if (draggable) {
        marker.dragging.enable();
      } else {
        marker.dragging.disable();
      }
    };

    const previewPoint = (lat, lng) => {
      if (!isValidPoint(lat, lng)) {
        if (marker && map) {
          map.removeLayer(marker);
          marker = null;
        }
        return;
      }

      updateMarker(Number(lat), Number(lng), true);
      if (map) map.setView([Number(lat), Number(lng)], map.getZoom());
    };

    // Commit the draft only after the user confirms it.
    const setPoint = (lat, lng, syncPasteStr = false) => {
      if (!isValidPoint(lat, lng)) return false;

      const formattedLat = roundCoordinate(lat);
      const formattedLng = roundCoordinate(lng);

      // 1. Auto-fill kolom Longitude & Latitude di bawah
      latValue.value = formattedLat;
      lngValue.value = formattedLng;

      if (syncPasteStr) {
        pasteInput.value = `${formattedLat}, ${formattedLng}`;
      }

      // 2. Ubah state tombol setelah titik dari input paste dikonfirmasi
      isPointSet.value = true;

      // 3. Pasang marker terkunci & pindahkan fokus peta
      updateMarker(formattedLat, formattedLng, false);
      if (map) {
        map.setView([formattedLat, formattedLng], map.getZoom());
      }

      lastValidPoint = { lat: formattedLat, lng: formattedLng };
      emitPoint(formattedLat, formattedLng);
      manualCoordinatesEdited.value = false;
      return true;
    };

    const emitPoint = (lat, lng) => {
      emit('input', {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)],
      });
    };

    watch(
      () => props.value,
      (value) => {
        if (manualCoordinatesEdited.value) return;
        applyValue(value);
      },
      { deep: true }
    );

    // Handler Tombol Pasang Titik
    const handlePastePoint = () => {
      const parsed = parseCoordinates(pasteInput.value);
      if (parsed) {
        if (!setPoint(parsed.lat, parsed.lng, false)) {
          alert('Koordinat harus berada di rentang Indonesia: longitude 95°–141° BT dan latitude 11° LS–6° LU.');
        }
      } else if (pasteInput.value.trim()) {
        alert('Koordinat atau link Google Maps tidak valid!');
      } else {
        alert('Tempel link Google Maps atau pasangan koordinat terlebih dahulu.');
      }
    };

    // Handler Ketik Manual
    const handleManualInput = () => {
      manualCoordinatesEdited.value = true;
      isPointSet.value = false;
      if (isValidPoint(latValue.value, lngValue.value)) {
        const lat = roundCoordinate(latValue.value);
        const lng = roundCoordinate(lngValue.value);
        latValue.value = lat;
        lngValue.value = lng;
        pasteInput.value = `${lat}, ${lng}`;
        lastValidPoint = { lat, lng };
        previewPoint(lat, lng);
        emitPoint(lat, lng);
      } else {
        pasteInput.value = '';
        previewPoint(null, null);
        emit('input', null);
      }
    };

    const handlePasteInput = () => {
      manualCoordinatesEdited.value = false;
      isPointSet.value = false;
      const coordinates = parseCoordinates(pasteInput.value);
      if (coordinates) {
        const lat = roundCoordinate(coordinates.lat);
        const lng = roundCoordinate(coordinates.lng);
        latValue.value = lat;
        lngValue.value = lng;
        pasteInput.value = `${lat}, ${lng}`;
        previewPoint(lat, lng);
      } else if (!pasteInput.value.trim()) {
        latValue.value = null;
        lngValue.value = null;
        previewPoint(null, null);
        emit('input', null);
      }
    };

    onMounted(() => {
      map = L.map(mapElement.value).setView([defaultLat, defaultLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      applyValue(props.value);
    });

    onBeforeUnmount(() => {
      if (map) map.remove();
    });

    return {
      mapElement,
      pasteInput,
      latValue,
      lngValue,
      isPointSet,
      manualCoordinatesEdited,
      handlePastePoint,
      handleManualInput,
      handlePasteInput,
    };
  },
};
</script>

<style scoped>
.map-picker-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--theme--foreground);
}

.field-hint {
  font-size: 12px;
  color: var(--theme--foreground-subdued);
}

.instructions {
  line-height: 1.5;
}

.input-with-button {
  display: flex;
  gap: 8px;
}

.v-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--theme--form--field--input--border-color, #cbd5e1);
  border-radius: var(--theme--border-radius, 6px);
  background-color: var(--theme--form--field--input--background, #ffffff);
  color: var(--theme--foreground);
  font-size: 14px;
  outline: none;
}

.v-input::placeholder {
  color: #a8b1bf;
  opacity: 1;
}

.btn-pasang {
  padding: 10px 18px !important;
  border-radius: var(--theme--border-radius, 6px) !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: all 0.2s ease-in-out !important;
}

/* WARNA SEBELUM DIKLIK: PUTIH */
.btn-inactive {
  background-color: #ffffff !important;
  color: #334155 !important;
  border: 1px solid #cbd5e1 !important;
}

.btn-inactive:hover {
  background-color: #f8fafc !important;
  border-color: #94a3b8 !important;
}

/* WARNA SETELAH DIKLIK: BIRU */
.btn-active {
  background-color: #2563eb !important;
  color: #ffffff !important;
  border: 1px solid #2563eb !important;
}

.map-container {
  width: 100%;
  height: 380px;
  border-radius: var(--theme--border-radius, 8px);
  border: 1px solid var(--theme--form--field--input--border-color, #cbd5e1);
  z-index: 1;
}

.coords-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .coords-grid {
    grid-template-columns: 1fr;
  }

  .input-with-button {
    flex-direction: column;
  }

  .btn-pasang {
    width: 100%;
  }
}
</style>