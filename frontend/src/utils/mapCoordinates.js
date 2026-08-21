export function geoJsonToLeaflet(coordinates = []) {
  return coordinates
    .filter((coordinate) => Array.isArray(coordinate) && coordinate.length >= 2)
    .map(([longitude, latitude]) => [latitude, longitude]);
}

export function locationToLeaflet(location) {
  return location && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))
    ? [Number(location.latitude), Number(location.longitude)]
    : null;
}
