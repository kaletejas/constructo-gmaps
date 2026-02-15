import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const containerStyle = {
  width: "100%",
  height: "100%"
};

const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832
};

export default function MapView() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [locations, setLocations] = useState([]);

  // Fetch projects using bbox
  const fetchProjects = () => {
    if (!mapRef.current) return;

    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const url = `http://localhost:5000/api/projects?xmin=${sw.lng()}&ymin=${sw.lat()}&xmax=${ne.lng()}&ymax=${ne.lat()}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log("Projects returned:", data.length);
        setLocations(data);
      })
      .catch(err => console.error("Fetch error:", err));
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous cluster
    if (clusterRef.current) {
      clusterRef.current.clearMarkers();
    }

    // Remove old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create single InfoWindow instance
    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }

    // Create markers
    const markers = locations.map(loc => {
      const marker = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        title: loc.canonical_name
      });

      marker.addListener("click", () => {
        const formattedDate = loc.start_date
          ? new Date(loc.start_date).toLocaleDateString()
          : "N/A";

        infoWindowRef.current.setContent(`
          <div style="min-width:220px">
            <h3 style="margin:0 0 8px 0;">${loc.canonical_name}</h3>
            <p><strong>ID:</strong> ${loc.id}</p>
            <p><strong>Status:</strong> ${loc.status}</p>
            <p><strong>Category:</strong> ${loc.category}</p>
            <p><strong>Start:</strong> ${formattedDate}</p>
          </div>
        `);

        infoWindowRef.current.open({
          anchor: marker,
          map: mapRef.current
        });
      });

      return marker;
    });

    markersRef.current = markers;

    clusterRef.current = new MarkerClusterer({
      map: mapRef.current,
      markers
    });

  }, [locations]);

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={11}
      onLoad={(map) => {
        mapRef.current = map;
        fetchProjects();
      }}
      onIdle={fetchProjects}
    />
  );
}
