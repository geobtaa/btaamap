var stateJSON;
var countyJSON;
var cityJSON;
var legendJSON;
var mymap;
var lyrActiveStates;
var lyrActiveCities;
var lyrActiveCounties;
var lyrFilterStates;
var lyrFilterCounties;
var lyrFilterCities;
var paletteCounties;
var intervalCounties;
var paneCities;
var paneCounties;
var paneStates;
var popupTable;
var legendPanel;
var infoPanel;
var styleCounties;
var styleCities;
var dropdownCounties;
var dropdownCities;
var filterCounties = [];
var filterCities = [];
var intervalCounties = [];
var paletteCounties = [];
var intervalCities = [];
var sizeCities = [];
var aboutContainer;

$(document).ready(function () {
  /********** File Path **********/
  stateJSON =
    "https://btaa-geospatial-data-project.github.io/btaamap/json/activeStates.topo.json";
  countyJSON =
    "https://btaa-geospatial-data-project.github.io/btaamap/json/activeCounties.topo.json";
  cityJSON =
    "https://btaa-geospatial-data-project.github.io/btaamap/json/activeCities.json";
  legendJSON =
    "https://btaa-geospatial-data-project.github.io/btaamap/json/legend.json";

  /********** Map Initialization **********/
  mymap = L.map("mapdiv").setView([43, -84], 5);
  L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={access_token}",
    {
      maxZoom: 7,
      minZoom: 5,
      id: "yjzhou0303/ckjxmot7v1m1u18mwlwamsfkc",
      tileSize: 512,
      access_token:
        "pk.eyJ1IjoieWp6aG91MDMwMyIsImEiOiJja2ZwZDhoNmMxd2I3MnFxdXVyZW8waTc1In0.1Zi4Zr1NDMHaqe1chkq_Og",
      zoomOffset: -1,
      attribution: '<a href="https://geo.btaa.org/">BTAA Geoportal</a>',
    }
  ).addTo(mymap);

  /********** Handle TopoJSON **********/
  L.TopoJSON = L.GeoJSON.extend({
    addTopoJSON: function (data) {
      var geojson, key;
      if (data.type === "Topology") {
        for (key in data.objects) {
          if (data.objects.hasOwnProperty(key)) {
            geojson = topojson.feature(data, data.objects[key]);
            L.GeoJSON.prototype.addData.call(this, geojson);
          }
        }
        return this;
      }
      L.GeoJSON.prototype.addData.call(this, data);
      return this;
    },
  });

  L.topoJson = function (data, options) {
    return new L.TopoJSON(data, options);
  };

  /********** Layer ActiveStates **********/
  lyrActiveStates = L.topoJson(null, {
    style: styleActiveStates,
    onEachFeature: processActiveStates,
  }).addTo(mymap);

  getTopoData(stateJSON).then((data) => lyrActiveStates.addTopoJSON(data));

  /********** Layer ActiveCounties **********/
  lyrActiveCounties = L.topoJson(null, {
    style: styleActiveCounties,
    onEachFeature: processActiveCounties,
  }).addTo(mymap);

  getTopoData(countyJSON).then((data) => lyrActiveCounties.addTopoJSON(data));

  /********** Layer ActiveCities **********/
  lyrActiveCities = new L.GeoJSON.AJAX(cityJSON, {
    pointToLayer: returnCityPoint,
    onEachFeature: processActiveCities,
  }).addTo(mymap);

  /********** ActiveStates Functions **********/
  function styleActiveStates() {
    return {
      pane: "states",
      fillColor: "#939598",
      color: "#f2f2f2",
      weight: 1,
      fillOpacity: 0.7,
    };
  }

  function processActiveStates(json, lyr) {
    var att = json.properties;
    // Click event: show popup
    lyr.on("click", function (e) {
      mymap.fitBounds(e.target.getBounds());
      $("#popupTemplate").show();
      $(".card-header").css("background-color", "#939598");
      $("#textTitle").html(
        '<div style="color: #f2f2f2;">' + att.State + "</div>"
      );
      if ($("#popupBody")) {
        $("#popupBody").remove();
        popupBody = "";
      }

      popupBody +=
        '<div id="popupBody"><div class="col-md-auto " style="margin-bottom:8px;"><a href="' +
        att.btaaURL +
        '" style="color: black;">Browse ' +
        att.State +
        ' geospatial datasets</a><span class="badge ml-1"style="color:#f2f2f2;background-color:#939598;">' +
        att.totalRecords +
        "</span></div>";
      for (var i = 0; i < att.Title.split("|").length; i++) {
        popupBody +=
          '<div class="col-md-auto" style="margin-bottom:8px;"><a href="' +
          att.sourceURL.split("|")[i] +
          '" style="color: black;">Visit ' +
          att.Title.split("|")[i] +
          ' website</a><i class="fas fa-external-link-alt ml-1" style="color:#939598"></i></div>';
      }
      popupBody += "</div>";
      $("#popupTable").append(popupBody);
    });

    // Mouseover event: highlight the selected feature
    lyr.on("mouseover", function () {
      infoHoverOver(att);
    });

    // Mouseout event: dehighlight the selected feature
    lyr.on("mouseout", function () {
      inforMoveOut();
    });
  }

  /********** ActiveCounties Functions **********/
  function styleActiveCounties(json) {
    var att = json.properties;
    return {
      pane: "counties",
      fillColor: att.Color,
      color: "#f2f2f2",
      weight: 1,
      fillOpacity: 0.8,
    };
  }

  function processActiveCounties(json, lyr) {
    var att = json.properties;

    // Click event: show popup
    lyr.on("click", function (e) {
      mymap.fitBounds(e.target.getBounds());
      $("#popupTemplate").show();
      $(".card-header").css("background-color", att.Color);
      $("#textTitle").html(
        '<div style="color: #f2f2f2;">' +
          att.County +
          ", " +
          att.State +
          "</div>"
      );
      if ($("#popupBody")) {
        $("#popupBody").remove();
        popupBody = "";
      }

      popupBody +=
        '<div id="popupBody"><div class="col-md-auto " style="margin-bottom:8px;"><a href="' +
        att.btaaURL +
        '" style="color: black;">Browse ' +
        att.County +
        ' geospatial datasets</a><span class="badge ml-1"style="color:#f2f2f2;background-color:' +
        att.Color +
        ';">' +
        att.totalRecords +
        "</span></div>";
      for (var i = 0; i < att.Title.split("|").length; i++) {
        popupBody +=
          '<div class="col-md-auto" style="margin-bottom:8px;"><a href="' +
          att.sourceURL.split("|")[i] +
          '" style="color: black;">Visit ' +
          att.Title.split("|")[i] +
          ' website</a><i class="fas fa-external-link-alt ml-1" style="color:' +
          att.Color +
          '"></i></div>';
      }
      popupBody += "</div>";
      $("#popupTable").append(popupBody);
    });

    // Mouseover event: highlight the selected feature
    lyr.on("mouseover", function (e) {
      var feature = e.target;
      feature.setStyle({
        weight: 2,
        color: "#fca311",
        fillOpacity: 0.65,
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        feature.bringToFront();
      }

      infoHoverOver(att);
    });

    // Mouseout event: dehighlight the selected feature
    lyr.on("mouseout", function (e) {
      lyrActiveCounties.resetStyle(e.target);

      inforMoveOut();
    });
  }

  /********** ActiveCities Functions **********/
  function returnCityPoint(json, latlng) {
    var att = json.properties;
    return L.circle(latlng, {
      pane: "cities",
      radius: att.Size,
      color: "#f2f2f2",
      fillColor: "#ef8354",
      fillOpacity: 2,
      weight: 1.5,
    });
  }

  function processActiveCities(json, lyr) {
    var att = json.properties;
    // Click event: show popup
    lyr.on("click", function (e) {
      mymap.fitBounds([e.latlng]);
      $("#popupTemplate").show();
      $(".card-header").css("background-color", "#ef8354");
      $("#textTitle").html(
        '<div style="color: #f2f2f2;">' + att.City + ", " + att.State + "</div>"
      );
      if ($("#popupBody")) {
        $("#popupBody").remove();
        popupBody = "";
      }
      popupBody +=
        '<div id="popupBody"><div class="col-md-auto" style="margin-bottom:8px;"><a href="' +
        att.btaaURL +
        '" style="color: black;">Browse ' +
        att.City +
        " geospatial datasets</a>" +
        '<span class="badge ml-1" style="background-color:#ef8354;color:#f2f2f2;">' +
        att.totalRecords +
        "</span></div>";
      for (var i = 0; i < att.Title.split("|").length; i++) {
        popupBody +=
          '<div class="col-md-auto" style="margin-bottom:8px;"><a href="' +
          att.sourceURL.split("|")[i] +
          '" style="color: black;">Visit ' +
          att.Title.split("|")[i] +
          ' website</a><i class="fas fa-external-link-alt ml-1" style="color:#ef8354;"></i></div>';
      }
      popupBody += "</div>";
      $("#popupTable").append(popupBody);
    });

    // Mouseover event: highlight the selected feature
    lyr.on("mouseover", function () {
      infoHoverOver(att);
    });

    // Mouseout event: dehighlight the selected feature
    lyr.on("mouseout", function () {
      inforMoveOut();
    });
  }

  // Close popup and zoom out
  $("#btnClose").click(function () {
    $("#popupTemplate").hide().fadeOut();
  });

  /********** Set Layer Order **********/
  // Make sure city layer on top of county layer
  paneStates = mymap.createPane("states");
  paneCounties = mymap.createPane("counties");
  paneCities = mymap.createPane("cities");
  mymap.getPane(paneStates).style.zIndex = 200;
  mymap.getPane(paneCounties).style.zIndex = 201;
  mymap.getPane(paneCities).style.zIndex = 202;

  /********** Layer Filter **********/
  function layerToggle(btn, lyrGroup) {
    $(btn).click(function () {
      $(this).data("clicked", true);
      $(this).val("selected");
      $(this).siblings().removeAttr("value");
      $("#btnCounty").prop("disabled", true);
      $("#btnCity").prop("disabled", true);
      clearLayers();
      lyrGroup.forEach(function (lyr) {
        lyr.addTo(mymap);
      });
      $("#btnState").prop("disabled", false);
      mymap.setView([43, -84], 5);
    });
  }

  layerToggle("#btnAllLayer", [
    lyrActiveStates,
    lyrActiveCities,
    lyrActiveCounties,
  ]);
  layerToggle("#btnStateLayer", [lyrActiveStates]);
  layerToggle("#btnCountyLayer", [lyrActiveCounties]);
  layerToggle("#btnCityLayer", [lyrActiveCities]);

  /********** All Filter **********/
  $("#dropdownState > button").click(function () {
    clearLayers();
    var val = $(this).val();
    lyrFilterStates = returnLayersByAttribute(lyrActiveStates, "State", val);
    lyrFilterCounties = returnLayersByAttribute(
      lyrActiveCounties,
      "State",
      val
    );
    lyrFilterCities = returnLayersByAttribute(lyrActiveCities, "State", val);
    var fcStates = L.featureGroup(lyrFilterStates).toGeoJSON();
    var fcCounties = L.featureGroup(lyrFilterCounties).toGeoJSON();
    var fcCities = L.featureGroup(lyrFilterCities).toGeoJSON();

    var lyrStates = L.geoJSON(fcStates, {
      style: styleActiveStates,
      onEachFeature: processActiveStates,
    });

    var lyrCounties = L.geoJSON(fcCounties, {
      style: styleActiveCounties,
      onEachFeature: processActiveCounties,
    });

    var lyrCities = L.geoJSON(fcCities, {
      pointToLayer: returnCityPoint,
      onEachFeature: processActiveCities,
    });

    filterCounties = filterGroup(fcCounties, "County", "#btnCounty");
    filterCities = filterGroup(fcCities, "City", "#btnCity");

    $("#Countymenu").remove();
    dropdownCounties = "";
    dropdownCounties += '<div id="Countymenu">';
    for (var i = 0; i < filterCounties.length; i++) {
      dropdownCounties +=
        '<button class="dropdown-item" value="' +
        filterCounties[i] +
        '">' +
        filterCounties[i] +
        "</button>";
    }
    dropdownCounties += "</div>";
    $("#dropdownCounty").append(dropdownCounties);

    $("#Citymenu").remove();
    dropdownCities = "";
    dropdownCities += '<div id="Citymenu">';
    for (var i = 0; i < filterCities.length; i++) {
      dropdownCities +=
        '<button class="dropdown-item" id="Citymenu" value="' +
        filterCities[i] +
        '">' +
        filterCities[i] +
        "</button>";
    }
    dropdownCities += "</div>";
    $("#dropdownCity").append(dropdownCities);

    if ($("#btnAllLayer").val() == "selected") {
      clearLayers();
      lyrStates.addTo(mymap);
      lyrCounties.addTo(mymap);
      lyrCities.addTo(mymap);
      mymap.fitBounds(lyrStates.getBounds().pad(1));

      if ($("#btnCounty").on("clicked")) {
        countyFilter();
      }

      if ($("#btnCity").on("clicked")) {
        cityFilter();
      }
    } else if ($("#btnStateLayer").val() == "selected") {
      clearLayers();
      $("#btnCounty").prop("disabled", true);
      $("#btnCity").prop("disabled", true);
      lyrStates.addTo(mymap);
      mymap.fitBounds(lyrStates.getBounds());
    } else if ($("#btnCountyLayer").val() == "selected") {
      clearLayers();
      $("#btnCounty").prop("disabled", false);
      $("#btnCity").prop("disabled", true);
      lyrCounties.addTo(mymap);
      mymap.fitBounds(lyrCounties.getBounds());
      countyFilter();
    } else if ($("#btnCityLayer").val() == "selected") {
      clearLayers();
      $("#btnCounty").prop("disabled", true);
      $("#btnCity").prop("disabled", false);
      lyrCities.addTo(mymap);
      mymap.fitBounds(lyrCities.getBounds());
      cityFilter();
    }
  });

  /********** County Filter **********/
  function countyFilter() {
    $("#dropdownCounty").on("click", "button", function () {
      clearLayers();
      var val = $(this).val();
      var target = filterLayer(lyrFilterCounties, "County", val);

      var lyrCounty = L.geoJSON(target, {
        style: styleActiveCounties,
        onEachFeature: processActiveCounties,
      }).addTo(mymap);

      mymap.fitBounds(lyrCounty.getBounds());
    });
  }

  /********** City Filter **********/
  function cityFilter() {
    $("#dropdownCity").on("click", "button", function () {
      clearLayers();
      var val = $(this).val();
      var target = filterLayer(lyrFilterCities, "City", val);

      var lyrCity = L.geoJSON(target, {
        pointToLayer: returnCityPoint,
        onEachFeature: processActiveCities,
      }).addTo(mymap);

      mymap.fitBounds(lyrCity.getBounds());
    });
  }

  /********** Clear Button **********/
  $("#btnClear").click(function () {
    $("#btnFilter").prop("disabled", false);
    $("#btnState").prop("disabled", false);
    $("#btnCounty").prop("disabled", true);
    $("#btnCity").prop("disabled", true);
    clearMap();
  });

  /********** Custom Legend **********/
  $.getJSON({
    url: legendJSON,
    success: function (data) {
      // County Interval & Palette
      styleCounties = data["county"];
      getStyle(styleCounties, intervalCounties, paletteCounties);

      // City Interval & Size
      styleCities = data["city"];
      getStyle(styleCities, intervalCities, sizeCities);

      legendPanel = L.control({ position: "bottomright" });

      legendPanel.onAdd = function () {
        var div = L.DomUtil.create("div", "info legend p-3"),
          colorCounty = [0].concat(intervalCounties),
          gradesCounty = [1].concat(intervalCounties),
          gradesCity = [1].concat(intervalCities),
          label = [
            '<h6 style="font-family: Josefin Sans, sans-serif;">Number of Records</h6><h6 style="font-family: Josefin Sans, sans-serif;">in the BTAA Geoportal</h6><p class="mb-1">County-hosted Data Portal</p>',
          ];

        // loop through county intervals and generate a label with a colored square for each interval
        for (var i = 0; i < colorCounty.length - 1; i++) {
          leftnum = i == 0 ? gradesCounty[i] : gradesCounty[i] + 1;
          div.innerHTML += label.push(
            '<div><i style="background:' +
              getColor(colorCounty[i] + 1) +
              '"></i><p>' +
              leftnum +
              "&nbsp;&ndash;&nbsp;" +
              gradesCounty[i + 1] +
              "</p></div>"
          );
        }

        label.push('<p class="mt-2 mb-1">City-hosted Data Portal</p>');

        // loop through city intervals and generate a label with a proportional circle for each interval
        label.push(
          '<div class="d-flex justify-content-between align-items-center pr-3" style="height:30px;>'
        );
        for (var i = 0; i < gradesCity.length; i++) {
          label.push(
            '<span style="width:' +
              getSize(gradesCity[i]) +
              "px;height:" +
              getSize(gradesCity[i]) +
              'px"></span>'
          );
        }
        label.push(
          '</div><div class="d-flex justify-content-between align-items-center pr-3"><p><&nbsp;' +
            gradesCity[1] +
            "</p><p>" +
            (gradesCity[1] + 1) +
            "&nbsp;&ndash;&nbsp;" +
            gradesCity[2] +
            "</p><p>>&nbsp;" +
            (gradesCity[2] + 1) +
            "</p></div>"
        );

        div.innerHTML = label.join("");
        return div;
      };

      legendPanel.addTo(mymap);
    },
  });

  function getStyle(style, interval, symbol) {
    for (var i in style) {
      interval.push(Math.round(i, 0));
      symbol.push(style[i]);
    }
  }

  function getColor(d) {
    return d > intervalCounties[3]
      ? paletteCounties[4]
      : d > intervalCounties[2]
      ? paletteCounties[3]
      : d > intervalCounties[1]
      ? paletteCounties[2]
      : d > intervalCounties[0]
      ? paletteCounties[1]
      : paletteCounties[0];
  }

  function getSize(d) {
    return d > intervalCities[1]
      ? sizeCities[2]
      : d > intervalCities[0]
      ? sizeCities[1]
      : sizeCities[0];
  }

  /********** Custom PlaceName Panel **********/
  infoPanel = L.control({ position: "topright" });
  infoPanel.onAdd = function () {
    var div = L.DomUtil.create("div", "info legend place");
    div.innerHTML =
      '<h6 style="font-family: Josefin Sans, sans-serif;">Place Name</h6><p id="placeName" style="color:#939598;">Hover over a place</p>';
    inforMoveOut();
    return div;
  };

  function infoHoverOver(att) {
    $("#placeName").empty();
    if (att.County) {
      $("#placeName").html(
        '<p style="color:rgb(0,136,206)">' +
          att.County +
          ", " +
          att.State +
          "</p>"
      );
    } else if (att.City) {
      $("#placeName").html(
        '<p style="color:rgb(239,131,84)">' +
          att.City +
          ", " +
          att.State +
          "</p>"
      );
    } else {
      $("#placeName").html(
        '<p style="color:rgb(147,149,152)">' + att.State + "</p>"
      );
    }
  }

  function inforMoveOut() {
    $("#placeName").empty();
    $("#placeName").text("Hover over a place");
  }

  infoPanel.addTo(mymap);

  /********** General Functions **********/
  async function getTopoData(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
  }

  function returnLayersByAttribute(lyr, att, val) {
    var arLayers = lyr.getLayers();
    var arMatches = [];
    for (i = 0; i < arLayers.length - 1; i++) {
      var featureVal = arLayers[i].feature.properties[att];
      if (featureVal == val) {
        arMatches.push(arLayers[i]);
      }
    }
    if (arMatches.length) {
      return arMatches;
    } else {
      return false;
    }
  }

  function clearLayers() {
    mymap.eachLayer(function (lyr) {
      if (lyr.toGeoJSON) {
        mymap.removeLayer(lyr);
      }
    });
  }

  function filterGroup(geojson, att, btn) {
    var features = geojson.features;
    var filtergroup = [];
    for (var i in features) {
      var item = features[i].properties[att];
      filtergroup.push(item);
    }
    if (filtergroup.length) {
      $(btn).prop("disabled", false);
    } else {
      $(btn).prop("disabled", true);
    }
    return filtergroup;
  }

  function filterLayer(lyr, att, val) {
    var target;
    lyr.forEach(function (data) {
      if (data.feature.properties[att] == val) {
        target = data.feature;
      }
    });
    return target;
  }

  function clearMap() {
    clearLayers();
    lyrActiveStates.addTo(mymap);
    lyrActiveCities.addTo(mymap);
    lyrActiveCounties.addTo(mymap);
    mymap.setView([43, -84], 5);
  }
});
