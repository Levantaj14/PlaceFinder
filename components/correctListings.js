import { filterCollection, getEverything } from './connectToMongo.js';

export function getCorrectListings(username, isAdmin) {
  if (isAdmin === 'true') {
    return getEverything('listings');
  }
  return filterCollection('listings', { user: username });
}
