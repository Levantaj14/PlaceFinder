import { insertIntoCollection } from './connectToMongo.js';
import { checkCity, checkCountry } from './citiesAndCountries.js';

function hasAllTheKeys(objectKeys, keys) {
  return !keys.every((key) => objectKeys.includes(key));
}

export async function postListing(body, username) {
  if (
    hasAllTheKeys(Object.keys(body), [
      'title',
      'description',
      'country',
      'city',
      'street',
      'number',
      'district',
      'roomNumber',
      'price',
      'area',
      'dateOfAvailability',
    ])
  ) {
    return 'incomplete data';
  }
  const dateOfAvailability = new Date(body.dateOfAvailability);
  if (
    Number.isNaN(Number(body.number)) ||
    Number.isNaN(Number(body.roomNumber)) ||
    Number.isNaN(Number(body.price)) ||
    Number.isNaN(Number(body.area)) ||
    dateOfAvailability.toString() === 'Invalid Date'
  ) {
    return 'invalid data';
  }
  if (dateOfAvailability > new Date()) {
    return 'incorrect date';
  }
  if (checkCountry(body.country) !== 'OK') {
    return 'invalid country';
  }
  if (checkCity(body.country, body.city) !== 'OK') {
    return 'invalid city';
  }
  if (body.number !== '' && body.street === '') {
    return 'missing street';
  }
  body.pictures = [];
  body.user = username;
  body.price = Number(body.price);
  await insertIntoCollection('listings', body);
  return 1;
}
