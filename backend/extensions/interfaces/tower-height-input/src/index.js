import InterfaceComponent from "./interface.vue";

export default {
  id: "tower-height-input",
  name: "Tower Height (1–999)",
  icon: "height",
  description: "Integer input restricted to one through three digits",
  component: InterfaceComponent,
  options: null,
  types: ["integer"],
};
