$(document).ready(() => {
    ///////////////////////////////
    //// Variable Declarations ////
    ///////////////////////////////

    // Immutable variables
    const carsJsonUrl = "../json/vehicleInfo.json",
        nzCenter = [172.5, -41.278919], // Center coordinates for NZ
        transitionTime = 400,
        scaleFactor = 2;

    // Mutable variables
    let $windowHeight = $(window).height(),
        $windowWidth = $(window).width(),
        howDoIWorkOverlayShowing = false,
        backgroundImageIsShowing = true,
        mapPoints = {};

    ///////////////////////////////
    //// Function Declarations ////
    ///////////////////////////////

    // Functions to be called on page load are in this IIFE
    (() => {
        showFormPage("sectionOne");
    })();

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

    // Form Presentation Buttons

    $("#sectionOneButton").click((e) => {
        e.preventDefault();
        showNextPage("sectionTwo", "sectionOne");
        toggleBackgroundImage();
    });

    $("#sectionTwoButtonNext").click((e) => {
        e.preventDefault();
        if (mapPoints.origin) {
            showNextPage("sectionThree", "sectionTwo");
        } else {
            console.log("Not ready");
        }
    });

    $("#sectionTwoButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionOne", "sectionTwo");
        toggleBackgroundImage();
    });

    $("#sectionThreeButtonNext").click((e) => {
        e.preventDefault();
        showNextPage("sectionFour", "sectionThree");
    });

    $("#sectionThreeButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionTwo", "sectionThree");
    });

    $("#anotherStop").click((e) => {
        e.preventDefault();
        addGeocoder("waypointWrapper", map, "Something");
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

    ////////////////
    //// MapBox ////
    ////////////////

    mapboxgl.accessToken = "pk.eyJ1IjoiZm9ycmVzdHdpbHNvbiIsImEiOiJjamFicGc4ejAwMmN0MnFxdWY3OGYyMW04In0.8hjX9IJyvPY_lkNdoaIBfw";
    
    let map = new mapboxgl.Map({
        container: "map", // Map div ID
        style: "mapbox://styles/mapbox/light-v9",
        center: nzCenter, // [lng, lat].
        zoom: 4.5,
        interactive: false
    });

    console.log("Map", map);

    // let directions = new MapboxDirections({
    //     accessToken: mapboxgl.accessToken,
    //     units: "metric"
    // });

    function addGeocoder(id, map, placeholder) {
        let geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            country: "NZ", // Limits searches to NZ
            limit: 5,
            placeholder: placeholder
        });

        map.addControl(geocoder);

        document.getElementById(id).appendChild(geocoder.onAdd(map));

        let ctrlEl = document.getElementsByClassName("mapboxgl-ctrl-top-right");
        ctrlEl[0].removeChild(ctrlEl[0].children[0]);

        geocoder.on("result", (e) => {
            console.log("Event", e);
            mapPoints[id] = e.result.geometry.coordinates;
            console.log("Map Points", mapPoints);
        });
    }

    addGeocoder("origin", map, "Please enter a start point");
    addGeocoder("waypoints", map, "Please enter a stop");
    addGeocoder("destination", map, "Please enter your destination");
});