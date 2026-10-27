import InterfaceComponent from './interface.vue';

export default {
  id: 'map-latlong-picker',
  name: 'Map Lat/Long Picker',
  icon: 'map',
  description: 'Synchronous map and lat/long input',
  component: InterfaceComponent,
  options: null,
  types: ['geometry', 'json', 'string'],
};