import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { api } from "../../api/client";
import type { CampusDirectory, CampusPlace, DropOffPoint } from "../../api/contract";
import { useApiQuery } from "../../api/useApiQuery";

interface DirectoryLookup {
  ready: boolean;
  directory: CampusDirectory;
  placeName: (placeId: string) => string;
  dropOffPoint: (dropOffId: string) => DropOffPoint | undefined;
  placesByZone: Array<[string, CampusPlace[]]>;
}

const EMPTY_DIRECTORY: CampusDirectory = { foundLocations: [], dropOffPoints: [] };

const DirectoryContext = createContext<DirectoryLookup | null>(null);

function groupByZone(places: CampusPlace[]): Array<[string, CampusPlace[]]> {
  const zones = new Map<string, CampusPlace[]>();
  places.forEach((place) => zones.set(place.zone, [...(zones.get(place.zone) ?? []), place]));
  return [...zones.entries()];
}

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const { state } = useApiQuery(() => api.getDirectory(), []);
  const directory = state.phase === "ready" ? state.value : EMPTY_DIRECTORY;

  const lookup = useMemo<DirectoryLookup>(() => {
    const places = new Map(directory.foundLocations.map((place) => [place.id, place.name]));
    const dropOffs = new Map(directory.dropOffPoints.map((point) => [point.id, point]));
    return {
      ready: state.phase === "ready",
      directory,
      placeName: (placeId) => places.get(placeId) ?? "ไม่ระบุสถานที่",
      dropOffPoint: (dropOffId) => dropOffs.get(dropOffId),
      placesByZone: groupByZone(directory.foundLocations),
    };
  }, [directory, state.phase]);

  return <DirectoryContext.Provider value={lookup}>{children}</DirectoryContext.Provider>;
}

export function useDirectory(): DirectoryLookup {
  const lookup = useContext(DirectoryContext);
  if (!lookup) throw new Error("useDirectory must be used inside <DirectoryProvider>");
  return lookup;
}
