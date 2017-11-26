$(document).ready(() => {
    ///////////////////////////////
    //// Variable Declarations ////
    ///////////////////////////////

    // Immutable variables
    const carsJsonUrl = "../json/vehicleInfo.json",
        nzCenter = [172.5, -41.278919],
        transitionTime = 400,
        scaleFactor = 2;

    // Mutable variables
    let $windowHeight = $(window).height(),
        $windowWidth = $(window).width(),
        howDoIWorkOverlayShowing = false;

    ///////////////////////////////
    //// Function Declarations ////
    ///////////////////////////////

    // Functions to be called on page load are in this IIFE
    (() => {
        showFormPage("sectionOne");
    })();

    function updateScreenDimensions() {
        $windowHeight = $(window).height();
        $windowWidth = $(window).width();
        console.log("Screen size changed: H:", $windowHeight, "W:", $windowWidth);
    }

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

    function showFormPage(id) {
        let elToShow = document.getElementById(id);

        elToShow.style.visibility = "visible";
        elToShow.style.opacity = 1.0;
        elToShow.style.transform = "scale(1)";
    }

    function showNextPage(idToShow, idToHide) {
        let elToShow = document.getElementById(idToShow);
        let elToHide = document.getElementById(idToHide);

        // idToHide has to scale up and fade out
            // scale(scaleFactor) and opacity: 0

        elToHide.style.transform = "scale(" + scaleFactor + ")";
        elToHide.style.opacity = 0;

        // set a timeout so the visibility can be set to hidden
            // scale(0)

        setTimeout(() => {
            elToHide.style.visibility = "hidden";
            elToHide.style.transform = "scale(0)";
        }, transitionTime);

        // idToShow scale set to 0
        // "" visibility has to be set to visible
        // "" opacity has to be set to 1
        // timeout "" scale set to 1

        elToShow.style.visibility = "visible";
        elToShow.style.opacity = 1;
        elToShow.style.transform = "scale(1)";
    }

    function showPreviousPage(idToShow, idToHide) {
        let elToShow = document.getElementById(idToShow);
        let elToHide = document.getElementById(idToHide);

        // elToHide opacity to 0
        // "" scale to 0
        // "" timeout visibility to hidden

        elToHide.style.opacity = 0;
        elToHide.style.transform = "scale(0)";

        setTimeout(() => {
            elToHide.style.visibility = "hidden";
        }, transitionTime);

        // elToShow transition speed to 0ms
        // "" visibility to visible
        // "" opacity 1
        // "" scale 1

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
    });

    $("#sectionTwoButtonBack").click((e) => {
        e.preventDefault();
        showPreviousPage("sectionOne", "sectionTwo");
    });

    // Window Resize Handler

    $(window).on("resize", () => {
        updateScreenDimensions();
    });

    ////////////////
    //// MapBox ////
    ////////////////

    mapboxgl.accessToken = "pk.eyJ1IjoiZm9ycmVzdHdpbHNvbiIsImEiOiJjamFicGc4ejAwMmN0MnFxdWY3OGYyMW04In0.8hjX9IJyvPY_lkNdoaIBfw";
    
    var map = new mapboxgl.Map({
        container: "map", // Map div ID
        style: "mapbox://styles/mapbox/light-v9",
        center: nzCenter, // [lng, lat].
        zoom: 4.5,
        interactive: false
    });
});