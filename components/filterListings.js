import { filterCollection } from './connectToMongo.js';

function filterGenerator(body, check) {
  const fields = {};
  if (body.city != null && check[0]) {
    fields.city = body.city;
  }
  if (body.district != null && check[1]) {
    fields.district = body.district;
  }
  if (check[2] && check[3]) {
    fields.price = {
      $gte: Number(body.minPrice),
      $lte: Number(body.maxPrice),
    };
  } else if (check[2]) {
    fields.price = {
      $gte: Number(body.minPrice),
    };
  } else if (check[3]) {
    fields.price = {
      $lte: Number(body.maxPrice),
    };
  }
  return fields;
}

export function filterListings(body) {
  if (
    (body.minPrice !== '' && Number.isNaN(Number(body.minPrice))) ||
    (body.maxPrice !== '' && Number.isNaN(Number(body.maxPrice)))
  ) {
    return 'prices must be numbers';
  }
  if (Number(body.minPrice) < 0 || Number(body.maxPrice) < 0) {
    return 'negative price';
  }
  if (body.minPrice !== '' && body.maxPrice !== '' && Number(body.minPrice) > Number(body.maxPrice)) {
    return 'minimum > maximum';
  }
  const check = [body.city !== '', body.district !== '', body.minPrice !== '', body.maxPrice !== ''];
  return filterCollection('listings', filterGenerator(body, check));
}
