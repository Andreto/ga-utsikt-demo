var mapElem = document.getElementById('map');
var mapLogElem = document.getElementById('map-log');
var mapLoaderElem = document.getElementById('map-loader');
var calcButtonElem = document.getElementById('calc-button');
var locatorButton = document.getElementById('locator-button');
var locatorSvg = document.getElementById('locator-svg');
var sateliteButton = document.getElementById('satelite-button');
var sateliteSvg = document.getElementById('satelite-svg');
var nextDemoElem = document.getElementById('demo-right');
var prevDemoElem = document.getElementById('demo-left');

var sateliteMapOn = false;
var blockMapClick = false;

proj4.defs([
    ['WGS84', '+proj=longlat +datum=WGS84 +no_defs'],
    ['ETRS89', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs']
]);

var calcChoordsETRS = proj4('WGS84', 'ETRS89', [18.07, 59.33]);

// Configure map element
var map = L.map('map').setView([59.33, 18.07], 6);
mapboxMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/outdoors-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiYW5kcmV0byIsImEiOiJja24zZGxndzUwN3hlMnhvMDhjenlhbHFyIn0.qJGRxlYtndUtH-QNQa8LZA'
})

mapboxMap.addTo(map);

googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

// Create map-marker and tile bounding-box

var calcLocation = L.marker([59.33, 18.07], {
    color: '#FB5258',
}).addTo(map);

var pl, hz; // Map-items that displays view-poly-lines and horizon-line

////// MAP-DEMO //////
var pl;

calcDemos = [
    {'obj': cdNrk, 'name': 'Svältmon, Norrköping', 'lat': 58.654138, 'lon': 16.077654, 'vh': 2},
    {'obj': cdKeb, 'name': 'Kebnekaises nordtopp', 'lat': 67.903667, 'lon': 18.526145, 'vh': 2},
    {'obj': cdAre, 'name': 'Härjångsfjällen, Åre (U)', 'lat': 63.019267, 'lon': 12.590838, 'vh': 2},
    {'obj': cdsAre, 'name': 'Härjångsfjällen, Åre', 'lat': 63.019267, 'lon': 12.590838, 'vh': 2},
    {'obj': cdJan, 'name': 'Långe Jan, Ölands södra uddde', 'lat': 56.196162, 'lon': 16.398396, 'vh': 39},
    {'obj': cdsBrahe, 'name': 'Brahehus, Gränna', 'lat': 58.053093, 'lon': 14.504669, 'vh': 2}
]

function setDemo() {
    calcLocation.setLatLng([calcDemos[demoI].lat, calcDemos[demoI].lon]);
    pl = L.polyline(calcDemos[demoI].obj, { color: '#B13A3C', weight: 2 }).addTo(map);
    map.flyTo([calcDemos[demoI].lat, calcDemos[demoI].lon], 8);
    document.getElementById('obshInput').value = calcDemos[demoI].vh;
    document.getElementById('demo-name').innerText = calcDemos[demoI].name;
    document.getElementById('lat-disp').innerText = calcDemos[demoI].lat;
    document.getElementById('lon-disp').innerText = calcDemos[demoI].lon;
}

demoI = Math.floor(Math.random()*calcDemos.length);
setDemo();


function onResize(e) {
    var leafScale = document.getElementsByClassName('leaflet-control-scale-line')[0];
    var scaleInd = document.getElementById('scale-ind');
    var lfTxt = leafScale.innerText.split(' ');
    scaleInd.style.width = (String(parseInt(leafScale.style.width.replace('px', ''))*4)+'px');
    scaleInd.innerText = String(parseInt(lfTxt[0])*4) + ' ' + lfTxt[1];
}

var scaleElem = document.createElement('div');
scaleElem.classList.add('scale-indicator');
scaleElem.innerHTML = '<div class="scale-indicator-text" id="scale-ind">100 m</div>';
document.getElementsByClassName('leaflet-control-container')[0].appendChild(scaleElem);

// Define event-listeners
map.on('click');
map.on('zoomend', onResize);
L.control.scale().addTo(map);

// Map Action-buttons
locatorButton.addEventListener('click', function () {
    locatorSvg.classList.add('spinAnim');
    map.locate({setView: true, maxZoom: 16});
});
locatorSvg.addEventListener('animationend', function () {
    locatorSvg.classList.remove('spinAnim');
});
locatorSvg.addEventListener('mouseover', function () {
    blockMapClick = true;
});
locatorSvg.addEventListener('mouseout', function () {
    blockMapClick = false;
});

sateliteButton.addEventListener('click', function () {
    if (sateliteMapOn) {
        googleSat.remove(map);
        sateliteMapOn = false;
    } else {
        googleSat.addTo(map);
        sateliteMapOn = true;
    }
    sateliteSvg.classList.add('flipCardAnim');
});
sateliteSvg.addEventListener('animationend', function () {
    sateliteSvg.classList.remove('flipCardAnim');
});
sateliteSvg.addEventListener('mouseover', function () {
    blockMapClick = true;
});
sateliteSvg.addEventListener('mouseout', function () {
    blockMapClick = false;
});

nextDemoElem.addEventListener('click', function () {
    map.removeLayer(pl);
    demoI = (demoI+1)%calcDemos.length;
    setDemo();
});

prevDemoElem.addEventListener('click', function () {
    map.removeLayer(pl);
    demoI = (demoI-1+calcDemos.length)%calcDemos.length;
    setDemo();
});