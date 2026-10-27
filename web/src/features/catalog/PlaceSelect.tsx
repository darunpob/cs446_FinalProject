import { SelectInput } from "../../design-system/Field";
import { useDirectory } from "./DirectoryProvider";

interface PlaceSelectProps {
  id?: string;
  value: string;
  onChange: (placeId: string) => void;
  invalid?: boolean;
  placeholder: string;
  describedBy?: string;
}

export function PlaceSelect({ id, value, onChange, invalid, placeholder, describedBy }: PlaceSelectProps) {
  const { placesByZone } = useDirectory();
  return (
    <SelectInput id={id} value={value} onChange={(event) => onChange(event.target.value)} invalid={invalid} aria-describedby={describedBy}>
      <option value="" disabled>{placeholder}</option>
      {placesByZone.map(([zone, places]) => (
        <optgroup key={zone} label={zone}>
          {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
        </optgroup>
      ))}
    </SelectInput>
  );
}
