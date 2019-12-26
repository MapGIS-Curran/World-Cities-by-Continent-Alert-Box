require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/tasks/support/Query",
  "esri/widgets/Legend"
], function
   (Map, 
    MapView,
    FeatureLayer,
    SimpleMarkerSymbol,
    Query,
    Legend)
{
  var continent = prompt(
    "Please choose a continent and type the name to display the cities within it:",
    "Africa, Asia, Australia, Europe, Oceania, South America, or North America"
  );

  var continentWhere = "CONTINENT = '" + continent + "'";

  var defaultSym = {
    type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
    color: "#71de6e",
    outline: {
      // autocasts as new SimpleLineSymbol()
      color: "#71de6e",
      width: "0.5px"
    },
  };

  var colorVisVar = {
    type: "color",
    field: "POP",
    legendOptions: { title: "Population Per City By Color Ramp" },
    stops: [
      { value: 50000, color: "#f7fcfd" },
      { value: 100000, color: "#ccece6" },
      { value: 500000, color: "#66c2a4" },
      { value: 1000000, color: "#238b45" },
      { value: 5000000, color: "#006d2c" },
      { value: 10000001, color: "#00441b" }
    ]
  };

  var sizeVisVar = {
    type: "size",
    field: "POP",
    legendOptions: { title: "Population Per City By Point Size" },
    stops: [
      { value: 50000, size: 3, label: "< 50,000" },
      { value: 100000, size: 6, label: "50,000 - 100,000" },
      { value: 500000, size: 9, label: "250,000 - 500,000" },
      { value: 1000000, size: 12, label: "500,000 - 1,000,000" },
      { value: 5000000, size: 15, label: "1,000,000 - 5,000,000" },
      { value: 10000001, size: 20, label: "> 10,000,000" }
    ]
  };

  var renderer = {
    type: "simple", // autocasts as new SimpleRenderer()
    // Define a default marker symbol with a small outline
    symbol: defaultSym,
    // Set the color and size visual variables on the renderer
    visualVariables: [colorVisVar, sizeVisVar]
  };

  var cities = new FeatureLayer({
    url:
      "http://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0",
    visible: false
  });

  var continents = new FeatureLayer({
    url:
      "http://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/1",
    visible: false
  });

  var map = new Map({
    basemap: "dark-gray"
  });

  var view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 3,
    center: [0, 20]
  });

  map.addMany([continents, cities]);

  var continentQuery = new Query({
    where: continentWhere,
    returnGeometry: true
  });

  continents.when(function() {
    cities
      .when(function() {
        return continents.queryFeatures(continentQuery);
      })
      .then(locateCities);
  });

  function locateCities(chosenContinent) {
    var cityQuery = new Query({
      returnGeometry: true,
      spatialRelationship: "intersects",
      outFields: ["*"]
    });

    chosenContinent.features.forEach(function(cont) {
      cityQuery.geometry = cont.geometry;
      cities.queryFeatures(cityQuery).then(displayResults);
    });
  }

  function displayResults(results) {
    var featuredCities = new FeatureLayer({
      source: results.features,
      fields: results.fields,
      objectIdField: "OBJECTID",
      renderer: renderer,
      title: "Earth's Increasing Populations",
      popupTemplate: {
        // autocasts as new PopupTemplate()
        title: "World City Populations By Continent",
        content: "The total population of {CITY_NAME} is {POP}.",
        fieldInfos: [
          {
            fieldName: "POP",
            format: {
              digitSeparator: true,
              places: 0
            }
          }
        ]
      }
    });
    map.add(featuredCities);
  }

  view.ui.add(
    new Legend({
      view: view
    }),
    "top-right"
  );
});
