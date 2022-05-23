// Utsiktsberäkning | Copyright (c) 2022 Andreas Törnkvist & Moltas Lindell | CC BY-NC-SA 4.0

var mapElem = document.getElementById('map');
var mapLogElem = document.getElementById('map-log');
var mapLoaderElem = document.getElementById('map-loader');
var calcButtonElem = document.getElementById('calc-button');
var lineWeightSlider = document.getElementById('line-weight-slider');
var menuButton = document.getElementById('menu-button');
var langSelect = document.getElementById('lang-select');


var actionButtons = {ids: ['locator', 'satelite', 'zoomin', 'zoomout']};
for (var i = 0; i < actionButtons.ids.length; i++) {
    actionButtons[actionButtons.ids[i]] = {
        'button': document.getElementById(actionButtons.ids[i] + '-button'),
        'svg': document.getElementById(actionButtons.ids[i] + '-svg')
    };
    actionButtons[actionButtons.ids[i]].svg.addEventListener('mouseover', function () {
        blockMapClick = true;
    });
    actionButtons[actionButtons.ids[i]].svg.addEventListener('mouseout', function () {
        blockMapClick = false;
    });
}

var sateliteMapOn = false;
var blockMapClick = false;

var setLang = 'swe';

var furthestPoint = {i: 0, dist: 0, marker: null};

proj4.defs([
    ['WGS84', '+proj=longlat +datum=WGS84 +no_defs'],
    ['ETRS89', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs']
]);

var startCoords = [58.705586, 15.776982];
var calcChoordsETRS = proj4('WGS84', 'ETRS89', startCoords);

var baseApiUrl = '/';
baseApiUrl = 'https://api.utsiktskartan.se/';
//baseApiUrl = 'http://localhost:3000/';
if (window.location.hostname == 'andreto.github.io') {
    baseApiUrl = 'https://api.utsiktskartan.se/';  // 'http://utsiktskartan.eu-north-1.elasticbeanstalk.com/';
}




// Configure map element
var map = L.map('map', {
    zoomControl: false,
    zoomSnap: .25,
});
map.setView(startCoords, 6);
mapboxMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/outdoors-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiYW5kcmV0byIsImEiOiJja24zZGxndzUwN3hlMnhvMDhjenlhbHFyIn0.qJGRxlYtndUtH-QNQa8LZA',
})

mapboxMap.addTo(map);

googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

// Create map-marker and tile bounding-box

var calcLocation = L.marker([58.705586, 15.776982], {
    color: '#FB5258',
}).addTo(map);

function showTileGrids() {
    var tileBound;
    fetch(baseApiUrl + 'grid')
    .then(response => response.json()).then(data => {
        tileBound = L.polyline(
            data.p,
            { color: '#6977BF', weight: 2 })
            .addTo(map);
        for (i in data.l) {
            label = data.l[i];
            var marker = new L.marker(label.ch, { opacity: 0 }); //opacity may be set to zero
            marker.bindTooltip(label.txt, {permanent: true, className: "grid-label", offset: [0, 0] });
            marker.addTo(map);
        }
    });
}
// fetch('http://localhost:3000/api/points')
//     .then(response => response.json()).then(data => {
//         for (item in data) {
//             console.log("Punkt", data[item])
//             L.circle(data[item], {radius: 12.5, color: '#FF9900'}).addTo(map);
//         }
//     });

var pl, hz; // Map-items that displays view-poly-lines and horizon-line
var pld = []; var hzd = [];

// When a point on the map is clicked, this point is set as the calculation base-point
function onMapClick(e) {
    if (!blockMapClick) {
        var chETRS = proj4('WGS84', 'ETRS89', [e.latlng.lng, e.latlng.lat]);
        chETRS = [Math.round(chETRS[0] / 25) * 25, Math.round(chETRS[1] / 25) * 25];
        chWGS = proj4('ETRS89', 'WGS84', chETRS);
        calcLocation.setLatLng(chWGS.reverse());
        document.getElementById('lat-disp').innerText = chWGS[0].toFixed(6);
        document.getElementById('lon-disp').innerText = chWGS[1].toFixed(6);
        calcChoordsETRS = chETRS;
        console.log(calcChoordsETRS);
        updateMapElev(calcChoordsETRS[0], calcChoordsETRS[1]);
        //print height of clicked point
    }
}

