import '@testing-library/jest-dom';

// Mock OpenLayers
global.ol = {
  Map: () => ({
    setTarget: () => {},
    addLayer: () => {},
    addControl: () => {},
  }),
  View: () => ({
    setCenter: () => {},
    setZoom: () => {},
  }),
  layer: {
    Tile: () => ({
      setSource: () => {},
    }),
    Vector: () => ({
      setSource: () => {},
    }),
  },
  source: {
    OSM: () => ({}),
    Vector: () => ({}),
    XYZ: () => ({}),
  },
  proj: {
    fromLonLat: (coords) => coords,
  },
  control: {
    Zoom: () => ({}),
    ScaleLine: () => ({}),
    FullScreen: () => ({}),
    ZoomSlider: () => ({}),
    LayerSwitcher: () => ({}),
  },
  Feature: () => ({}),
  geom: {
    Point: () => ({}),
  },
  style: {
    Style: () => ({}),
    Circle: () => ({}),
    Fill: () => ({}),
    Stroke: () => ({}),
  },
};
