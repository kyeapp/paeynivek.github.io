// This example displays a marker at the center of Australia.
// When the user clicks the marker, an info window opens.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var celsiusAndBeyondLatLng = { lat: 37.777545, lng: -122.460488 };
var API_KEY = 'AIzaSyD7CE4Vf9wnEt60scexvLuCAbNw26xKF-E';
var circle;
function initMap() {
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: celsiusAndBeyondLatLng,
    });
    placeCelsiusAndBeyondMarker(map);
    placeStudentMarkers(map);
    initAutocompleteSearch(map);
}
// visualization of a prozimity radius
function drawCircle(map, center) {
    if (circle) {
        circle.setMap(null);
    }
    circle = new google.maps.Circle({
        strokeColor: "#282828",
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: "#282828",
        fillOpacity: 0.15,
        map: map,
        center: center,
        radius: 1609.34, // 1 mile in meters
    });
    return circle;
}
function initAutocompleteSearch(map) {
    var card = document.getElementById("pac-card");
    var input = document.getElementById("pac-input");
    var biasInputElement = document.getElementById("use-location-bias");
    var strictBoundsInputElement = document.getElementById("use-strict-bounds");
    var options = {
        fields: ["formatted_address", "geometry", "name"],
        strictBounds: false,
        types: ["establishment"],
    };
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
    var autocomplete = new google.maps.places.Autocomplete(input, options);
    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.
    autocomplete.bindTo("bounds", map);
    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById("infowindow-content");
    infowindow.setContent(infowindowContent);
    var marker = new google.maps.Marker({
        map: map,
        anchorPoint: new google.maps.Point(0, -29),
    });
    autocomplete.addListener("place_changed", function () {
        infowindow.close();
        marker.setVisible(false);
        var place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }
        // If the place has a geometry, then present it on a map.
        map.setCenter(place.geometry.location);
        circle = drawCircle(map, place.geometry.location);
        // if (place.geometry.viewport) {
        //   map.fitBounds(place.geometry.viewport);
        // } else {
        //   map.setCenter(place.geometry.location);
        //   map.setZoom(17);
        // }
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);
        infowindowContent.children["place-name"].textContent = place.name;
        infowindowContent.children["place-address"].textContent =
            place.formatted_address;
        infowindow.open(map, marker);
    });
    // Sets a listener on a radio button to change the filter type on Places
    // Autocomplete.
    function setupClickListener(id, types) {
        var radioButton = document.getElementById(id);
        radioButton.addEventListener("click", function () {
            autocomplete.setTypes(types);
            input.value = "";
        });
    }
    setupClickListener("changetype-all", []);
    setupClickListener("changetype-address", ["address"]);
    setupClickListener("changetype-establishment", ["establishment"]);
    setupClickListener("changetype-geocode", ["geocode"]);
    setupClickListener("changetype-cities", ["(cities)"]);
    setupClickListener("changetype-regions", ["(regions)"]);
    biasInputElement.addEventListener("change", function () {
        if (biasInputElement.checked) {
            autocomplete.bindTo("bounds", map);
        }
        else {
            // User wants to turn off location bias, so three things need to happen:
            // 1. Unbind from map
            // 2. Reset the bounds to whole world
            // 3. Uncheck the strict bounds checkbox UI (which also disables strict bounds)
            autocomplete.unbind("bounds");
            autocomplete.setBounds({ east: 180, west: -180, north: 90, south: -90 });
            strictBoundsInputElement.checked = biasInputElement.checked;
        }
        input.value = "";
    });
    strictBoundsInputElement.addEventListener("change", function () {
        autocomplete.setOptions({
            strictBounds: strictBoundsInputElement.checked,
        });
        if (strictBoundsInputElement.checked) {
            biasInputElement.checked = strictBoundsInputElement.checked;
            autocomplete.bindTo("bounds", map);
        }
        input.value = "";
    });
}
function placeCelsiusAndBeyondMarker(map) {
    var logoImage = "https://celsiusandbeyond.com/wp-content/themes/celsius/images/logo.svg";
    var celsiusContent = '<div id="content">' +
        '<div id="siteNotice">' +
        "</div>" +
        '<h1 id="firstHeading" class="firstHeading">Celsius and Beyond</h1>' +
        '<div id="bodyContent">' +
        "<p>" +
        "140 Balboa St, San Francisco, CA 94118" +
        "</p>" +
        "</div>" +
        "</div>";
    var infowindow = new google.maps.InfoWindow({
        content: celsiusContent,
        ariaLabel: "Celsius and Beyond",
    });
    var svgMarker = {
        path: "M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
        fillColor: "blue",
        fillOpacity: 0.6,
        strokeWeight: 0,
        rotation: 0,
        scale: 2,
        anchor: new google.maps.Point(0, 20),
    };
    var marker = new google.maps.Marker({
        position: celsiusAndBeyondLatLng,
        map: map,
        title: "Celsius and Beyond",
        icon: svgMarker,
    });
    marker.addListener("click", function () {
        infowindow.open({
            anchor: marker,
            map: map,
        });
    });
}
function getGeocode(address) {
    return __awaiter(this, void 0, void 0, function () {
        var url, response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://maps.googleapis.com/maps/api/geocode/json?address=".concat(encodeURIComponent(address), "&key=").concat(API_KEY);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch(url)];
                case 2:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data.status === 'OK') {
                        if (data.results.length > 1) {
                            console.warn("geocode lookup of ".concat(address, " resulted in multiple results"));
                        }
                        if (data.results[0].partial_match) {
                            console.warn("geocode lookup of ".concat(address, " resulted in a partial match. Please check the accuracy of this address."));
                        }
                        return [2 /*return*/, data.results[0]];
                    }
                    else {
                        throw new Error(data.status);
                    }
                    return [3 /*break*/, 5];
                case 4: throw new Error("bad response from geocode request. ".concat(response));
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    throw new Error("An error occurred during geocode request for address '".concat(address, "': ").concat(error_1.message));
                case 7: return [2 /*return*/];
            }
        });
    });
}
function getStudents() {
    return __awaiter(this, void 0, void 0, function () {
        var SHEET_ID, googleSheetAPI, res, data, values, students, i, _a, campGroup, initial, email, phone, address, geocodeRes, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    SHEET_ID = '1Xbs4noiVT1gInKLBrKjB1m-zNjcskWeQ9ntmcbY-cio';
                    googleSheetAPI = "https://sheets.googleapis.com/v4/spreadsheets/".concat(SHEET_ID, "/values/A2:E1000?key=").concat(API_KEY);
                    return [4 /*yield*/, fetch(googleSheetAPI)];
                case 1:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _b.sent();
                    values = data.values;
                    students = [];
                    i = 0;
                    _b.label = 3;
                case 3:
                    if (!(i < values.length)) return [3 /*break*/, 8];
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    _a = values[i], campGroup = _a[0], initial = _a[1], email = _a[2], phone = _a[3], address = _a[4];
                    return [4 /*yield*/, getGeocode(address)];
                case 5:
                    geocodeRes = _b.sent();
                    students.push({
                        initial: initial,
                        campGroup: campGroup,
                        email: email,
                        phone: phone,
                        formattedAddress: geocodeRes.formatted_address,
                        location: geocodeRes.geometry.location,
                    });
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _b.sent();
                    console.log(error_2);
                    return [3 /*break*/, 7];
                case 7:
                    i++;
                    return [3 /*break*/, 3];
                case 8: return [2 /*return*/, students];
            }
        });
    });
}
function placeStudentMarkers(map) {
    return __awaiter(this, void 0, void 0, function () {
        var students, _loop_1, _i, students_1, student;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getStudents()];
                case 1:
                    students = _a.sent();
                    _loop_1 = function (student) {
                        var studentContent = '<div id="content">' +
                            '<div id="siteNotice">' +
                            "</div>" +
                            '<h1 id="firstHeading" class="firstHeading">' + student.initial + '</h1>' +
                            '<div id="bodyContent">' +
                            "<p>" +
                            "email: " + student.email +
                            "<br>" +
                            "phone: " + student.phone +
                            "<br>" +
                            "address: " + student.formattedAddress +
                            "</p>" +
                            "</div>" +
                            "</div>";
                        var studentMarker = new google.maps.Marker({
                            position: student.location,
                            map: map,
                            title: student.initial,
                        });
                        studentMarker.addListener("click", (function (marker, content) {
                            var infoWindow = new google.maps.InfoWindow({
                                content: content,
                                ariaLabel: student.initial,
                            });
                            return function () {
                                infoWindow.open({
                                    anchor: marker,
                                    map: map,
                                });
                            };
                        })(studentMarker, studentContent));
                    };
                    for (_i = 0, students_1 = students; _i < students_1.length; _i++) {
                        student = students_1[_i];
                        _loop_1(student);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var Student = /** @class */ (function () {
    function Student() {
    }
    return Student;
}());
window.initMap = initMap;
