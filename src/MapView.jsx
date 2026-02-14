import { LoadScript, GoogleMap } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100vh"
};

const center = {
  lat: 43.6532,
  lng: -79.3832
};

export default function MapView() {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={() => console.log("Map component mounted")}
      /> 
    </LoadScript>
  );
}
