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
  const [locations, setLocations] = useState([]);

  // Fetch projects using bounding box
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
        setLocations(data);
      })
      .catch(err => console.error("Fetch error:", err));
  };

  // Create & cluster markers whenever locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    if (clusterRef.current) {
      clusterRef.current.clearMarkers();
    }

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    const markers = locations.map(loc => {
      return new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        title: loc.name
      });
    });

    markersRef.current = markers;

    // Create new clusterer
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
        fetchProjects(); // Initial load
      }}
      onIdle={fetchProjects} // Fetch when user moves/zooms
    />
  );
}
