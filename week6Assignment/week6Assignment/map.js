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
  position: { 
    x: -119.4179,
    y: 36.7783,
    z: 1500000,    
    spatialReference: { wkid: 4326 }   // no extra comma needed here
  },
  heading: 0,
  tilt: 20,
  
},
      popup: {
        dockEnabled: true,
        dockOptions: { breakpoint: false }
      },
      environment: { lighting: { directShadowsEnabled: false }, 
    }
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
    title: key + ":",
    content: "<span style='color:blue; font-weight:bold;'>City:</span> " + value.city +
         "<br><span style='color:green; font-weight:bold;'>State:</span> " + value.state
  }
});

      graphicsLayer.add(pinGraphic);
    }
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







  };

  // Run after DOM is built so #map exists
  window.addEventListener("DOMContentLoaded", initMap);

  return {};
})();
