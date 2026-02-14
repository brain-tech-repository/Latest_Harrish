import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import SidebarBtn from "./dashboardSidebarBtn";
import IconButton from "@mui/material/IconButton";
import RoomIcon from "@mui/icons-material/Room";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import InputFields from "./inputFields";

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onSave: (lat: string, lng: string) => void;
  initialLat?: string;
  initialLng?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  open,
  onClose,
  onSave,
  initialLat,
  initialLng,
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
  });

  const [selected, setSelected] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLat && initialLng
      ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) }
      : null
  );

  const [center, setCenter] = useState({
    lat: initialLat ? parseFloat(initialLat) : 0.27498,
    lng: initialLng ? parseFloat(initialLng) : 32.602878,
  });

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setSelected({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Location</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "400px" }}
              center={selected || center}
              zoom={14}
              onClick={handleMapClick}
            >
              {selected && (
                <Marker position={selected} />
              )}
            </GoogleMap>
          ) : (
            <Box height={400}>
              <span>Loading map...</span>
            </Box>
          )}
        </Box>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4ex">
          <InputFields
            disabled
            label="Latitude"
            value={selected?.lat !== undefined ? String(selected.lat) : ""}
            onChange={() => {}}
          />
          <InputFields
            disabled
            label="Longitude"
            value={selected?.lng !== undefined ? String(selected.lng) : ""}
            onChange={() => {}}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <SidebarBtn
          label="Cancel"
          onClick={onClose}
          disabled={false}
          buttonTw="px-4 py-2 min-h-10"
          className="mr-2 cursor-pointer"
        />
        <SidebarBtn
          label="Save"
          isActive={true}
          onClick={() => {
            if (selected) {
              onSave(selected.lat.toString(), selected.lng.toString());
            }
            onClose();
          }}
          disabled={!selected}
          buttonTw="px-4 py-2 min-h-10"
          className="cursor-pointer"
        />
      </DialogActions>
    </Dialog>
  );
};

interface LocationInputProps {
  label?: string;
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
  error?: boolean;
  helperText?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  label = "Latitude",
  lat,
  lng,
  onChange,
  error,
  helperText,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField
        label={label}
        type="number"
        value={lat}
        onChange={(e) => onChange(e.target.value, lng)}
        error={error}
        helperText={helperText}
        size="small"
      />
      <IconButton onClick={() => setOpen(true)}>
        <RoomIcon color="primary" />
      </IconButton>
      <LocationPicker
        open={open}
        onClose={() => setOpen(false)}
        onSave={(newLat, newLng) => onChange(newLat, newLng)}
        initialLat={lat}
        initialLng={lng}
      />
    </Box>
  );
};
