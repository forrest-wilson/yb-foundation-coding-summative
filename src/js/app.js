$(document).ready(() => {
    ///////////////////////////////
    //// Variable Declarations ////
    ///////////////////////////////

    // Immutable variables
    const carsJsonUrl = "../json/vehicleInfo.json";
    const nzCenter = [172.5, -41.278919]; // Center coordinates for NZ
    const transitionTime = 400;
    const scaleFactor = 2;
    const baseDirectionsUrl = "https://api.mapbox.com/directions/v5/mapbox/driving/";
    const baseGeocodingUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places/";

    ////////////////
    //// Mapbox ////
    ////////////////

    mapboxgl.accessToken = "pk.eyJ1IjoiZm9ycmVzdHdpbHNvbiIsImEiOiJjamFicGc4ejAwMmN0MnFxdWY3OGYyMW04In0.8hjX9IJyvPY_lkNdoaIBfw";

    // Mapbox Map
    const map = new mapboxgl.Map({
        container: "map", // Map div ID
        style: "mapbox://styles/forrestwilson/cjaou8vqqfup52spf1xsw4o2f",
        center: nzCenter, // [lng, lat].
        zoom: 4.5,
        interactive: false
    });

    // Mapbox Directions
    const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        units: "metric",
        controls: {
            inputs: false,
            instructions: false
        }
    });

    // Mutable variables
    let $windowHeight = $(window).height();
    let $windowWidth = $(window).width();
    let howDoIWorkOverlayShowing = false;
    let backgroundImageIsShowing = true;
    let latestData = null;
    let waypoints = [];
    let mapPoints = {
        origin: null,
        waypoints: [],
        destination: null,
        markers: []
    }

    ///////////////////////////////
    //// Function Declarations ////
    ///////////////////////////////

    // Functions to be called on page load are in this IIFE
    function init() {
        // Present the initial page
        showFormPage("sectionOne");

        // Calling the initial geocoder setup
        addGeocoder("origin", map, "Please enter a start point");
        addGeocoder("waypoints", map, "Please enter a stop");
        addGeocoder("destination", map, "Please enter your destination");
    };

    // Updates the global screen dimension variables
    function updateScreenDimensions() {
        $windowHeight = $(window).height();
        $windowWidth = $(window).width();
    }

    // Toggles the how do i work overlay
    function toggleHowDoIWorkOverlay() {
        if (howDoIWorkOverlayShowing) {
            $("#mask").fadeOut(transitionTime);
            $("#howDoIWorkPopup").fadeOut(transitionTime);
            howDoIWorkOverlayShowing = false;
        } else {
            $("#mask").fadeIn(transitionTime);
            $("#howDoIWorkPopup").fadeIn(transitionTime);
            howDoIWorkOverlayShowing = true;
        }
    }

    // Toggles the background image based on the backgroundImageIsShowing boolean
    function toggleBackgroundImage() {
        if (backgroundImageIsShowing) {
            $("#backgroundImage").fadeOut(transitionTime);
            backgroundImageIsShowing = false;
        } else {
            $("#backgroundImage").fadeIn(transitionTime);
            backgroundImageIsShowing = true;
        }
    }

    // Shows a form page depending on what id is passed to it
    function showFormPage(id) {
        let elToShow = document.getElementById(id);

        elToShow.style.display = "block";

        setTimeout(() => {
            elToShow.style.opacity = 1.0;
            elToShow.style.transform = "scale(1)";
        }, 50);
    }

    // Shows the next page and hides the current page
    function showNextPage(idToShow, idToHide) {
        let elToShow = document.getElementById(idToShow);
        let elToHide = document.getElementById(idToHide);

        elToHide.style.transform = "scale(" + scaleFactor + ")";
        elToHide.style.opacity = 0;

        setTimeout(() => {
            elToHide.style.display = "none";
            elToHide.style.transform = "scale(0)";
        }, transitionTime);

        showFormPage(idToShow);
    }

    // Shows the previous page and hides the current page
    function showPreviousPage(idToShow, idToHide) {
        let elToShow = document.getElementById(idToShow);
        let elToHide = document.getElementById(idToHide);

        elToHide.style.opacity = 0;
        elToHide.style.transform = "scale(0)";

        setTimeout(() => {
            elToHide.style.display = "none";
        }, transitionTime);

        elToShow.style.transition = "0ms";
        elToShow.style.transform = "scale(" + scaleFactor + ")";
        
        setTimeout(() => {
            elToShow.style.transition = transitionTime + "ms";
            showFormPage(idToShow);
        });
    }

    // Adds a geocode control and appends to the document
    function addGeocoder(id, map, placeholder) {
        // Instantiates a new instance of MapboxGeocoder
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            country: "NZ", // Limits searches to NZ
            limit: 5,
            placeholder: placeholder
        });
        const ctrlEls = $(".mapboxgl-ctrl-top-right");
        const geocoderInput = $(".mapboxgl-ctrl-geocoder");

        // Adds the control to the map. Might be able to add to any element
        map.addControl(geocoder);

        // Copys the geocoder to custom DOM element
        document.getElementById(id).appendChild(geocoder.onAdd(map));

        // Removes the original mapboxgl controls from the map as they duplicate
        ctrlEls[0].removeChild(ctrlEls[0].children[0]);

        let array = document.getElementById("waypoints").children;
        let arrayIndex = null;

        for (let i = 0; i < array.length; i++) {
            ((index) => {
                array[i].onclick = () => {
                    arrayIndex = index;
                };
            })(i);
        }

        geocoder.on("result", (e) => {
            latestData = e;

            if (id === "waypoints") {
                if (waypoints === []) {
                    waypoints.push(e);
                } else {
                    waypoints.splice(arrayIndex, 1, e);
                }
            }
        });
    }

    // Gets the route of origin, waypoints and destination arrays
    function getRoute(origin, dest, waypoints) {
        let request = baseDirectionsUrl + origin[0] + "," + origin[1] + ";"; // Base request URL

        // Adds stops to the request if they exist
        for (let i = 0; i < waypoints.length; i++) {
            request += waypoints[i].result.geometry.coordinates[0] + "," + waypoints[i].result.geometry.coordinates[1] + ";";
        }
        
        // Adds the destination to the request
        request += dest[0] + "," + dest[1];

        // Optional request perameters
        request += "?overview=full&geometries=geojson";

        // End the request with access token
        request += "&access_token=" + mapboxgl.accessToken;

        $.ajax({
            method: "GET",
            url: request
        }).done((data) => {
            console.log("Data", data);
            let route = data.routes[0].geometry;
            let source = map.getSource("route");

            if (source) {
                console.log(source);
                source.setData(route);
            } else {
                map.addSource("route", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: route
                    }
                });

                map.addLayer({
                    "id": "route",
                    "type": "line",
                    "source": "route",
                    "paint": {
                        "line-width": 2
                    }
                });
            }

            console.log(map);

            for (let i = 0; i < mapPoints.markers.length; i++) {
                mapPoints.markers[i].remove();
            }

            // Adds markers to the map
            data.waypoints.forEach((marker, i) => {
                let newMarker = document.createElement("div");
                newMarker.className = "fa fa-map-marker marker";

                let a = new mapboxgl.Marker(newMarker, { offset: [0, -20] }).setLngLat(data.waypoints[i].location).addTo(map);
                mapPoints.markers.push(a);
            });

            let pathCoordinates = data.routes[0].geometry.coordinates;

            let bounds = pathCoordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(pathCoordinates[0], pathCoordinates[0]));

            map.fitBounds(bounds, {
                padding: 100
            });
        });
    }

    ////////////////////////
    //// Event Handlers ////
    ////////////////////////

    //
    // Click Handlers
    //

    // "How to" event listeners

    $("#howToText").click((e) => {
        e.preventDefault();
        toggleHowDoIWorkOverlay();
    });

    $("#howDoIWorkPopupClose").click((e) => {
        e.preventDefault();
        toggleHowDoIWorkOverlay();
    });

    // Form Presentation Event Listeners

    // Section One

    $("#sectionOneButton").click((e) => {
        e.preventDefault();
        showNextPage("sectionTwo", "sectionOne");
        toggleBackgroundImage();
    });

    // Section Two

    $("#sectionTwoButtonNext").click((e) => {
        e.preventDefault();

        if (latestData !== null) {
            mapPoints.origin = latestData;
            latestData = null;
            showNextPage("sectionThree", "sectionTwo");
        } else {
            console.log("No result from input");
        }
    });

    $("#sectionTwoButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionOne", "sectionTwo");
        toggleBackgroundImage();
    });

    // Section Three

    $("#sectionThreeButtonNext").click((e) => {
        e.preventDefault();

        let waypointInputs = document.getElementById("waypoints").children;

        mapPoints.waypoints = []; // Makes sure the array is empty

        for (let i = 0; i < waypointInputs.length; i++) {
            if (waypointInputs[i].children[1].value !== "") {
                mapPoints.waypoints.push(waypoints[i]);
            }
        }

        showNextPage("sectionFour", "sectionThree");
    });

    $("#sectionThreeButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionTwo", "sectionThree");
    });

    $("#anotherStop").click((e) => {
        e.preventDefault();

        let allInputs = document.getElementById("waypoints").children;
        let valueArray = [];

        // Loops through each waypoint input and pushes the input value to the valueArray
        for (let i = 0; i < allInputs.length; i++) {
            valueArray.push(allInputs[i].children[1].value);
        }

        // If an input is empty, don't add another input field to the DOM
        if (valueArray.every((val) => { return val !== ""; })) {
            addGeocoder("waypoints", map, "Please enter a stop");
        } else {
            console.log("Please finish entering the empty stops before adding more.");
            // handle this with a tooltip or something
        }
    });

    // Section Four

    $("#finishButton").click((e) => {
        e.preventDefault();

        if (latestData !== null) {
            mapPoints.destination = latestData;
            latestData = null;
            getRoute(mapPoints.origin.result.geometry.coordinates, mapPoints.destination.result.geometry.coordinates, mapPoints.waypoints);
        } else {
            console.log("No result from input");
        }

        console.log(mapPoints);
    });

    $("#sectionFourButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionThree", "sectionFour");
    });

    //
    // Window Resize Handler
    //

    $(window).on("resize", () => {
        updateScreenDimensions();
    });

    //
    // AJAX Loading Handler
    //

    $(document).ajaxStart(() => {
        $("#ajaxLoading").fadeIn(transitionTime);
        $("#mask").fadeIn(transitionTime);
    }).ajaxStop(() => {
        $("#ajaxLoading").fadeOut(transitionTime);
        $("#mask").fadeOut(transitionTime);
    });

    // Init invocation
    init();
});