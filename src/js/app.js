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
    let vehicleOverlayShowing = false;
    let saveJourneyConfirmationShowing = false;
    let loadJourneyPopupIsShowing = false;
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

    // HTML Template response
    let htmlVehicleTemplate = null;

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

    // Toggles the load journey popup
    function toggleLoadJourneyPopup() {
        if (loadJourneyPopupIsShowing) {
            $("#mask").fadeOut(transitionTime);
            $("#loadJourneyPopup").fadeOut(transitionTime);
            loadJourneyPopupIsShowing = false;
        } else {
            $("#mask").fadeIn(transitionTime);
            $("#loadJourneyPopup").fadeIn(transitionTime);
            loadJourneyPopupIsShowing = true;
        }
    }

    // Toggles the background image based on the backgroundImageIsShowing boolean
    function toggleBackgroundImage(showing) {
        switch (showing) {
            case "show":
                $("#backgroundImage").fadeIn(transitionTime);
                break;

            case "hide":
                $("#backgroundImage").fadeOut(transitionTime);
                break;

            default:
                console.log("Bad case");
                break;
        }
    }

    // Toggles the modal popup displaying vehicle information
    function toggleVehicleOverlay() {
        if (vehicleOverlayShowing) {
            $("#moreVehicleInfoPopup").fadeOut(transitionTime);
            $("#mask").fadeOut(transitionTime);
            vehicleOverlayShowing = false;
        } else {
            $("#moreVehicleInfoPopup").fadeIn(transitionTime);
            $("#mask").fadeIn(transitionTime);
            vehicleOverlayShowing = true;
        }
    }

    // Toggles the save confirmation window for saving a journey
    function toggleSaveJourneyConfirmation() {
        if (saveJourneyConfirmationShowing) {
            $("#saveJourneyNamePopup").fadeOut(transitionTime);
            $("#mask").fadeOut(transitionTime);
            saveJourneyConfirmationShowing = false;
        } else {
            $("#saveJourneyNamePopup").fadeIn(transitionTime);
            $("#mask").fadeIn(transitionTime);
            saveJourneyConfirmationShowing = true;
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
        const geocoderInput = $(".mapboxgl-ctrl-geocoder");

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
                    break;
                case "#destination":
                    mapPoints.destination = e;
                    break;
                case "#waypoints":
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
                    console.log("Not a valid case");
                    break;
            }
        }

        counterTimeout = setTimeout(() => {
            closeAllTooltips();
        }, 2500);
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
            $("#datePickers").tooltipster("content", "You can't have a hire for less than 1 day");
            $("#datePickers").tooltipster("open");
        } else {
            closeAllTooltips();
            hireInfo.days.totalDays = days;
            callback();
        }
    }

    // Calculates the fuel cost of the journey
    function calculateFuelCost(pricePerLitre, vehicleMileage, tripDistance) {
        let fuelCost = pricePerLitre * (vehicleMileage/100) * tripDistance;
        return ["$" + fuelCost.toFixed(2) + " NZD", parseFloat(fuelCost.toFixed(2))];
    }

    // Shows a modal overlay based on the ajax data retrieved from vehicleInfo.json
    function populateVehicalModal(jsonData, vehicleId, callback) {
        for (let i in jsonData.vehicles) {
            if (jsonData.vehicles[i].vehicle === vehicleId) {
                let info = jsonData.vehicles[i];
                let popupBaseDir = $("#moreVehicleInfoPopup")[0].children[0];
                let fuelCost = calculateFuelCost(jsonData.fuelPrice, info.mileage, routeInfo.distance[1]);
                let hireCost = hireInfo.days.totalDays * info.dailyRate;
                let totalCost = (fuelCost[1] + hireCost).toFixed(2);

                let thingsToDo = [routeInfo.distance[0], hireInfo.persons + " person(s)", hireInfo.days.totalDays + " day(s)", "$" + hireCost + ".00 NZD", "Daily Rate x Hire Duration", fuelCost[0], "$" + jsonData.fuelPrice + "/litre x " + info.mileage + "/100km x " + routeInfo.distance[0], "$" + totalCost + " NZD"];

                popupBaseDir.children[1].textContent = info.name;
                popupBaseDir.children[2].setAttribute("src", info.imageURL);

                for (let j in thingsToDo) {
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
                        for (let i in allVehicles) {
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
                        for (let i in allVehicles) {
                            if ((daysMatch[i] === personsMatch[i]) && (daysMatch[i] && personsMatch[i] !== false)) {
                                vehicleMatches.push(allVehicles[i]);
                            }
                        }

                        console.log("vehicle matches", vehicleMatches);
                        console.log("html vehicle template", htmlVehicleTemplate);

                        // Sets the attributes of the vehicleMatches to
                        // properties fetched from the vehicleInfo.json file
                        for (let i in vehicleMatches) {
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
                            
                            // Slick rendering issue workaround
                            if (vehicleMatches.length === 1) {
                                $(".slick-track").css("width", "auto");
                                $(".vehicle-option").css({
                                    "width": "auto",
                                    "float": "none"
                                });
                            }
                        }, transitionTime);

                        $(".vehicle-options").slick("slickGoTo", 0); // Slick rendering issue workaround
                    });
                });
            });

        } else {
            $("#datePickers").tooltipster("open");
        }
    }

    // Saves the current journey to the browsers localstorage
    function saveJourney(customName, callback) {
        let master = {};

        master.mapPoints = {};

        master.mapPoints.destination = mapPoints.destination;
        master.mapPoints.origin = mapPoints.origin;
        master.mapPoints.waypoints = mapPoints.waypoints;
        master.mapPoints.markers = [];

        master.hireInfo = hireInfo;
        master.routeInfo = routeInfo;

        console.log("Master", master);

        if (localStorage.getItem(customName)) {
            console.log("This journey already exists. Please try a different name");
        } else {
            localStorage.setItem(customName, JSON.stringify(master));
            if (typeof callback !== "undefined") callback();
        }
    }

    // Loads a journey from localStorage
    function showJourneys() {
        $("#savedTrips").empty(); // Makes sure the UL is empty before appending any more
        for (let i = 0; i < localStorage.length; i++) {
            let button = document.createElement("button");
            button.className = "btn btn-style-dark";
            button.setAttribute("id", "loadJourney" + i);
            button.textContent = "Load " + localStorage.key(i);

            // Adds an event listener for each loadJourney ID
            $(document).one("click", "#loadJourney" + i, (e) => {
                e.preventDefault();

                let savedTrip = JSON.parse(localStorage.getItem(localStorage.key(i)));
                console.log(savedTrip);

                mapPoints = savedTrip.mapPoints;
                hireInfo = savedTrip.hireInfo;
                routeInfo = savedTrip.routeInfo;

                $("#loadJourneyPopup").fadeOut(transitionTime);
                loadJourneyPopupIsShowing = false;

                getRoute(savedTrip.mapPoints.origin.result.geometry.coordinates, savedTrip.mapPoints.destination.result.geometry.coordinates, savedTrip.mapPoints.waypoints, () => {
                    toggleBackgroundImage("hide");

                    populateHtmlTemplate();

                    showNextPage("#sectionSeven", "#sectionOne");
                });
            });

            $("#savedTrips").append(button);
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
        showNextPage("#sectionTwo", "#sectionOne");
        toggleBackgroundImage("hide");
    });

    $("#loadJourney").click((e) => {
        e.preventDefault();
        showJourneys();
        toggleLoadJourneyPopup();
    });

    $("#loadJourneyPopupClose").click((e) => {
        e.preventDefault();
        toggleLoadJourneyPopup();
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

    // Modal Overlay Buttons
    $(document).on("click", "#motorbikeMoreInfo", (e) => {
        e.preventDefault();

        populateVehicalModal(vehicleInfo, "motorbike", () => {
            toggleVehicleOverlay();
        });
    });

    $(document).on("click", "#smallCarMoreInfo", (e) => {
        e.preventDefault();

        populateVehicalModal(vehicleInfo, "smallCar", () => {
            toggleVehicleOverlay();
        });
    });

    $(document).on("click", "#largeCarMoreInfo", (e) => {
        e.preventDefault();

        populateVehicalModal(vehicleInfo, "largeCar", () => {
            toggleVehicleOverlay();
        });
    });

    $(document).on("click", "#motorHomeMoreInfo", (e) => {
        e.preventDefault();

        populateVehicalModal(vehicleInfo, "motorHome", () => {
            toggleVehicleOverlay();
        });
    });

    $("#moreVehicleInfoPopupClose").click((e) => {
        e.preventDefault();
        toggleVehicleOverlay();
    });

    // Journey Editing

    $("#editJourney").click((e) => {
        e.preventDefault();
        // Removes all slides from slick
        for (let i in $(".vehicle-option")) {
            $(".vehicle-options").slick("slickRemove", 0);
        }
        showPreviousPage("#sectionTwo", "#sectionSeven");
    });

    $("#saveJourney").click((e) => {
        e.preventDefault();
        toggleSaveJourneyConfirmation();
    });

    $("#declineSave").click((e) => {
        e.preventDefault();
        toggleSaveJourneyConfirmation();
    });

    $("#confirmSave").click((e) => {
        e.preventDefault();
        saveJourney($("#journeyName").val());
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