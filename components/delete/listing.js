import { ObjectId } from 'mongodb';
import { deleteData, filterCollection, filterDelete } from '../connectToMongo.js';
import { deletePicture } from './picture.js';

export async function deleteListing(listingID) {
  const aux = await filterCollection('pictures', { listingID: new ObjectId(listingID) });
  for (let i = 0; i < aux.length; i++) {
    deletePicture(aux[i].fileName);
  }
  try {
    await filterDelete('messages', { listingID: new ObjectId(listingID) });
    await filterDelete('pictures', { listingID: new ObjectId(listingID) });
    await deleteData('listings', { _id: new ObjectId(listingID) });
  } catch (e) {
    console.error(e);
  }
}
