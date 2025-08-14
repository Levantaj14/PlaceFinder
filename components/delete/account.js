import { deleteData, filterCollection, filterDelete } from '../connectToMongo.js';
import { deleteListing } from './listing.js';

export async function deleteAccount(username) {
  const listings = await filterCollection('listings', { user: username });
  for (let i = 0; i < listings.length; i++) {
    deleteListing(listings[i]._id);
  }
  await deleteData('users', { username });
  await filterDelete('messages', { user: username });
}
