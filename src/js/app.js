$(document).ready(function() {
    ///////////////////////////////
    //// Variable Declarations ////
    ///////////////////////////////

    const carsJsonUrl = "../json/vehicleInfo.json",
        nzCenter = [172.5, -41.278919];

    ///////////////////////////////
    //// Function Declarations ////
    ///////////////////////////////

    ////////////////////////
    //// Event Handlers ////
    ////////////////////////

    $("#howToText").click((e) => {
        e.preventDefault();
        // Do something
    });

    ////////////////
    //// MapBox ////
    ////////////////

    mapboxgl.accessToken = "pk.eyJ1IjoiZm9ycmVzdHdpbHNvbiIsImEiOiJjamFicGc4ejAwMmN0MnFxdWY3OGYyMW04In0.8hjX9IJyvPY_lkNdoaIBfw";
    
    var map = new mapboxgl.Map({
        container: "map", // Map div ID
        style: "mapbox://styles/mapbox/light-v9",
        center: nzCenter, // [lng, lat].
        zoom: 4.5
    });
});