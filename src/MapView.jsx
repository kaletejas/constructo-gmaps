import { GoogleMap, LoadScript, Marker, InfoWindow, TrafficLayer } from "@react-google-maps/api";
import { useState } from "react";

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function MapView() {
  const [selectedSite, setSelectedSite] = useState(null);

  const constructionSites = [
    {
      id: 1,
      name: "Road Repair - King St",
      position: { lat: 43.6532, lng: -79.3832 },
      details: "Lane closures expected. Duration: 2 weeks."
    },
    {
      id: 2,
      name: "Water Pipe Replacement - Bathurst",
      position: { lat: 43.6539, lng: -79.4111 },
      details: "Water service disruptions possible."
    }
  ];

  const mapContainerStyle = {
    width: "100%",
    height: "600px",
    borderRadius: "8px"
  };

  const center = { lat: 43.6532, lng: -79.3832 };

  return (
    <div>
      <h2>Toronto Construction — Google Maps Build</h2>

      <LoadScript googleMapsApiKey={GOOGLE_API_KEY}>
        <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={12}>

          {/* Traffic Layer Enabled */}
          <TrafficLayer autoUpdate />

          {constructionSites.map(site => (
            <Marker
              key={site.id}
              position={site.position}
              onClick={() => setSelectedSite(site)}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
              }}
            />
          ))}

          {selectedSite && (
            <InfoWindow
              position={selectedSite.position}
              onCloseClick={() => setSelectedSite(null)}
            >
              <div>
                <h4>{selectedSite.name}</h4>
                <p>{selectedSite.details}</p>
              </div>
            </InfoWindow>
          )}

        </GoogleMap>
      </LoadScript>
    </div>
  );
}
