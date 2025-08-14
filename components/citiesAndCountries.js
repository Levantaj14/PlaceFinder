const cities = {};

export async function initialiseLocations() {
  const response = await fetch('https://countriesnow.space/api/v0.1/countries');
  const citiesAux = await response.json();
  for (let i = 0; i < citiesAux.data.length; i++) {
    cities[citiesAux.data[i].country] = citiesAux.data[i].cities;
  }
  console.log('Cities are ready.');
}

export function getCities(country) {
  return cities[country];
}

export function getCountries() {
  return Object.keys(cities);
}

export function checkCountry(country) {
  if (Object.keys(cities).includes(country)) {
    return 'OK';
  }
  return 'No such country';
}

export function checkCity(country, city) {
  if (cities[country].includes(city) || (cities[country].length === 0 && city === '-')) {
    return 'OK';
  }
  return 'No such city';
}
