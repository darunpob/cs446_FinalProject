import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { api } from "../../api/client";
import type { CampusDirectory, CampusPlace, DropOffPoint } from "../../api/contract";
import { useApiQuery } from "../../api/useApiQuery";
import type { Messages } from "../../i18n/messages/th";
import { useI18n } from "../../i18n/useI18n";

interface DirectoryLookup {
  ready: boolean;
  directory: CampusDirectory;
  placeName: (placeId: string) => string;
  dropOffPoint: (dropOffId: string) => DropOffPoint | undefined;
  placesByZone: Array<[string, CampusPlace[]]>;
}

const EMPTY_DIRECTORY: CampusDirectory = { foundLocations: [], dropOffPoints: [] };

const DirectoryContext = createContext<DirectoryLookup | null>(null);

/** Swaps API place / drop-off text for the active language when a translation exists. */
function localizeDirectory(directory: CampusDirectory, text: Messages["directory"]): CampusDirectory {
  return {
    foundLocations: directory.foundLocations.map((place) => ({ ...place, ...text.places[place.id] })),
    dropOffPoints: directory.dropOffPoints.map((point) => ({ ...point, ...text.dropOffs[point.id] })),
  };
}

function groupByZone(places: CampusPlace[]): Array<[string, CampusPlace[]]> {
  const zones = new Map<string, CampusPlace[]>();
  places.forEach((place) => zones.set(place.zone, [...(zones.get(place.zone) ?? []), place]));
  return [...zones.entries()];
}

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const { state } = useApiQuery(() => api.getDirectory(), []);
  const { t } = useI18n();
  const sourceDirectory = state.phase === "ready" ? state.value : EMPTY_DIRECTORY;

  const lookup = useMemo<DirectoryLookup>(() => {
    const directory = localizeDirectory(sourceDirectory, t.directory);
    const places = new Map(directory.foundLocations.map((place) => [place.id, place.name]));
    const dropOffs = new Map(directory.dropOffPoints.map((point) => [point.id, point]));
    return {
      ready: state.phase === "ready",
      directory,
      placeName: (placeId) => places.get(placeId) ?? t.directory.unknownPlace,
      dropOffPoint: (dropOffId) => dropOffs.get(dropOffId),
      placesByZone: groupByZone(directory.foundLocations),
    };
  }, [sourceDirectory, state.phase, t]);

  return <DirectoryContext.Provider value={lookup}>{children}</DirectoryContext.Provider>;
}

export function useDirectory(): DirectoryLookup {
  const lookup = useContext(DirectoryContext);
  if (!lookup) throw new Error("useDirectory must be used inside <DirectoryProvider>");
  return lookup;
}
