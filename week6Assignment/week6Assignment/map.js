var Main;

// ESM imports
import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import Graphic from "https://js.arcgis.com/4.33/@arcgis/core/Graphic.js";
import GraphicsLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/GraphicsLayer.js";
import ElevationLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/ElevationLayer.js";
import SceneView from "https://js.arcgis.com/4.33/@arcgis/core/views/SceneView.js";


// Wrap everything in IIFE
Main = (function() {

  const layer = new ElevationLayer({
    url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer" // https
  });

  const map = new Map({
    basemap: "hybrid",
    ground: { layers: [layer] }
  });

  let view; // create inside init

  const initMap = function(){
    // Create the SceneView after the DOM is ready
    view = new SceneView({
      container: "map",
      viewingMode: "global",
      map: map,
      camera: {
        position: { x: -105.503, y: 44.270, z: 20000000, spatialReference: { wkid: 4326 } },
        heading: 0,
        tilt: 0
      },
      popup: {
        dockEnabled: true,
        dockOptions: { breakpoint: false }
      },
      environment: { lighting: { directShadowsEnabled: false } }
    });

    const graphicsLayer = new GraphicsLayer({
      elevationInfo: { mode: "absolute-height" } // respects z
    });
    map.add(graphicsLayer);

    // define the WebStyleSymbol via autocast JSON
    const pinSymbol = {
      type: "web-style",
      name: "Pushpin 3",
      styleName: "EsriIconsStyle"
    };

    for (const [key, value] of Object.entries(window.myStuff)){  // note window.
      console.log(key, value);

      const point = {
        type: "point",
        longitude: value.coord[0], // use lon/lat in 3D
        latitude:  value.coord[1],
        z: 10000
      };

      const pinGraphic = new Graphic({
        geometry: point,
        symbol: pinSymbol,
        popupTemplate: {
          title: key + ": " + value.city + ", " + value.state
        }
      });

      graphicsLayer.add(pinGraphic);
    }
  };

  // Run after DOM is built so #map exists
  window.addEventListener("DOMContentLoaded", initMap);

  return {};
})();