// loadMapData runs when the calculation-button is pressed
function loadMapData(latlng) {
    mapElem.classList.add('loading');
    mapLoaderElem.classList.add('show');
    mapLogElem.classList.remove('error');

    var calcResolution = document.getElementById('resInput').value;
    var observerHeight = document.getElementById('obshInput').value;

    console.log(baseApiUrl + 'p?lon=' + calcChoordsETRS[0] + '&lat=' + calcChoordsETRS[1] + '&res=' + calcResolution + '&oh=' + observerHeight);
    fetch(baseApiUrl + 'p?lon=' + calcChoordsETRS[0] + '&lat=' + calcChoordsETRS[1] + '&res=' + calcResolution + '&oh=' + observerHeight)
        .then(response => response.json()).then(data => {
            console.log(data.toString())
            if (pl) { pl.remove(map) }
            if (hz) { hz.remove(map) }
            pl = L.polyline(data['pl'], { color: '#B13A3C', weight: 2 }).addTo(map);
            hz = L.polygon(data['hz'], { color: '#E06C75', weight: 1, fillOpacity: 0, }).addTo(map);
            mapElem.classList.remove('loading');
            mapLoaderElem.classList.remove('show');
            for (info in data['info']) {
                console.log(data['info'][info]);
            }
        }).catch((err) => {
            mapLogElem.innerHTML = err.message;
            mapLogElem.classList.add('error');
            mapElem.classList.remove('loading');
            mapLoaderElem.classList.remove('show');
            throw (err);
        });
}

function loadMapDataDirs(latlng) {
    mapElem.classList.add('loading');
    mapLoaderElem.classList.add('show');
    mapLogElem.classList.remove('error');
    furthestPoint = {i: 0, dist: 0};

    var calcResolution = document.getElementById('resInput').value;
    var observerHeight = document.getElementById('obshInput').value;

    if (pld.length > 0) {
        for (let i=0; i < pld.length; i++) {
            pld[i].remove(map);
        }
    }
    pld = [];

    for (let i=0; i < calcResolution; i++) {
        fetch(baseApiUrl + 'pd?lon=' + calcChoordsETRS[0] + '&lat=' + calcChoordsETRS[1] + '&di=' + String(i*2*(Math.PI/calcResolution)) + '&oh=' + observerHeight)
            .then(response => response.json()).then(data => {
                let p = L.polyline(data['pl'], { color: '#B13A3C', weight: 2 }).addTo(map);
                let dist = (Math.sqrt(p._bounds._northEast.lat - p._bounds._southWest.lat)**2 + (p._bounds._northEast.lng - p._bounds._southWest.lng)**2);
                
                
                if (dist > furthestPoint.dist) {
                    console.log(furthestPoint.i, pld.length);
                    if (pld.length > 0) {
                        pld[furthestPoint.i].setStyle({color: "#B13A3C"});
                    }
                    if (furthestPoint.marker == null) {
                        furthestPoint.marker = L.marker(data['pl'][data['pl'].length-1][0], {opacity: 0}).addTo(map);
                    }
                    furthestPoint.dist = dist;
                    furthestPoint.i = pld.length;
                    p.setStyle({color: "#F52201"});
                }
                pld.push(p);
                if (parseFloat(data.di) > (2*Math.PI - ((4*Math.PI)/calcResolution))) {
                    mapElem.classList.remove('loading');
                    mapLoaderElem.classList.remove('show');
                }
            });
    }
    // fetch('/api/pd?lon=' + calcChoordsETRS[0] + '&lat=' + calcChoordsETRS[1] + '&di=' + "1.8" + '&oh=' + observerHeight)
    // .then(response => response.json()).then(data => {
    //     let p = L.polyline(data['pl'], { color: '#B13A3C', weight: 2 }).addTo(map);
    //     pld.push(p);
    // });
}

