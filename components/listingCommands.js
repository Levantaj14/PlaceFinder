import express from 'express';
import { ObjectId } from 'mongodb';
import { filterListings } from './filterListings.js';
import {
  deleteData,
  filterCollection,
  findOne,
  getEverything,
  insertIntoCollection,
  updateData,
} from './connectToMongo.js';
import { isAuthenticated, isThisMine } from '../middlewares/loginStatus.js';
import { deleteListing } from './delete/listing.js';
import { getCities } from './citiesAndCountries.js';

const route = express.Router();

route.post('/filteredListings', express.urlencoded(), async (req, res) => {
  const response = await filterListings(req.body);
  switch (response) {
    case 'prices must be numbers':
      return res.status(400).render('index', {
        alerting: 'error',
        message: 'The prices must be numbers.',
        listings: await getEverything('listings'),
        loggedIn: req.loggedIn,
        username: req.username,
        isAdmin: req.isAdmin,
      });
    case 'negative prices':
      return res.status(400).render('index', {
        alerting: 'error',
        message: "The prices can't be a negative number.",
        listings: await getEverything('listings'),
        loggedIn: req.loggedIn,
        username: req.username,
        isAdmin: req.isAdmin,
      });
    case 'minimum > maximum':
      return res.status(400).render('index', {
        alerting: 'error',
        message: "The minimum price can't be lower than the maximum price.",
        listings: response,
        loggedIn: req.loggedIn,
        username: req.username,
        isAdmin: req.isAdmin,
      });
    default:
      return res.status(200).render('index', {
        alerting: 'no alert',
        message: '',
        listings: response,
        loggedIn: req.loggedIn,
        username: req.username,
        isAdmin: req.isAdmin,
      });
  }
});

route.get('/showListing', async (req, res) => {
  if (req.query.id === undefined) {
    return res.status(400).render('errorPage', {
      title: 'It looks like you know our listings better than we do.',
      heading: 'The listing you are trying to look at does not exist.',
      code: '400 Bad Request',
      loggedIn: req.loggedIn,
      username: req.username,
    });
  }
  try {
    const pictures = await filterCollection('pictures', { listingID: new ObjectId(req.query.id) });
    const theListing = await findOne('listings', { _id: new ObjectId(req.query.id) });
    return res.status(200).render('moreData', {
      listing: theListing,
      pictures,
      hasAccess: theListing.user === req.username,
      alerting: 'no alert',
      message: '',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
    });
  } catch (err) {
    return res.status(400).render('errorPage', {
      title: 'It looks like you know our listings better than we do.',
      heading: 'The listing you are trying to look at does not exist.',
      code: '400 Bad Request',
      loggedIn: req.loggedIn,
      username: req.username,
    });
  }
});

route.get('/getAdditionalData', async (req, res) => {
  if (req.query.id === undefined) {
    return res.status(400).send('Incomplete request. Please provide an id.');
  }
  const theListing = await findOne('listings', { _id: new ObjectId(req.query.id) });
  if (theListing !== null) {
    const response = {
      roomNumber: Number(theListing.roomNumber),
      date: theListing.dateOfAvailability,
    };
    return res.status(200).send(JSON.stringify(response));
  }
  return res.status(404).send('Not found');
});

route.delete('/deleteListing', isThisMine, async (req, res) => {
  if (req.query.id === null) {
    return res.status(400).send('The listing id was not provided');
  }
  try {
    await deleteListing(req.query.id);
    return res.status(200).send('Done');
  } catch (err) {
    console.log(err);
    return res.status(500).send('Error');
  }
});

route.post('/editListing', express.json(), isThisMine, async (req, res) => {
  if (
    req.body.listingID === null ||
    req.body.title === null ||
    req.body.description === null ||
    req.body.price === null
  ) {
    return res.status(400).send('Incomplete data');
  }
  if (Number.isNaN(Number(req.body.price))) {
    return res.status(400).send('The price is not a number');
  }
  try {
    await updateData(
      'listings',
      { _id: new ObjectId(req.body.listingID) },
      {
        $set: {
          title: req.body.title,
          price: Number(req.body.price),
          description: req.body.description,
        },
      },
    );
    return res.status(200).send('Success');
  } catch (err) {
    return res.status(500).send('There was an error.');
  }
});

route.post('/getCities', express.json(), isAuthenticated, (req, res) => {
  try {
    const response = getCities(req.body.country);
    return res.status(200).send(JSON.stringify(response));
  } catch (err) {
    return res.status(400).send('There is no such country in our database.');
  }
});

route.get('/messages', isThisMine, async (req, res) => {
  try {
    const theListing = await findOne('listings', { _id: new ObjectId(req.query.id) });
    const messages = await filterCollection('messages', { listingID: new ObjectId(req.query.id) });
    return res.status(200).render('messagesPage', {
      listing: theListing,
      interest: messages,
      loggedIn: req.loggedIn,
      username: req.username,
    });
  } catch (e) {
    return res.status(500).render('errorPage', {
      title: 'Ops, something happened on our end',
      heading: 'There was an error retrieving data from your listing.',
      code: '500 Internal Server Error',
      loggedIn: req.loggedIn,
      username: req.username,
    });
  }
});

route.post('/sendMessage', isAuthenticated, express.urlencoded(), async (req, res) => {
  const pictures = await filterCollection('pictures', { listingID: new ObjectId(req.body.listingID) });
  const theListing = await findOne('listings', { _id: new ObjectId(req.body.listingID) });
  if (req.body.message === '' || req.body.message === undefined) {
    return res.status(400).render('moreData', {
      listing: theListing,
      pictures,
      hasAccess: theListing.user === req.username,
      alerting: 'error',
      message: "You can't send an empty message",
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
    });
  }
  try {
    await insertIntoCollection('messages', {
      user: req.username,
      message: req.body.message,
      contact: req.body.contact === undefined ? '' : req.body.contact,
      listingID: new ObjectId(req.body.listingID),
    });
    return res.status(200).render('moreData', {
      listing: theListing,
      pictures,
      hasAccess: theListing.user === req.username,
      alerting: 'success',
      message: 'Your message was sent successfully',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
    });
  } catch (e) {
    return res.status(200).render('moreData', {
      listing: theListing,
      pictures,
      hasAccess: theListing.user === req.username,
      alerting: 'error',
      message: 'There was an error sending your message',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
    });
  }
});

route.post('/deleteMessage', express.json(), isThisMine, async (req, res) => {
  if (req.body.listingID === null || req.body.messageID === null) {
    return res.status(400).send('The listing id was not provided');
  }
  try {
    await deleteData('messages', { _id: new ObjectId(req.body.messageID) });
    return res.status(200).send('Deleted');
  } catch (e) {
    return res.status(500).send('Something happened on our part.');
  }
});

export default route;
