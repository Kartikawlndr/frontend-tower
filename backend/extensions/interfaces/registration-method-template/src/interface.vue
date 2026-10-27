<template>
  <div class="registration-method">
    <select
      class="method-select"
      :value="value || ''"
      :disabled="disabled"
      @change="updateValue"
    >
      <option disabled value="">Pilih metode pendaftaran</option>
      <option value="Upload Document (.xlsx)">Upload Document (.xlsx)</option>
      <option value="Input Manual">Input Manual</option>
    </select>

    <a
      v-if="value === 'Upload Document (.xlsx)'"
      class="template-link"
      :href="templateUrl || '/bulk-tower-upload/template'"
      download
    >
      <svg class="template-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />
      </svg>
      Unduh template Excel
    </a>

    <div v-if="value === 'Upload Document (.xlsx)'" class="upload-controls">
      <input
        id="tower-workbook"
        ref="fileInput"
        class="file-input"
        type="file"
        aria-label="Pilih file Excel"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        :disabled="disabled || isProcessing"
        @change="selectFile"
      />
      <div class="file-picker">
        <label class="file-picker-button" for="tower-workbook">Pilih file Excel</label>
        <span class="file-name" :title="selectedFile?.name">
          {{ selectedFile ? selectedFile.name : "Belum ada file dipilih" }}
        </span>
      </div>
      <button
        v-if="selectedFile"
        class="process-button"
        type="button"
        :disabled="disabled || isProcessing"
        @click="processFile"
      >
        {{ isProcessing ? "Memeriksa dan mengirim..." : "Proses seluruh file" }}
      </button>
      <p v-if="successMessage" class="upload-success" role="status">
        {{ successMessage }} Jangan tekan tombol Save pada formulir ini; semua menara sudah tersimpan.
      </p>
      <div v-if="errors.length" class="upload-errors" role="alert">
        <strong>File ditolak. Tidak ada data yang disimpan.</strong>
        <ul>
          <li v-for="(error, index) in errors" :key="`${error.row}-${error.column}-${index}`">
            <template v-if="error.row">Baris {{ error.row }}<template v-if="error.column">, {{ error.column }}</template>: </template>
            {{ error.message }}
          </li>
        </ul>
      </div>
      <p v-if="generalError" class="upload-error" role="alert">{{ generalError }}</p>
    </div>

  </div>
</template>

<script>
import { ref } from "vue";
import { useApi } from "@directus/extensions-sdk";

export default {
  props: {
    value: { type: String, default: null },
    disabled: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) },
  },
  emits: ["input"],
  setup() {
    const api = useApi();
    const selectedFile = ref(null);
    const isProcessing = ref(false);
    const successMessage = ref("");
    const errors = ref([]);
    const generalError = ref("");

    return {
      api,
      selectedFile,
      isProcessing,
      successMessage,
      errors,
      generalError,
    };
  },
  computed: {
    templateUrl() {
      return this.options?.template_url || "";
    },
  },
  methods: {
    updateValue(event) {
      this.selectedFile = null;
      this.successMessage = "";
      this.errors = [];
      this.generalError = "";
      if (this.$refs.fileInput) this.$refs.fileInput.value = "";
      this.$emit("input", event.target.value);
    },
    selectFile(event) {
      this.selectedFile = event.target.files?.[0] || null;
      this.successMessage = "";
      this.errors = [];
      this.generalError = "";
    },
    async processFile() {
      if (!this.selectedFile || this.isProcessing) return;

      this.isProcessing = true;
      this.successMessage = "";
      this.errors = [];
      this.generalError = "";

      try {
        const form = new FormData();
        form.append("file", this.selectedFile);
        const fileResponse = await this.api.post("/files", form);
        const fileId = fileResponse.data?.data?.id;
        if (!fileId) throw new Error("Directus tidak mengembalikan ID file.");

        const result = await this.api.post("/bulk-tower-upload", { file_id: fileId });
        const count = result.data?.data?.created;
        this.successMessage = `${count} data menara berhasil disimpan dengan status Submitted.`;
        this.selectedFile = null;
      } catch (error) {
        const response = error.response?.data;
        if (Array.isArray(response?.errors)) {
          this.errors = response.errors;
        } else {
          const apiError = response?.errors?.[0];
          this.generalError =
            apiError?.message ||
            apiError?.extensions?.message ||
            response?.error ||
            error.message ||
            "Upload gagal. Coba lagi atau hubungi administrator.";
        }
      } finally {
        this.isProcessing = false;
      }
    },
  },
};
</script>

<style scoped>
.registration-method {
  display: grid;
  gap: 12px;
  color: var(--foreground-normal, #172940);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.method-select {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid var(--border-normal, #d3dce4);
  border-radius: var(--border-radius, 6px);
  background: var(--background-page, #fff);
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.template-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 8px;
  color: var(--theme--primary, #6644ff);
  font: inherit;
  font-weight: 600;
  text-decoration: none;
}

.template-link:hover {
  text-decoration: underline;
}

.template-icon {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.template-warning {
  margin: 0;
  color: var(--warning, #ad5c00);
}

.upload-controls {
  display: grid;
  gap: 8px;
  padding-top: 4px;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.file-input:focus-visible + .file-picker .file-picker-button {
  outline: 2px solid var(--theme--primary, #6644ff);
  outline-offset: 2px;
}

.file-picker {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.file-picker-button {
  display: inline-flex;
  min-height: 36px;
  flex: 0 0 auto;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid var(--border-normal, #d3dce4);
  border-radius: var(--border-radius, 6px);
  background: var(--background-page, #fff);
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.file-picker-button:hover {
  background: var(--background-subdued, #f2f2f5);
}

.file-name {
  overflow: hidden;
  color: var(--foreground-subdued, #637381);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.process-button {
  width: fit-content;
  min-height: 40px;
  padding: 8px 14px;
  border: 0;
  border-radius: var(--border-radius, 6px);
  background: var(--theme--primary, #6644ff);
  color: white;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  font-weight: 600;
  cursor: pointer;
}

.process-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.upload-success,
.upload-error,
.upload-errors {
  margin: 0;
}

.upload-success {
  color: var(--success, #16825d);
}

.upload-error,
.upload-errors {
  color: var(--danger, #b3261e);
}

.upload-errors ul {
  margin: 8px 0 0;
  padding-left: 20px;
}
</style>
