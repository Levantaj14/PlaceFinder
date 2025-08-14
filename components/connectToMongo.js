import { MongoClient } from 'mongodb';

const dbUrl = 'mongodb://localhost:27017/';
const client = new MongoClient(dbUrl);
let db;

export async function initialiseConnection() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('PlaceFinder');
  } catch (e) {
    console.error(e);
  }
}

export async function filterDelete(collectionName, rules) {
  await db.collection(collectionName).deleteMany(rules);
}

export async function deleteData(collectionName, rules) {
  await db.collection(collectionName).deleteOne(rules);
}

export async function updateData(collectionName, rules, updateTo) {
  await db.collection(collectionName).updateOne(rules, updateTo);
}

export function getEverything(collectionName) {
  return db.collection(collectionName).find().toArray();
}

export function filterCollection(collectionName, filter) {
  return db.collection(collectionName).find(filter).toArray();
}

export function findOne(collectionName, rules) {
  return db.collection(collectionName).findOne(rules);
}

export function insertIntoCollection(collectionName, data) {
  return db.collection(collectionName).insertOne(data);
}