function onResize(e) {
    var leafScale = document.getElementsByClassName('leaflet-control-scale-line')[0];
    var scaleInd = document.getElementById('scale-ind');
    var lfTxt = leafScale.innerText.split(' ');
    scaleInd.style.width = (String(parseInt(leafScale.style.width.replace('px', ''))*4)+'px');
    scaleInd.innerText = String(parseInt(lfTxt[0])*4) + ' ' + lfTxt[1];
}

function showGridLabels() {
    document.body.classList.toggle('show-grid-labels');
}

function updateMapElev(lon, lat) {
    document.getElementById('elevetion-display').innerHTML = 'Uppdaterar<br>...';
    console.log(baseApiUrl +'elev?lon=' + lon + '&lat=' + lat);
    fetch(baseApiUrl + 'elev?lon=' + lon + '&lat=' + lat)
    .then(response => response.json()).then(data => {
        console.log(data.elev);
        document.getElementById('elevetion-display').innerHTML = '<b>Markhöjd:</b> ' + data.elev + ' möh <br><b>Objekthöjd:</b> ' + data.obj + ' m';
    });
}

var scaleElem = document.createElement('div');
scaleElem.classList.add('scale-indicator');
scaleElem.innerHTML = '<div class="scale-indicator-text" id="scale-ind">100 m</div>';
document.getElementsByClassName('leaflet-control-container')[0].appendChild(scaleElem);

// Define event-listeners
map.on('click', onMapClick);
map.on('zoomend', onResize);
L.control.scale().addTo(map);

// Map Action-buttons
actionButtons.locator.button.addEventListener('click', function () {
    actionButtons.locator.svg.classList.add('spinAnim');
    map.locate({setView: true, maxZoom: 16});
});
actionButtons.locator.svg.addEventListener('animationend', function () {
    actionButtons.locator.svg.classList.remove('spinAnim');
});
actionButtons.satelite.button.addEventListener('click', function () {
    if (sateliteMapOn) {
        googleSat.remove(map);
        sateliteMapOn = false;
    } else {
        googleSat.addTo(map);
        sateliteMapOn = true;
    }
    actionButtons.satelite.svg.classList.add('flipCardAnim');
});
actionButtons.satelite.svg.addEventListener('animationend', function () {
    actionButtons.satelite.svg.classList.remove('flipCardAnim');
});
actionButtons.zoomin.button.addEventListener('click', function () {
    map.zoomIn();
});
actionButtons.zoomout.button.addEventListener('click', function () {
    map.zoomOut();
});


menuButton.addEventListener('click', function() {
    document.getElementById('side-menu').classList.toggle('expanded');
});


// Control panel buttons
calcButtonElem.addEventListener('click', function () {
    loadMapDataDirs(calcLocation.getLatLng())
});
lineWeightSlider.addEventListener('input', function () {
    for (let i=0; i < pld.length; i++) {
        pld[i].setStyle({ weight: this.value });
    }
});



// Inital setup
onMapClick({latlng: {lat: startCoords[0], lng: startCoords[1]}});

//   map.locate({setView: true, maxZoom: 9}); // :TODO:

// for (const property in hillExport) {
//     item = hillExport[property]
//     x = item.y*25 + 4600000
//     y = -item.x*25 + 4000000
//     if(item.h > 250){
//         console.log("Punkt", )
//         L.circle(proj4('ETRS89', 'WGS84', [x, y]).reverse(), {radius: 12.5, color: '#FF9900'}).addTo(map);
//     }
// }

//d0vis = L.polyline(testData0['pl'], {color: '#AACB41', weight: 4}).addTo(map);
//d1vis = L.polyline(testData1['pl'], {color: '#519ABA', weight: 2}).addTo(map);