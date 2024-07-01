import bbox from '@turf/bbox';
import { useRef } from 'react';
import MapboxMap, { Layer, Source, type MapRef } from 'react-map-gl';

import type { Coordinates } from '@/types/journey';
import { trpc } from '@/utils/trpc';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const getDeduplicatedFeatures = (journeys: Coordinates[]): Feature[] => {
  const features: Feature[] = [];

  journeys.forEach((journey) => {
    journey.sections.forEach((section) => {
      // Create a set to store the unique coordinates
      const uniqueCoordinates = new Set<string>();

      // Loop through the passes in the section
      section.passes.forEach((pass) => {
        // Convert the coordinates to a string
        const coordinatesStr = JSON.stringify([pass.stationCoordinateY, pass.stationCoordinateX]);

        // Add the coordinates to the set if they are not already present
        if (!uniqueCoordinates.has(coordinatesStr)) {
          uniqueCoordinates.add(coordinatesStr);
        }
      });

      // Create a Feature object for the section
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [...uniqueCoordinates].map((coordinatesStr) => JSON.parse(coordinatesStr)),
        },
        properties: null,
      });
    });
  });

  return features;
};

const getGeoData = (journeys: Coordinates[]): FeatureCollection<Geometry, GeoJsonProperties> => ({
  type: 'FeatureCollection',
  features: getDeduplicatedFeatures(journeys),
});

export const Map: React.FC = () => {
  const mapRef = useRef<MapRef>(null);

  const { data: stats } = trpc.stats.getAll.useQuery(undefined, {
    onSuccess: (stats) => {
      const journeys = stats?.coordinates ?? [];

      if (journeys.length === 0) return;

      const geoData = getGeoData(journeys);

      const [minLng, minLat, maxLng, maxLat] = bbox(geoData);

      mapRef?.current?.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 60, duration: 0 }
      );
    },
  });

  const journeys = stats?.coordinates ?? [];
  const geoData = getGeoData(journeys);

  return (
    <div className="col-span-1 lg:col-span-2">
      <MapboxMap
        ref={mapRef}
        cooperativeGestures
        style={{
          width: '100%',
          height: '100%',
          minHeight: 450,
          overflow: 'hidden',
          borderRadius: 8,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        }}
        initialViewState={{
          latitude: 50.3769,
          longitude: 8.5417,
          zoom: 3,
        }}
        mapStyle="mapbox://styles/mapbox/light-v10"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Source id="polylineLayer" type="geojson" data={geoData}>
          <Layer
            id="lineLayer"
            type="line"
            source="my-data"
            layout={{
              'line-join': 'round',
              'line-cap': 'round',
            }}
            paint={{
              'line-color': '#902D41',
              'line-width': 3,
            }}
          />
        </Source>
      </MapboxMap>
    </div>
  );
};
