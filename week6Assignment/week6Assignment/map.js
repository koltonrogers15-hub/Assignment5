var Main;

// ESM imports
import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import Graphic from "https://js.arcgis.com/4.33/@arcgis/core/Graphic.js";
import GraphicsLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/GraphicsLayer.js";
import ElevationLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/ElevationLayer.js";
import SceneView from "https://js.arcgis.com/4.33/@arcgis/core/views/SceneView.js";
import Search from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Search.js";
import SearchSource from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Search/SearchSource.js";
import Point from "https://js.arcgis.com/4.33/@arcgis/core/geometry/Point.js";
import Extent from "https://js.arcgis.com/4.33/@arcgis/core/geometry/Extent.js";

Main = (function () {
  const layer = new ElevationLayer({
    url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
  });

  const map = new Map({
    basemap: "hybrid",
    ground: { layers: [layer] }
  });

  let view;

  const initMap = function () {
    view = new SceneView({
      container: "map",
      viewingMode: "global",
      map: map,
      camera: {
        position: {
          x: -119.4179,
          y: 36.7783,
          z: 1500000,
          spatialReference: { wkid: 4326 }
        },
        heading: 0,
        tilt: 20
      },
      popup: {
        dockEnabled: true,
        dockOptions: { breakpoint: false }
      },
      environment: {
        lighting: { directShadowsEnabled: false }
      }
    });

    const graphicsLayer = new GraphicsLayer({
      elevationInfo: { mode: "absolute-height" }
    });
    map.add(graphicsLayer);

    const pinSymbol = {
      type: "web-style",
      name: "Pushpin 3",
      styleName: "EsriIconsStyle"
    };

    for (const [key, value] of Object.entries(window.myStuff)) {
      const point = {
        type: "point",
        longitude: value.coord[0],
        latitude: value.coord[1],
        z: 10000
      };

      const pinGraphic = new Graphic({
        geometry: point,
        symbol: pinSymbol,
        popupTemplate: {
          title: key + ":",
          content:
            "<span style='color:blue; font-weight:bold;'>City:</span> " +
            value.city +
            "<br><span style='color:green; font-weight:bold;'>State:</span> " +
            value.state
        }
      });

      graphicsLayer.add(pinGraphic);
    }

    // Click → zoom to the clicked POI + open popup
    view.on("click", async (event) => {
      const response = await view.hitTest(event, { include: graphicsLayer });
      if (response.results.length) {
        const graphic = response.results[0].graphic;

        view.goTo(
          {
            target: graphic.geometry,
            tilt: 20,
            scale: 100000
          },
          {
            duration: 1000,
            easing: "ease-in-out"
          }
        );

        view.popup.open({
          features: [graphic],
          location: graphic.geometry
        });
      }
    });

    // 15 cities across the U.S.
    const cities = [
      { name: "New York",        coords: [-74.0060, 40.7128] },
      { name: "Los Angeles",     coords: [-118.2437, 34.0522] },
      { name: "Chicago",         coords: [-87.6298, 41.8781] },
      { name: "Denver",          coords: [-104.9903, 39.7392] },
      { name: "Seattle",         coords: [-122.3321, 47.6062] },
      { name: "Miami",           coords: [-80.1918, 25.7617] },
      { name: "Dallas",          coords: [-96.7970, 32.7767] },
      { name: "Houston",         coords: [-95.3698, 29.7604] },
      { name: "Phoenix",         coords: [-112.0740, 33.4484] },
      { name: "San Francisco",   coords: [-122.4194, 37.7749] },
      { name: "Boston",          coords: [-71.0589, 42.3601] },
      { name: "Atlanta",         coords: [-84.3880, 33.7490] },
      { name: "Philadelphia",    coords: [-75.1652, 39.9526] },
      { name: "Las Vegas",       coords: [-115.1398, 36.1699] },
      { name: "Washington DC",   coords: [-77.0369, 38.9072] }
    ];

    // Custom SearchSource using the predefined list
 const citySource = {
  name: "Cities",
  placeholder: "Search for a city",
  getSuggestions: (params) => {
    const term = (params.suggestTerm ?? "").toLowerCase().trim();
    if (!term) return [];
    return cities
      .filter(c => c.name.toLowerCase().includes(term))
      .map(c => ({
        key: c.name,
        text: c.name,
        sourceIndex: 0  // 👈 required by widget internals
      }));
  },
  getResults: (params) => {
    const raw = params.suggestResult?.key
             ?? params.suggestResult?.text
             ?? params.searchTerm
             ?? "";
    const term = String(raw).toLowerCase().trim();

    const city = cities.find(c => c.name.toLowerCase() === term);
    if (!city) return Promise.resolve([]);

    const [lon, lat] = city.coords;
    const point = new Point({
      longitude: lon,
      latitude: lat,
      spatialReference: { wkid: 4326 }
    });

    const extent = new Extent({
      xmin: lon - 0.5, ymin: lat - 0.5,
      xmax: lon + 0.5, ymax: lat + 0.5,
      spatialReference: { wkid: 4326 }
    });

    return Promise.resolve([{
      extent,
      feature: new Graphic({ geometry: point }),
      name: city.name
    }]);
  }
};

// --- Search widget ---
const searchWidget = new Search({
  view,
  includeDefaultSources: false,
  sources: [citySource],
  popupEnabled: false,
  resultGraphicEnabled: false
});

view.ui.add(searchWidget, "top-right");

// --- Debugging events ---
searchWidget.on("search-start", () => console.log("Search started"));
searchWidget.on("search-complete", (e) => console.log("Search complete:", e));
searchWidget.on("select-result", (e) => console.log("Select result:", e));
  }; // <-- close initMap

  window.addEventListener("DOMContentLoaded", initMap);

  return {};
})();
