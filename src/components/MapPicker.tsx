import { useEffect, useRef, useState, memo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Locate } from "lucide-react";

// Fix default marker icons broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerProps {
  onLocationChange: (lat: number, lng: number, address: string) => void;
  initialAddress?: string;
}

const DEFAULT_CENTER: [number, number] = [9.005401, 38.763611]; // Addis Ababa

const MapPicker = memo(({ onLocationChange, initialAddress }: MapPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Keep a stable ref to the callback so map event handlers never go stale
  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => { onLocationChangeRef.current = onLocationChange; });

  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState(initialAddress ?? "");
  const [searchInput, setSearchInput] = useState(initialAddress ?? "");
  const [searching, setSearching] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }, []);

  const placeMarker = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", async () => {
        const pos = markerRef.current!.getLatLng();
        const addr = await reverseGeocode(pos.lat, pos.lng);
        setAddress(addr);
        setSearchInput(addr);
        onLocationChangeRef.current(pos.lat, pos.lng, addr);
      });
    }
    map.setView([lat, lng], 15);
  }, [reverseGeocode]);

  /* Init map exactly once — no dependencies that change */
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    map.on("click", async (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
      const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      setAddress(addr);
      setSearchInput(addr);
      onLocationChangeRef.current(e.latlng.lat, e.latlng.lng, addr);
    });

    // Invalidate size after mount in case container was hidden
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const searchAddress = async () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latN = parseFloat(lat);
        const lngN = parseFloat(lon);
        placeMarker(latN, lngN);
        setAddress(display_name);
        setSearchInput(display_name);
        onLocationChangeRef.current(latN, lngN, display_name);
      } else {
        setAddress("Address not found — try clicking on the map");
      }
    } catch {
      setAddress("Search failed — try clicking on the map");
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setAddress("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        placeMarker(lat, lng);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setSearchInput(addr);
        onLocationChangeRef.current(lat, lng, addr);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setAddress("Location access denied — please allow location in your browser");
        } else {
          setAddress("Could not get location — try clicking on the map");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchAddress())}
          placeholder="Search an address…"
          className="flex-1 bg-white border border-[#c9b49a] rounded-xl px-4 py-2.5 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors"
        />
        <button
          type="button"
          onClick={searchAddress}
          disabled={searching}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3E2723] hover:bg-[#E57373] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {searching ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <MapPin size={13} />
          )}
          Search
        </button>
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-[#ecddd3]">
        <div ref={mapContainerRef} className="w-full h-52" />
        {/* Use my location button */}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          title="Use my current location"
          className="absolute bottom-3 right-3 z-[400] flex items-center gap-1.5 bg-white hover:bg-[#F5EDE3] border border-[#ecddd3] shadow-md text-[#3E2723] text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {locating ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-[#3E2723]/30 border-t-[#3E2723] rounded-full animate-spin" />
          ) : (
            <Locate size={13} />
          )}
          My Location
        </button>
      </div>

      {/* Resolved address */}
      {address && (
        <p className="text-xs text-[#795548] bg-[#EAD7C3]/50 rounded-xl px-4 py-2 leading-relaxed">
          📍 {address}
        </p>
      )}

      <p className="text-[10px] text-[#c9b49a]">
        Search, click on the map, or drag the marker to set your delivery location.
      </p>
    </div>
  );
});

MapPicker.displayName = "MapPicker";

export default MapPicker;
