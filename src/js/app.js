$(document).ready(() => {
    ///////////////////////////////
    //// Variable Declarations ////
    ///////////////////////////////

    // Immutable variables
    const carsJsonUrl = "../json/vehicleInfo.json",
        nzCenter = [172.5, -41.278919],
        transitionSpeed = 400;

    // Mutable variables
    let $windowHeight = $(window).height(),
        $windowWidth = $(window).width(),
        howDoIWorkOverlayShowing = false;

    ///////////////////////////////
    //// Function Declarations ////
    ///////////////////////////////

    function updateScreenDimensions() {
        $windowHeight = $(window).height();
        $windowWidth = $(window).width();
        console.log("Screen size changed: H:", $windowHeight, "W:", $windowWidth);
    }

    function toggleHowDoIWorkOverlay() {
        if (howDoIWorkOverlayShowing) {
            $("#mask").fadeOut(transitionSpeed);
            $("#howDoIWorkPopup").fadeOut(transitionSpeed);
            howDoIWorkOverlayShowing = false;
        } else {
            $("#mask").fadeIn(transitionSpeed);
            $("#howDoIWorkPopup").fadeIn(transitionSpeed);
            howDoIWorkOverlayShowing = true;
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
        toggleHowDoIWorkOverlay();
    });

    // Section fade in/out handlers
    $("#sectionOneButton").click(() => {
        $("#sectionOne").addClass("hidden");
        $("#sectionTwo").show();

        setTimeout(() => {
            $("#sectionOne").hide();
            $("#sectionTwo").removeClass("hidden");
        }, transitionSpeed);
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