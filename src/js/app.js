$(document).ready(() => {

    ///////////////////////////
    //// jQuery Extentions ////
    ///////////////////////////

    // Animate.css jquery extension
    $.fn.extend({
        animateCss: function(animationName, callback) {
            var animationEnd = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";
            this.addClass("animated " + animationName).one(animationEnd, function() {
                $(this).removeClass("animated " + animationName);
                if (callback) {
                    callback();
                }
            });
            return this;
        }
    });

    ///////////////////////////////
    //// Variable Declarations ////
    ///////////////////////////////

    // Immutable variables
    const nzCenter = [172.5, -41.278919]; // Center coordinates for NZ
    const transitionTime = 400;
    const scaleFactor = 2;
    const baseDirectionsUrl = "https://api.mapbox.com/directions/v5/mapbox/driving/";

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

    // Mutable variables
    let waypoints = [];
    let isContentShowing = true;

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

    // HTML Template response
    let htmlVehicleTemplate = null;

    // Saved journey array
    let wayfindrSavedJourneys = [];
    let wayfindrSavedKey = [];

    // Holds the timeout for the counter buttons
    let counterTimeout;

    ///////////////////////////////
    //// Function Declarations ////
    ///////////////////////////////

    // Functions to be called on page load are in this IIFE
    function init() {
        // Present the initial page
        showFormPage("#sectionOne");

        // Calling the initial geocoder setup
        addGeocoder("#origin", map, "Please enter a start point", "originGeocoder");
        addGeocoder("#waypoints", map, "Please enter a stop");
        addGeocoder("#destination", map, "Please enter your destination", "destinationGeocoder");

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
            arrows: true,
            prevArrow: "<i class=\"fa fa-angle-left slick-prev\">Previous</i>",
            nextArrow: "<i class=\"fa fa-angle-right slick-next\">Previous</i>",
            centerMode: true,
            slidesToShow: 1,
            infinite: false,
            autoplay: true,
            autoplaySpeed: 1
        });

        // Initialises the event listeners for each vehicle type
        createVehicleEventListeners(["motorbike", "smallCar", "largeCar", "motorHome"]);
    }

    // Generic overlay toggle
    function toggleOverlay(overlayId, state) {
        switch (state) {
            case "show":
                $("#mask").fadeIn(transitionTime);
                $(overlayId).fadeIn(transitionTime);
                break;
            case "hide":
                $("#mask").fadeOut(transitionTime);
                $(overlayId).fadeOut(transitionTime);
                break;
            default:
                break;
        }
    }

    // Toggles the background image based on the backgroundImageIsShowing boolean
    function toggleBackgroundImage(state) {
        switch (state) {
            case "show":
                $("#backgroundImage").fadeIn(transitionTime);
                break;
            case "hide":
                $("#backgroundImage").fadeOut(transitionTime);
                break;
            default:
                break;
        }
    }

    // Toggle the content to view the map better
    function toggleContent() {
        if (isContentShowing) {
            $("#sectionSeven .inner .content").fadeOut(transitionTime);
            isContentShowing = false;
        } else {
            $("#sectionSeven .inner .content").fadeIn(transitionTime);
            isContentShowing = true;
        }
    }

    // Shows a form page depending on what id is vehicleMatches to it
    function showFormPage(id) {
        let elToShow = $(id);

        elToShow.css("display", "block");

        setTimeout(() => {
            elToShow.css({
                "opacity": "1.0",
                "transform": "scale(1)"
            });
        }, 50);
    }

    // Shows the next page and hides the current page
    function showNextPage(idToShow, idToHide) {
        let elToHide = $(idToHide);

        elToHide.css({
            "transform": "scale(" + scaleFactor + ")",
            "opacity": "0"
        });

        setTimeout(() => {
            elToHide.css({
                "display": "none",
                "transform": "scale(0)"
            });
        }, transitionTime);

        showFormPage(idToShow);
    }

    // Shows the previous page and hides the current page
    function showPreviousPage(idToShow, idToHide) {
        let elToShow = $(idToShow);
        let elToHide = $(idToHide);

        elToHide.css({
            "opacity": "0",
            "transform": "scale(0)"
        });

        setTimeout(() => {
            elToHide.css("display", "none");
        }, transitionTime);

        elToShow.css({
            "transition": "0ms",
            "transform": "scale(" + scaleFactor + ")"
        });
        
        setTimeout(() => {
            elToShow.css("transition", transitionTime + "ms");
            showFormPage(idToShow);
        });
    }

    // Closes all tooltips
    function closeAllTooltips() {
        $("#origin").tooltipster("close");
        $("#destination").tooltipster("close");
        $("#waypoints").tooltipster("close");
        $("#peopleCounter").tooltipster("close");
        $("#datePickers").tooltipster("close");
        $("#journeyName").tooltipster("close");
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

        // Adds the control to the map. Might be able to add to any element
        map.addControl(geocoder);

        // Copys the geocoder to custom DOM element
        $(id)[0].appendChild(geocoder.onAdd(map));

        // If a geocoderId has been added, run this code
        if (geocoderId) {
            // Returns an array of the elements children
            let geocoderEls = $(id).children();
            let elCount = geocoderEls.length;

            geocoderEls[elCount - 1].setAttribute("id", geocoderId);
        }

        // Removes the original mapboxgl controls from the map as they duplicate
        ctrlEls[0].removeChild(ctrlEls[0].children[0]);

        // Has to be outside of the "result" event listener
        let array = $("#waypoints").children();
        let arrayIndex = null;

        for (let i = 0; i < array.length; i++) {
            ((index) => {
                array[i].onclick = () => {
                    arrayIndex = index;
                };
            })(i);
        }

        geocoder.on("result", (e) => {
            closeAllTooltips();
            switch (id) {
                case "#origin":
                    mapPoints.origin = e;
                    $("#sectionTwoButtonNext").animateCss("bounce");
                    break;
                case "#destination":
                    mapPoints.destination = e;
                    $("#sectionFourButtonNext").animateCss("bounce");
                    break;
                case "#waypoints":
                    if (waypoints === []) {
                        waypoints.push(e);
                    } else {
                        waypoints.splice(arrayIndex, 1, e);
                    }
                    $("#sectionThreeButtonNext").animateCss("bounce");
                    break;
                default:
                    break;
            }

            map.flyTo({
                center: e.result.center,
                zoom: 11,
                speed: 2.5
            });
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
                    "layout": { "visibility": "visible" },
                    "paint": { "line-width": 2 }
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
            let pathCoordinates = route.coordinates;

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

    // This function will increase or decrease the counter
    function increaseOrDecreaseCounter(increaseOrDecrease) {
        let counter = parseInt($("#peopleCounterNumber").text());

        clearTimeout(counterTimeout);

        closeAllTooltips();

        if (counter <= 1 && increaseOrDecrease === "decrease") {
            $("#peopleCounter").tooltipster("content", "You can't have less than 1 person");
            $("#peopleCounter").tooltipster("open");
        } else if (counter >= 6 && increaseOrDecrease === "increase") {
            $("#peopleCounter").tooltipster("content", "You can't have more than 6 people");
            $("#peopleCounter").tooltipster("open");
        } else {
            switch(increaseOrDecrease) {
                case "increase":
                    $("#peopleCounterNumber").text(counter + 1);
                    break;
                case "decrease":
                    $("#peopleCounterNumber").text(counter - 1);
                    break;
                default:
                    break;
            }
        }

        counterTimeout = setTimeout(() => {
            closeAllTooltips();
        }, 2500);
    }

    // Calculate the recommended days for hire
    function recommendedHireDays(totalDistance) {
        let maxDistancePerDay = 450; // KM value
        let recommendedHireDaysTotal = totalDistance / maxDistancePerDay;
        let recommendedDays = null;

        if (recommendedHireDaysTotal < 1) {
            recommendedDays = 1; // If the total distance is less than the maxDistancePerDay variable, set the recommendedDays to 1
        } else if (recommendedHireDaysTotal >= 7) {
            recommendedDays = 15;
        } else {
            recommendedDays = Math.ceil(recommendedHireDaysTotal);
        }

        return recommendedDays;
    }

    // Calculates the number of days from 2 ms values
    function calcDays(originMs, destMs) {
        let daysMs = destMs - originMs;
        let days = daysMs / 86400000; // Converting ms to days
       
        if (days <= 0) {
            $("#datePickers").tooltipster("content", "You can't have a hire for less than 1 day");
            $("#datePickers").tooltipster("open");
        } else {
            closeAllTooltips();
            hireInfo.days.totalDays = days;
        }
    }

    // Calculates the fuel cost of the journey
    function calculateFuelCost(pricePerLitre, vehicleMileage, tripDistance) {
        let fuelCost = pricePerLitre * (vehicleMileage/100) * tripDistance;
        return ["$" + fuelCost.toFixed(2) + " NZD", parseFloat(fuelCost.toFixed(2))];
    }

    // Creates the event listeners for each of the vehicle types
    function createVehicleEventListeners(idsNoHash) {
        for (let i = 0; i < idsNoHash.length; i++) {
            $(document).on("click", "#" + idsNoHash[i] + "MoreInfo", (e) => {
                e.preventDefault();

                populateVehicalModal(vehicleInfo, idsNoHash[i], () => {
                    toggleOverlay("#moreVehicleInfoPopup", "show");
                });
            });
        }
    }

    // Shows a modal overlay based on the ajax data retrieved from vehicleInfo.json
    function populateVehicalModal(jsonData, vehicleId, callback) {
        for (let i = 0; i < jsonData.vehicles.length; i++) {
            if (jsonData.vehicles[i].vehicle === vehicleId) {
                let info = jsonData.vehicles[i];
                let popupBaseDir = $("#moreVehicleInfoPopup")[0].children[0];
                let fuelCost = calculateFuelCost(jsonData.fuelPrice, info.mileage, routeInfo.distance[1]);
                let hireCost = hireInfo.days.totalDays * info.dailyRate;
                let totalCost = (fuelCost[1] + hireCost).toFixed(2);

                let thingsToDo = [routeInfo.distance[0], hireInfo.persons + " person(s)", hireInfo.days.totalDays + " day(s)", "$" + hireCost + ".00 NZD", "Daily Rate x Hire Duration", fuelCost[0], "$" + jsonData.fuelPrice + "/litre x " + info.mileage + "/100km x " + routeInfo.distance[0], "$" + totalCost + " NZD"];

                popupBaseDir.children[1].textContent = info.name;
                popupBaseDir.children[2].setAttribute("src", info.imageURL);

                for (let j = 0; j < thingsToDo.length; j++) {
                    popupBaseDir.children[3].children[1].children[0].children[j].children[1].textContent = thingsToDo[j];
                }
            }
        }

        if (typeof callback !== "undefined") callback();
    }

    // Populates the HTML template
    function populateHtmlTemplate() {
        // Checks to see whether there are valid start and end days
        if (hireInfo.days.startDay && hireInfo.days.endDay) {
            closeAllTooltips();

            calcDays(hireInfo.days.startDay, hireInfo.days.endDay);

            if (hireInfo.days.totalDays > 0 && hireInfo.days.totalDays <= 15) {
                // Gets the HTML template
                xhrGet("./ajax/vehicle_template.html", (templateData) => {
                    htmlVehicleTemplate = templateData;
                });

                // Gets the vehicleInfo.json
                xhrGet("./json/vehicleInfo.json", (jsonData) => {
                    vehicleInfo = jsonData;

                    let allVehicles = vehicleInfo.vehicles; // array
                    let daysMatch = [];
                    let personsMatch = [];
                    let vehicleMatches = [];

                    // Adds objects that match the conditions to seperate arrays
                    for (let i = 0; i < allVehicles.length; i++) {
                        if (hireInfo.days.totalDays >= allVehicles[i].hireDays.min && hireInfo.days.totalDays <= allVehicles[i].hireDays.max) {
                            daysMatch.push(allVehicles[i]);
                        } else {
                            daysMatch.push(false);
                        }

                        if (hireInfo.persons >= allVehicles[i].persons.min && hireInfo.persons <= allVehicles[i].persons.max) {
                            personsMatch.push(allVehicles[i]);
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

                    // Sets the attributes of the vehicleMatches to
                    // properties fetched from the vehicleInfo.json file
                    for (let i = 0; i < vehicleMatches.length; i++) {
                        let template = $.parseHTML(htmlVehicleTemplate)[0];
                        let settableEls = template.children[0].children[0];

                        template.setAttribute("id", vehicleMatches[i].vehicle);

                        settableEls.children[0].textContent = vehicleMatches[i].name;
                        settableEls.children[1].setAttribute("src", vehicleMatches[i].imageURL);
                        settableEls.children[2].textContent = "$" + vehicleMatches[i].dailyRate + ".00/day";
                        settableEls.children[3].setAttribute("id", vehicleMatches[i].vehicle + "MoreInfo");

                        $(".vehicle-options").slick("slickAdd", template);
                    }

                    // Workaround for the request being too fast for the animation
                    setTimeout(() => {
                        showNextPage("#sectionSeven", "#sectionSix");
                        $(".vehicle-options").slick("slickPause"); // Slick rendering issue workaround
                        
                        switch (vehicleMatches.length) {
                            case 0:
                                toggleOverlay("#noVehicleMatchesPopup", "show");
                                break;
                            case 1:
                                // Slick rendering issue workaround
                                $(".slick-track").css("width", "auto");
                                $(".vehicle-option").css({
                                    "width": "auto",
                                    "float": "none"
                                });
                                break;
                            default:
                                break;
                        }
                    }, transitionTime);

                    if (vehicleMatches.length <= 1) {
                        $("#sectionSeven .inner .content p").css("display", "none");
                    } else {
                        $("#sectionSeven .inner .content p").css("display", "block");
                    }

                    $(".vehicle-options").slick("slickGoTo", 0); // Slick rendering issue workaround
                });
            } else {
                $("#datePickers").tooltipster("content", "Please make sure the dates selected are between 1 and 15 days");
                $("#datePickers").tooltipster("open");
            }
        } else {
            $("#datePickers").tooltipster("content", "Please make sure you have selected a start and end date");
            $("#datePickers").tooltipster("open");
        }
    }

    // Saves the current journey to the browsers localstorage
    function saveJourney(customName, callback) {
        if (customName !== "") {
            let master = {};
            let prexixedName = "wayfindr_" + customName;
    
            master.mapPoints = {};
    
            master.mapPoints.destination = mapPoints.destination;
            master.mapPoints.origin = mapPoints.origin;
            master.mapPoints.waypoints = mapPoints.waypoints;
    
            master.hireInfo = hireInfo;
            master.routeInfo = routeInfo;
    
            if (localStorage.getItem(prexixedName)) {
                $("#journeyName").tooltipster("content", "This name already exists. Please try another");
                $("#journeyName").tooltipster("open");
            } else {
                $("#journeyName").tooltipster("close");
                localStorage.setItem(prexixedName, JSON.stringify(master));
                if (typeof callback !== "undefined") callback();
            }
        } else {
            console.log("please enter a name");
            $("#journeyName").tooltipster("content", "Please enter a name to save the file as");
            $("#journeyName").tooltipster("open");
        }
    }

    // Event handler for loading a journey
    function loadJourneyEventHandler(e, index) {
        e.preventDefault();
        // let savedTrip = JSON.parse(localStorage.getItem(localStorage.key(index)));
        let savedTrip = JSON.parse(wayfindrSavedJourneys[index]);

        // All MapPoints
        let allMapPoints = savedTrip.mapPoints;
        let oldMarkers = mapPoints.markers;

        // All HireInfo
        let allHireInfo = savedTrip.hireInfo;
        
        // Route Info
        let allRouteInfo = savedTrip.routeInfo;

        allMapPoints.markers = oldMarkers;

        // Waypoints
        waypoints = allMapPoints.waypoints;

        // Final Global Assignment
        mapPoints = allMapPoints;
        hireInfo = allHireInfo;
        routeInfo = allRouteInfo;

        // Add placeholders to input fields and such
        $("#origin")[0].children[0].children[1].value = allMapPoints.origin.result.place_name;

        if (waypoints.length === 0) {
            $("#waypoints")[0].children[0].children[1].value = "";
        }
        
        if (waypoints.length > 0) {
            $("#waypoints")[0].children[0].children[1].value = waypoints[0].result.place_name;
        }

        if (waypoints.length > 1) {
            for (let i = 1; i < waypoints.length; i++) {
                addGeocoder("#waypoints", map, "Please enter a stop");
                $("#waypoints")[0].children[i].children[1].value = waypoints[i].result.place_name;
            }
        }

        $("#destination")[0].children[0].children[1].value = allMapPoints.destination.result.place_name;
        $("#peopleCounterNumber")[0].textContent = allHireInfo.persons;
        $("#datePickers")[0].children[0].value = $("[data-toggle=\"pickupDate\"]").datepicker("formatDate", new Date(allHireInfo.days.startDay));
        $("#datePickers")[0].children[3].value = $("[data-toggle=\"returnDate\"]").datepicker("formatDate", new Date(allHireInfo.days.endDay));

        // Fade the popup out
        $("#loadJourneyPopup").fadeOut(transitionTime);

        // Get the route from the savedTrip Obj
        getRoute(allMapPoints.origin.result.geometry.coordinates, allMapPoints.destination.result.geometry.coordinates, waypoints, () => {
            toggleBackgroundImage("hide");
            populateHtmlTemplate();
            showNextPage("#sectionSeven", "#sectionOne");
        });
    }

    // Loads a journey from localStorage
    function showJourneys() {
        wayfindrSavedJourneys = [];
        wayfindrSavedKey = [];
        $("#savedTrips").empty(); // Makes sure the div is empty before appending any more
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).indexOf("wayfindr_") > -1) {
                wayfindrSavedJourneys.push(localStorage.getItem(localStorage.key(i)));
                wayfindrSavedKey.push(localStorage.key(i));
            }
        }

        if (wayfindrSavedJourneys.length !== 0) {
            $("#loadJourneyPopup")[0].children[0].children[1].textContent = "Here are all of your saved journeys";
            for (let i = 0; i < wayfindrSavedJourneys.length; i++) {
                $(document).off("click", "#loadJourney" + i); // Destroy the event handlers as to not create duplicate calls

                let button = document.createElement("button");
                button.className = "btn btn-style-dark load-trip-button";
                button.setAttribute("id", "loadJourney" + i);
                button.textContent = "Load: " + wayfindrSavedKey[i].substring(9); // Removes the "wayfindr_" prefix when displaying to the user
    
                // Adds an event listener for each loadJourney ID
                $(document).on("click", "#loadJourney" + i, (e) => {
                    loadJourneyEventHandler(e, i);
                });
    
                $("#savedTrips").append(button);
            }
        } else {
            $("#loadJourneyPopup")[0].children[0].children[1].textContent = "You don't seem to have any saved journeys. Journeys you save will appear here!";
        }
    }

    ////////////////////////
    //// Event Handlers ////
    ////////////////////////

    //
    // Click Handlers
    //

    // "How to" event listeners

    $("#showHideMap").click((e) => {
        e.preventDefault();
        toggleContent();
    });

    $("#howToText").click((e) => {
        e.preventDefault();
        toggleOverlay("#howDoIWorkPopup", "show");
    });

    $("#howDoIWorkPopupClose").click((e) => {
        e.preventDefault();
        toggleOverlay("#howDoIWorkPopup", "hide");
    });

    // Form Presentation Event Listeners

    // Section One

    $("#sectionOneButton").click((e) => {
        e.preventDefault();
        showNextPage("#sectionTwo", "#sectionOne");
        toggleBackgroundImage("hide");
    });

    $("#loadJourney").click((e) => {
        e.preventDefault();
        showJourneys();
        toggleOverlay("#loadJourneyPopup", "show");
    });

    $("#loadJourneyPopupClose").click((e) => {
        e.preventDefault();
        toggleOverlay("#loadJourneyPopup", "hide");
    });

    // Section Two

    $("#sectionTwoButtonNext").click((e) => {
        e.preventDefault();

        if (mapPoints.origin) {
            showNextPage("#sectionThree", "#sectionTwo");
        } else {
            $("#origin").tooltipster("open");
        }
    });

    $("#sectionTwoButtonBack").click((e) => {
        e.preventDefault();
        closeAllTooltips();
        toggleBackgroundImage("show");
        showPreviousPage("#sectionOne", "#sectionTwo");
    });

    // Section Three

    $("#sectionThreeButtonNext").click((e) => {
        e.preventDefault();

        let waypointInputs = $("#waypoints").children();
        mapPoints.waypoints = []; // Makes sure the array is empty

        // Checks the input value of each "waypointInputs" field
        // against the same index of the local "waypoints" array
        // ensuring that fields left blank aren't added to the route
        for (let i = 0; i < waypointInputs.length; i++) {
            if (waypointInputs[i].children[1].value !== "") {
                mapPoints.waypoints.push(waypoints[i]);
            }
        }

        closeAllTooltips();

        showNextPage("#sectionFour", "#sectionThree");
    });

    $("#sectionThreeButtonBack").click((e) => {
        e.preventDefault();
        closeAllTooltips();
        showPreviousPage("#sectionTwo", "#sectionThree");
    });

    $("#anotherStop").click((e) => {
        e.preventDefault();

        let allInputs = $("#waypoints").children();
        let valueArray = [];

        closeAllTooltips();

        // Loops through each waypoint input and pushes the input value to the valueArray
        for (let i = 0; i < allInputs.length; i++) {
            valueArray.push(allInputs[i].children[1].value);
        }

        // If an input is empty, don't add another input field to the DOM
        if (valueArray.every((val) => { return val !== ""; })) {
            addGeocoder("#waypoints", map, "Please enter a stop");
        } else {
            $("#waypoints").tooltipster("open");
            setTimeout(() => {
                closeAllTooltips();
            }, 2500);
        }
    });

    // Section Four

    $("#sectionFourButtonNext").click((e) => {
        e.preventDefault();
        if (mapPoints.destination) {
            getRoute(mapPoints.origin.result.geometry.coordinates, mapPoints.destination.result.geometry.coordinates, mapPoints.waypoints, () => {
                showNextPage("#sectionFive", "#sectionFour");

                let distance = getRouteDistance(routeInfo.data.routes[0].distance);
                let hireDays = recommendedHireDays(distance[1]);

                routeInfo.distance = distance;

                $("#minDaysHireSuggestion").text(hireDays);
            });
        } else {
            $("#destination").tooltipster("open");
        }
    });

    $("#sectionFourButtonBack").click((e) => {
        e.preventDefault();
        closeAllTooltips();
        showPreviousPage("#sectionThree", "#sectionFour");
    });

    // Section Five

    // Decrease counter click handler
    $("#decreasePeopleCounter").click((e) => {
        e.preventDefault();
        increaseOrDecreaseCounter("decrease");
    });

    // Increase counter click handler
    $("#increasePeopleCounter").click((e) => {
        e.preventDefault();
        increaseOrDecreaseCounter("increase");
    });

    $("#sectionFiveButtonNext").click((e) => {
        e.preventDefault();
        hireInfo.persons = $("#peopleCounterNumber").text();
        closeAllTooltips();
        showNextPage("#sectionSix", "#sectionFive");
    });

    $("#sectionFiveButtonBack").click((e) => {
        e.preventDefault();
        closeAllTooltips();
        showPreviousPage("#sectionFour", "#sectionFive");
    });

    // Section Six

    // Date picker event handlers
    $("[data-toggle=\"pickupDate\"]").on("pick.datepicker", (e) => {
        hireInfo.days.startDay = Date.parse(e.date);
        $("[data-toggle=\"returnDate\"]").datepicker("setStartDate", new Date(hireInfo.days.startDay));
    });

    $("[data-toggle=\"returnDate\"]").on("pick.datepicker", (e) => {
        hireInfo.days.endDay = Date.parse(e.date);
        $("[data-toggle=\"pickupDate\"]").datepicker("setEndDate", new Date(hireInfo.days.endDay));
    });

    $("[data-toggle=\"pickupDate\"], [data-toggle=\"returnDate\"]").datepicker({
        autoHide: true,
        format: "dd/mm/yyyy",
        startDate: new Date()
    });

    $("[data-toggle=\"pickupDate\"], [data-toggle=\"returnDate\"]").on("pick.datepicker", (e) => {
        if (hireInfo.days.startDay && hireInfo.days.endDay) {
            // Fires off the bounce effect
            $("#sectionSixButtonNext").animateCss("bounce");
        }
    });

    $("#sectionSixButtonNext").click((e) => {
        e.preventDefault();
        populateHtmlTemplate();
    });

    $("#sectionSixButtonBack").click((e) => {
        e.preventDefault();
        closeAllTooltips();
        showPreviousPage("#sectionFive", "#sectionSix");
    });

    // Section Seven

    $("#moreVehicleInfoPopupClose").click((e) => {
        e.preventDefault();
        toggleOverlay("#moreVehicleInfoPopup", "hide");
    });

    // Journey Editing

    $("#editJourney").click((e) => {
        e.preventDefault();
        // Removes all slides from slick
        $(".vehicle-option").each(() => {
            $(".vehicle-options").slick("slickRemove", 0);
        });

        showPreviousPage("#sectionTwo", "#sectionSeven");
    });

    $("#saveJourney").click((e) => {
        e.preventDefault();
        toggleOverlay("#saveJourneyNamePopup", "show");
    });

    $("#declineSave").click((e) => {
        e.preventDefault();
        closeAllTooltips();
        toggleOverlay("#saveJourneyNamePopup", "hide");
    });

    $("#confirmSave").click((e) => {
        e.preventDefault();
        saveJourney($("#journeyName").val(), () => {
            toggleOverlay("#saveJourneyNamePopup", "hide");
        });
    });

    $("#modifyRequestButton").click((e) => {
        e.preventDefault();
        toggleOverlay("#noVehicleMatchesPopup", "hide");
        showPreviousPage("#sectionFive", "#sectionSeven");
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