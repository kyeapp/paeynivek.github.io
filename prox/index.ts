// This example displays a marker at the center of Australia.
// When the user clicks the marker, an info window opens.

const celsiusAndBeyondLatLng = { lat: 37.777545, lng: -122.460488 };
const API_KEY = 'AIzaSyD7CE4Vf9wnEt60scexvLuCAbNw26xKF-E';
var circle: google.maps.Circle;

function initMap(): void {
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 14,
      center: celsiusAndBeyondLatLng,
    }
  );

  placeCelsiusAndBeyondMarker(map);
  placeStudentMarkers(map);
  initAutocompleteSearch(map);

}

// visualization of a prozimity radius
function drawCircle(map: google.maps.Map, center: google.maps.LatLng): google.maps.Circle {
  if (circle) {
    circle.setMap(null);
  }
  circle = new google.maps.Circle({
    strokeColor: "#282828",
    strokeOpacity: 0.5,
    strokeWeight: 2,
    fillColor: "#282828",
    fillOpacity: 0.15,
    map,
    center: center,
    radius: 1609.34, // 1 mile in meters
  });

  return circle;
}

function initAutocompleteSearch(map: google.maps.Map): void {
  const card = document.getElementById("pac-card") as HTMLElement;
  const input = document.getElementById("pac-input") as HTMLInputElement;
  const biasInputElement = document.getElementById(
    "use-location-bias"
  ) as HTMLInputElement;
  const strictBoundsInputElement = document.getElementById(
    "use-strict-bounds"
  ) as HTMLInputElement;
  const options = {
    fields: ["formatted_address", "geometry", "name"],
    strictBounds: false,
    types: ["establishment"],
  };

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

  const autocomplete = new google.maps.places.Autocomplete(input, options);

  // Bind the map's bounds (viewport) property to the autocomplete object,
  // so that the autocomplete requests use the current map bounds for the
  // bounds option in the request.
  autocomplete.bindTo("bounds", map);

  const infowindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById(
    "infowindow-content"
  ) as HTMLElement;

  infowindow.setContent(infowindowContent);

  const marker = new google.maps.Marker({
    map,
    anchorPoint: new google.maps.Point(0, -29),
  });

  autocomplete.addListener("place_changed", () => {
    infowindow.close();
    marker.setVisible(false);

    const place = autocomplete.getPlace();

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
    const radioButton = document.getElementById(id) as HTMLInputElement;

    radioButton.addEventListener("click", () => {
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

  biasInputElement.addEventListener("change", () => {
    if (biasInputElement.checked) {
      autocomplete.bindTo("bounds", map);
    } else {
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

  strictBoundsInputElement.addEventListener("change", () => {
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

function placeCelsiusAndBeyondMarker(map: google.maps.Map): void {
  const logoImage = "https://celsiusandbeyond.com/wp-content/themes/celsius/images/logo.svg"
  const celsiusContent =
    '<div id="content">' +
    '<div id="siteNotice">' +
    "</div>" +
    '<h1 id="firstHeading" class="firstHeading">Celsius and Beyond</h1>' +
    '<div id="bodyContent">' +
    "<p>" +
    "140 Balboa St, San Francisco, CA 94118" +
    "</p>" +
    "</div>" +
    "</div>";

  const infowindow = new google.maps.InfoWindow({
    content: celsiusContent,
    ariaLabel: "Celsius and Beyond",
  });

  const svgMarker = {
    path: "M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
    fillColor: "blue",
    fillOpacity: 0.6,
    strokeWeight: 0,
    rotation: 0,
    scale: 2,
    anchor: new google.maps.Point(0, 20),
  };
  const marker = new google.maps.Marker({
    position: celsiusAndBeyondLatLng,
    map,
    title: "Celsius and Beyond",
    icon: svgMarker,
  });

  marker.addListener("click", () => {
    infowindow.open({
      anchor: marker,
      map,
    });
  });
}

async function getGeocode(address: string): Promise<google.maps.GeocoderResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;

    try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'OK') {
        if (data.results.length > 1) {
          console.warn(`geocode lookup of ${address} resulted in multiple results`)
        }
        if (data.results[0].partial_match) {
          console.warn(`geocode lookup of ${address} resulted in a partial match. Please check the accuracy of this address.`)
        }
        return data.results[0];
      } else {
        throw new Error(data.status);
      }
    } else {
      throw new Error(`bad response from geocode request. ${response}`);
    }
  } catch (error) {
    throw new Error(`An error occurred during geocode request for address '${address}': ${error.message}`);
  }
}

async function getStudents(): Promise<Student[]> {
  var SHEET_ID = '1Xbs4noiVT1gInKLBrKjB1m-zNjcskWeQ9ntmcbY-cio';
  var googleSheetAPI = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A2:E1000?key=${API_KEY}`;

  const res = await fetch(googleSheetAPI);
  const data = await res.json();
  const values = data.values;

  var students: Student[] = [];
  for (let i = 0; i < values.length; i++) {
    try {
      const [campGroup, initial, email, phone, address] = values[i];
      const geocodeRes = await getGeocode(address);
      students.push({
        initial: initial,
        campGroup: campGroup,
        email: email,
        phone: phone,
        formattedAddress: geocodeRes.formatted_address,
        location: geocodeRes.geometry.location,
      });

    } catch (error) {
      console.log(error)
    }

  }

  return students
}

async function placeStudentMarkers(map: google.maps.Map): Promise<void> {
  var students: Student[];
  students = await getStudents();

  for (const student of students) {
    const studentContent =
      '<div id="content">' +
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

    const studentMarker = new google.maps.Marker({
      position: student.location,
      map,
      title: student.initial,
    });

    studentMarker.addListener("click", (function (marker, content) {
      const infoWindow = new google.maps.InfoWindow({
        content: content,
        ariaLabel: student.initial,
      });
      return function () {
        infoWindow.open({
          anchor: marker,
          map,
        });
      };
    })(studentMarker, studentContent));

  }
}

class Student {
  initial: string;
  campGroup: number;
  email: string;
  phone: string;
  formattedAddress: string;
  location: google.maps.LatLng;
}

interface Window {
  initMap: () => void;
}

window.initMap = initMap;
