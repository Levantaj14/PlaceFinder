import { ObjectId } from 'mongodb';
import { findOne, insertIntoCollection, updateData } from './connectToMongo.js';

export async function uploadPicture(id, file) {
  let aux;
  try {
    aux = await findOne('listings', { _id: new ObjectId(id) });
  } catch (e) {
    return -1;
  }
  if (aux === null) {
    return -1;
  }
  const response = await insertIntoCollection('pictures', {
    listingID: aux._id,
    fileName: file,
  });
  aux.pictures.push(response.insertedId);
  await updateData('listings', { _id: new ObjectId(id) }, { $set: { pictures: aux.pictures } });
  return 1;
}
