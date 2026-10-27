<template>
  <input
    ref="input"
    class="tower-height-input"
    type="text"
    inputmode="numeric"
    pattern="[0-9]*"
    maxlength="3"
    :value="value ?? ''"
    :disabled="disabled"
    aria-label="Tinggi menara (maksimal 999 meter)"
    @beforeinput="guardInput"
    @input="updateValue"
  />
</template>

<script>
export default {
  props: {
    value: { type: [Number, String], default: null },
    disabled: { type: Boolean, default: false },
  },
  emits: ["input"],
  methods: {
    guardInput(event) {
      const input = event.target;
      const inserted =
        event.data ?? event.dataTransfer?.getData("text/plain");
      if (typeof inserted !== "string") return;

      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      const nextValue =
        input.value.slice(0, start) + inserted + input.value.slice(end);

      if (!/^\d*$/.test(nextValue) || nextValue.length > 3) {
        event.preventDefault();
      }
    },
    updateValue(event) {
      const input = event.target;
      const digits = input.value.replace(/\D/g, "").slice(0, 3);
      input.value = digits;
      this.$emit("input", digits === "" ? null : Number(digits));
    },
  },
};
</script>

<style scoped>
.tower-height-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border-normal, #d3dae4);
  border-radius: var(--border-radius, 6px);
  background: var(--background-page, #fff);
  color: var(--foreground-normal, #172940);
  font: inherit;
}

.tower-height-input:focus {
  border-color: var(--primary, #6644ff);
  outline: 2px solid color-mix(in srgb, var(--primary, #6644ff) 20%, transparent);
}

.tower-height-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
