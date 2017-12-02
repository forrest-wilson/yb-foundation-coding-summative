$(document).ready(() => {
    ///////////////////////////////
    //// Variable Declarations ////
    ///////////////////////////////

    // Immutable variables
    const carsJsonUrl = "../json/vehicleInfo.json";
    const nzCenter = [172.5, -41.278919]; // Center coordinates for NZ
    const transitionTime = 400;
    const scaleFactor = 2;

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
        // interactive: false
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
    let latestCoords = [];
    let mapPoints = {
        waypoints: []
    };

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

    // Shorthand function for getting the documents ID
    function getId(id) {
        return document.getElementById(id);
    }

    // Clears the mapPoints waypoints property
    function clearWaypoints() {
        mapPoints.waypoints = [];
    }

    // Updates the global screen dimension variables
    function updateScreenDimensions() {
        $windowHeight = $(window).height();
        $windowWidth = $(window).width();
        console.log("Screen size changed: H:", $windowHeight, "W:", $windowWidth);
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
        const ctrlEls = document.getElementsByClassName("mapboxgl-ctrl-top-right");
        const geocoderInput = document.getElementsByClassName("mapboxgl-ctrl-geocoder");

        // Adds the control to the map. Might be able to add to any element
        map.addControl(geocoder);

        // Copys the geocoder to custom DOM element
        document.getElementById(id).appendChild(geocoder.onAdd(map));

        // Removes the original mapboxgl controls from the map as they duplicate
        ctrlEls[0].removeChild(ctrlEls[0].children[0]);

        geocoder.on("result", (e) => {
            console.log(e);
            latestCoords = e.result.geometry.coordinates;
            console.log("Latest Coordinates:", latestCoords);
        });
    }

    // Gets the lat and lng of a string
    function getGeocodePoint(queryString) {
        let requestUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + queryString + ".json?geometries=geojson&access_token=" + mapboxgl.accessToken;

        if (queryString !== "") {
            $.ajax({
                method: "GET",
                url: requestUrl
            }).done((data) => {
                if (data.features[0].relevance === 1) {
                    mapPoints.waypoints.push(data.features[0].geometry.coordinates);
                }
            });
        } else {
            console.log("Empty query string");
        }
    }

    // Gets the route of origin, waypoints and destination arrays
    function getRoute(origin, dest, waypoints) {
        let start = origin,
            end = dest,
            stops = waypoints,
            // Base request URL
            request = "https://api.mapbox.com/directions/v5/mapbox/driving/" + start[0] + "," + start[1] + ";";
        
        // Adds stops to the request if they exist
        for (let i = 0; i < waypoints.length; i++) {
            request += stops[i][0] + "," + stops[i][1] + ";";
        }
        
        // Adds the destination to the request
        request += end[0] + "," + end[1];

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

            // Adds markers to the map
            data.waypoints.forEach((marker, i) => {
                let el = document.createElement("div");
                el.className = "fa fa-map-marker marker";

                new mapboxgl.Marker(el).setLngLat(data.waypoints[i].location).addTo(map);
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
        if (latestCoords[0]) {
            mapPoints.origin = latestCoords;
            console.log(mapPoints);
            showNextPage("sectionThree", "sectionTwo");
            clearWaypoints();
        } else {
            console.log("Not a real place");
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
        showNextPage("sectionFour", "sectionThree");

        let inputEls = document.getElementById("waypoints").children;
        for (let i = 0; i < inputEls.length; i++) {
            let val = inputEls[i].children[1].value;
            getGeocodePoint(val);
        }
    });

    $("#sectionThreeButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionTwo", "sectionThree");
    });

    $("#anotherStop").click((e) => {
        e.preventDefault();
        addGeocoder("waypoints", map, "Please enter a stop");
    });

    // Section Four

    $("#finishButton").click((e) => {
        e.preventDefault();
        mapPoints.destination = latestCoords;
        console.log(mapPoints);
        getRoute(mapPoints.origin, mapPoints.destination, mapPoints.waypoints);
    });

    $("#sectionFourButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionThree", "sectionFour");
        clearWaypoints();
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