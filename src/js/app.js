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
    let howDoIWorkOverlayShowing = false;
    let backgroundImageIsShowing = true;
    let newJourneyConfirmationShowing = false;
    let waypoints = [];

    // Map properties
    let mapPoints = {
        origin: null,
        waypoints: [],
        destination: null,
        markers: []
    };

    // Vehicle hire properties
    let hireInfo = {
        persons: null,
        days: {
            startDay: null,
            endDay: null,
            totalDays: null
        }
    };

    // Route properties
    let routeInfo = {
        data: null,
        distance: null
    };

    // JSON from vehicleInfo.json
    let vehicleInfo = null;

    let htmlVehicleTemplate = null;

    ///////////////////////////////
    //// Function Declarations ////
    ///////////////////////////////

    // Functions to be called on page load are in this IIFE
    function init() {
        // Present the initial page
        showFormPage("sectionFive");

        // Calling the initial geocoder setup
        addGeocoder("origin", map, "Please enter a start point", "originGeocoder");
        addGeocoder("waypoints", map, "Please enter a stop");
        addGeocoder("destination", map, "Please enter your destination", "destinationGeocoder");

        // Initialize event handlers that rely on geocoders being in the DOM
        $("#originGeocoder .geocoder-pin-right .geocoder-icon-close").click((e) => {
            e.preventDefault();
            mapPoints.origin = null;
        });

        $("#destinationGeocoder .geocoder-pin-right .geocoder-icon-close").click((e) => {
            e.preventDefault();
            mapPoints.destination = null;
        });

        // Tooltip initializer
        $(".tooltip").tooltipster({
            theme: "tooltipster-punk",
            trigger: "custom"
        });

        // Slick initializer
        $(".vehicle-options").slick({
            arrows: false,
            centerMode: true,
            slidesToShow: 1,
            infinite: false,
            autoplay: true,
            autoplaySpeed: 1
        });
    };

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

    // function toggleNewJourneyConfirmation() {
    //     if (newJourneyConfirmationShowing) {
    //         $("#mask").fadeOut(transitionTime);
    //         $("#newJourneyConfirmationPopup").fadeOut(transitionTime);
    //         newJourneyConfirmationShowing = false;
    //     } else {
    //         $("#mask").fadeIn(transitionTime);
    //         $("#newJourneyConfirmationPopup").fadeIn(transitionTime);
    //         newJourneyConfirmationShowing = true;
    //     }
    // }

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

    // Shows a form page depending on what id is vehicleMatches to it
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

    // Returns the application to it's default state
    function returnToDefaults() {
        let allGeocoders = $(".mapboxgl-ctrl-geocoder");
        let waypointInputs = $("#waypoints").children();

        // Removes all map markers from the map
        for (let i = 0; i < mapPoints.markers.length; i++) {
            mapPoints.markers[i].remove();
        }

        // Sets the value of the geocoder inputs to null
        for (let j = 0; j < allGeocoders.length; j++) {
            allGeocoders[j].children[1].value = null;
        }

        // Removes all but the first waypoint geocoder element from the DOM
        // NOTE: May cause a memory leak as the geocoder isn't being de-initialized
        for (let k = 0; k < waypointInputs.length; k++) {
            if (k !== 0) {
                waypointInputs[k].parentElement.removeChild(waypointInputs[k]);
            }
        }

        let vis = map.getLayoutProperty("route", "visibility");

        if (vis === "visible") {
            map.setLayoutProperty("route", "visibility", "none");
        }

        mapPoints = {
            origin: null,
            destination: null,
            waypoints: [],
            markers: []
        };

        map.flyTo({
            center: nzCenter,
            zoom: 4.5
        });
    }

    // Generic AJAX GET function
    function xhrGet(url, callback) {
        $.ajax({
            method: "GET",
            url: url
        }).done((data) => {
            if (typeof callback !== "undefined") callback(data);
        });
    }

    // Converts a number into a "km" string
    function getRouteDistance(distance, decimals) {
        if (typeof decimals === "undefined") decimals = 1;
        let roundedNumber = Number(Math.round((distance / 1000) + "e" + decimals) + "e-" + decimals);

        // Returns an array. Index 0 is a string and index 1 is a number
        return [roundedNumber + "km", roundedNumber];
    }

    // Converts the route time from seconds to hours/minutes
    function getRouteDuration(seconds) {
        let totalTime = seconds / 3600;
        let hours = Math.floor(totalTime);
        let minutes = Math.floor((totalTime - hours) * 60);

        return hours + " hours & " + minutes + " minutes";
    }

    // Adds a geocode control and appends to the document
    function addGeocoder(id, map, placeholder, geocoderId) {
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

        // If a geocoderId has been added, run this code
        if (geocoderId) {
            // Returns an array of the elements children
            let geocoderEls = document.getElementById(id).children;
            let elCount = geocoderEls.length;

            geocoderEls[elCount - 1].setAttribute("id", geocoderId);
        }

        // Removes the original mapboxgl controls from the map as they duplicate
        ctrlEls[0].removeChild(ctrlEls[0].children[0]);

        // Has to be outside of the "result" event listener
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
            $("#origin").tooltipster("close");
            $("#destination").tooltipster("close");
            $("#waypoints").tooltipster("close");
            switch (id) {
                case "origin":
                    mapPoints.origin = e;
                    break;
                case "destination":
                    mapPoints.destination = e;
                    break;
                case "waypoints":
                    if (waypoints === []) {
                        waypoints.push(e);
                    } else {
                        waypoints.splice(arrayIndex, 1, e);
                    }
                    break;
                default:
                    console.log("Man, you really messed up if you're getting this message :(");
                    break;
            }
        });
    }

    // Gets the route of origin, waypoints and destination arrays
    function getRoute(origin, dest, waypoints, callback) {
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

        xhrGet(request, (data) => {
            let route = data.routes[0].geometry;
            let source = map.getSource("route");

            // This "if" statement updates the route layer if it exists
            // otherwise it adds the layer to the map
            if (source) {
                source.setData(route);
                map.setLayoutProperty("route", "visibility", "visible");
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
                    "layout": {
                        "visibility": "visible"
                    },
                    "paint": {
                        "line-width": 2
                    }
                });
            }

            // Removes all markers on the map so modifications can
            // be made to the route without leaving leftovers
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

            // Fits the map to the bounds of the specific route retrieved
            let pathCoordinates = data.routes[0].geometry.coordinates;

            let bounds = pathCoordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(pathCoordinates[0], pathCoordinates[0]));

            map.fitBounds(bounds, {
                padding: {
                    top: 150,
                    left: 50,
                    right: 50,
                    bottom: 80
                }
            });

            // Makes the returned data globally available
            routeInfo.data = data;

            // Callback for showing the next page once the ajax request has finished
            if (typeof callback !== "undefined") callback();
        }); 
    }

    // Calculate the recommended days for hire
    function recommendedHireDays(totalDistance) {
        let minDaysHire = 1; // Default minimum days for vehicle hire
        let maxDistancePerDay = 450; // KM value
        let recommendedHireDaysTotal = totalDistance / maxDistancePerDay;
        let recommendedDays = null;

        if (recommendedHireDaysTotal < 1) {
            recommendedDays = 1; // If the total distance is less than the maxDistancePerDay variable, set the recommendedDays to 1
        } else if (recommendedHireDaysTotal >= 7) {
            recommendedDays = 7;
        } else {
            recommendedDays = Math.ceil(recommendedHireDaysTotal);
        }

        return recommendedDays;
    }

    // Calculates the number of days from 2 ms values
    function calcDays(originMs, destMs, callback) {
        let daysMs = destMs - originMs;
        let days = daysMs / 86400000; // Converting ms to days
       
        if (days <= 0) {
            // console.log("You can't have a hire for less than 1 day");
            $("#datePickers").tooltipster("content", "You can't have a hire for less than 1 day");
            $("#datePickers").tooltipster("open");
        } else {
            $("#datePickers").tooltipster("close");
            hireInfo.days.totalDays = days;
            callback();
        }
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

        if (mapPoints.origin) {
            showNextPage("sectionThree", "sectionTwo");
        } else {
            $("#origin").tooltipster("open");
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

        // Checks the input value of each "waypointInputs" field
        // against the same index of the local "waypoints" array
        // ensuring that fields left blank aren't added to the route
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
            $("#waypoints").tooltipster("open");
        }
    });

    // Section Four

    $("#sectionFourButtonNext").click((e) => {
        e.preventDefault();

        if (mapPoints.destination) {
            getRoute(mapPoints.origin.result.geometry.coordinates, mapPoints.destination.result.geometry.coordinates, mapPoints.waypoints, () => {
                showNextPage("sectionFive", "sectionFour");

                let distance = getRouteDistance(routeInfo.data.routes[0].distance);
                let hireDays = recommendedHireDays(distance[1]);

                $("#minDaysHireSuggestion").text(hireDays);
            });
        } else {
            $("#destination").tooltipster("open");
        }

        console.log(mapPoints);
    });

    $("#sectionFourButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionThree", "sectionFour");
    });

    // Section Five

    $("#decreasePeopleCounter").click((e) => {
        e.preventDefault();
        $("#peopleCounter").tooltipster("close");
        if (parseInt($("#peopleCounterNumber").text()) <= 1) {
            $("#peopleCounter").tooltipster("content", "You can't have less than 1 person");
            $("#peopleCounter").tooltipster("open");
            setTimeout(() => {
                $("#peopleCounter").tooltipster("close");
            }, 2500);
        } else {
            let curText = $("#peopleCounterNumber").text();
            $("#peopleCounterNumber").text(parseInt(curText) - 1);
        }
    });

    $("#increasePeopleCounter").click((e) => {
        e.preventDefault();
        $("#peopleCounter").tooltipster("close");
        if (parseInt($("#peopleCounterNumber").text()) >= 6) {
            $("#peopleCounter").tooltipster("content", "You can't have more than 6 people");
            $("#peopleCounter").tooltipster("open");
            setTimeout(() => {
                $("#peopleCounter").tooltipster("close");
            }, 2500);
        } else {
            let curText = $("#peopleCounterNumber").text();
            $("#peopleCounterNumber").text(parseInt(curText) + 1);
        }
    });

    $("#sectionFiveButtonNext").click((e) => {
        e.preventDefault();
        hireInfo.persons = $("#peopleCounterNumber").text();
        showNextPage("sectionSix", "sectionFive");
        $("#peopleCounter").tooltipster("close");
    });

    $("#sectionFiveButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionFour", "sectionFive");
    });

    // Section Six

    // Date picker event handlers
    $("[data-toggle=\"pickupDate\"]").on("pick.datepicker", (e) => {
        hireInfo.days.startDay = Date.parse(e.date);
        $("[data-toggle=\"returnDate\"]").datepicker("setStartDate", new Date(hireInfo.days.startDay));
    });

    $("[data-toggle=\"returnDate\"]").on("pick.datepicker", (e) => {
        hireInfo.days.endDay = Date.parse(e.date);
        console.log(hireInfo);
        $("[data-toggle=\"pickupDate\"]").datepicker("setEndDate", new Date(hireInfo.days.endDay));
    });

    $("[data-toggle=\"pickupDate\"], [data-toggle=\"returnDate\"]").datepicker({
        autoHide: true,
        format: "dd/mm/yyyy",
        startDate: new Date()
    });

    $("#sectionSixButtonNext").click((e) => {
        e.preventDefault();

        if (hireInfo.days.startDay && hireInfo.days.endDay) {
            $("#datePickers").tooltipster("close");

            calcDays(hireInfo.days.startDay, hireInfo.days.endDay, () => {
                // Gets the HTML template
                xhrGet("./ajax/vehicle_template.html", (templateData) => {
                    htmlVehicleTemplate = templateData

                    xhrGet("./json/vehicleInfo.json", (jsonData) => {
                        vehicleInfo = jsonData;

                        let allVehicles = vehicleInfo.vehicles; // array
                        let daysMatch = [];
                        let personsMatch = [];
                        let vehicleMatches = [];

                        // Adds objects that match the conditions to seperate arrays
                        for (let key in allVehicles) {
                            if (hireInfo.days.totalDays >= allVehicles[key].hireDays.min && hireInfo.days.totalDays <= allVehicles[key].hireDays.max) {
                                daysMatch.push(allVehicles[key]);
                            } else {
                                daysMatch.push(false);
                            }

                            if (hireInfo.persons >= allVehicles[key].persons.min && hireInfo.persons <= allVehicles[key].persons.max) {
                                personsMatch.push(allVehicles[key]);
                            } else {
                                personsMatch.push(false);
                            }
                        }

                        // Attempts to find matches and appends any that do match
                        // to an array that holds objects that pass both conditions
                        for (let i = 0; i < allVehicles.length; i++) {
                            if ((daysMatch[i] === personsMatch[i]) && (daysMatch[i] && personsMatch[i] !== false)) {
                                vehicleMatches.push(allVehicles[i]);
                            }
                        }

                        for (let j = 0; j < vehicleMatches.length; j++) {
                            let template = $.parseHTML(htmlVehicleTemplate)[0];

                            template.setAttribute("id", vehicleMatches[j].vehicle);

                            let settableEls = template.children[0].children[0];

                            settableEls.children[0].textContent = vehicleMatches[j].name;
                            settableEls.children[1].setAttribute("src", vehicleMatches[j].imageURL);
                            settableEls.children[2].textContent = "$" + vehicleMatches[j].dailyRate + ".00/day";

                            $(".vehicle-options").slick("slickAdd", template);
                        }

                        // Workaround for the request being too fast for the animation
                        setTimeout(() => {
                            showNextPage("sectionSeven", "sectionSix");
                            $(".vehicle-options").slick("slickPause"); // Slick rendering issue workaround
                            
                            // Slick rendering issue workaround
                            if (vehicleMatches.length === 1) {
                                $(".slick-track").css("width", "auto");
                                $(".vehicle-option").css("width", "auto");
                            }
                        }, transitionTime);

                        $(".vehicle-options").slick("slickGoTo", 0); // Slick rendering issue workaround
                    });
                });
            });

        } else {
            $("#datePickers").tooltipster("open");
        }
    });

    $("#sectionSixButtonBack").click((e) => {
        e.preventDefault();

        showPreviousPage("sectionFive", "sectionSix");
    });

    // Section Seven

    $("#sectionSevenButtonBack").click((e) => {
        e.preventDefault();

        // Removes all slides from slick
        for (let i in $(".vehicle-option")) {
            $(".vehicle-options").slick("slickRemove", 0);
        }

        showPreviousPage("sectionSix", "sectionSeven");
    });

    // Journey Editing

    $("#newJourney").click((e) => {
        e.preventDefault();
        toggleNewJourneyConfirmation();
    });

    $("#editJourney").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionTwo", "sectionFive");
    });

    // New Journey Confirmation Popup

    $("#confirmNewJourney").click((e) => {
        toggleNewJourneyConfirmation();
        returnToDefaults();
        showPreviousPage("sectionTwo", "sectionFive");
    });

    $("#declineNewJourney").click((e) => {
        toggleNewJourneyConfirmation();
    });

    //
    // AJAX Loading GIF Handler
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