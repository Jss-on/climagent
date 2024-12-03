import '@testing-library/jest-dom';

// Mock OpenLayers
global.ol = {
  Map: jest.fn(),
  View: jest.fn(),
  layer: {
    Tile: jest.fn(),
    Vector: jest.fn(),
  },
  source: {
    OSM: jest.fn(),
    Vector: jest.fn(),
    XYZ: jest.fn(),
  },
  proj: {
    fromLonLat: jest.fn(),
  },
  control: {
    Zoom: jest.fn(),
    ScaleLine: jest.fn(),
    FullScreen: jest.fn(),
    ZoomSlider: jest.fn(),
    LayerSwitcher: jest.fn(),
  },
  Feature: jest.fn(),
  geom: {
    Point: jest.fn(),
  },
  style: {
    Style: jest.fn(),
    Circle: jest.fn(),
    Fill: jest.fn(),
    Stroke: jest.fn(),
  },
};
