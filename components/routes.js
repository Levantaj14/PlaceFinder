import express from 'express';
import { findOne, getEverything } from './connectToMongo.js';
import { postListing } from './postListing.js';
import { isAuthenticated } from '../middlewares/loginStatus.js';
import { getCities, getCountries } from './citiesAndCountries.js';
import { getCorrectListings } from './correctListings.js';

let alerting = 'no alert';
let message;

const route = express.Router();

route.get('/', async (req, res) => {
  const model = {
    listings: await getEverything('listings'),
    alerting,
    message,
    loggedIn: req.loggedIn,
    username: req.username,
    isAdmin: req.isAdmin,
  };
  res.status(200).render('index', model);
  alerting = 'no alert';
});

route.get('/postListing', isAuthenticated, async (req, res) => {
  res.status(200).render('postListing', {
    users: await getEverything('users'),
    alerting: 'no alert',
    message: '',
    loggedIn: req.loggedIn,
    username: req.username,
    countries: getCountries(),
    cities: getCities('Afghanistan'),
  });
});

route.post('/submitListing', isAuthenticated, express.urlencoded(), async (req, res) => {
  const response = await postListing(req.body, req.username);
  switch (response) {
    case 'incomplete data':
      return res.status(400).render('postListing', {
        alerting: 'error',
        message: 'You did not include all the keys.',
        loggedIn: req.loggedIn,
        username: req.username,
        countries: getCountries(),
        cities: getCities('Afghanistan'),
      });
    case 'invalid data':
      return res.status(400).render('postListing', {
        alerting: 'error',
        message: 'Some of your data is invalid.',
        loggedIn: req.loggedIn,
        username: req.username,
        countries: getCountries(),
        cities: getCities('Afghanistan'),
      });
    case 'incorrect date':
      return res.status(403).render('postListing', {
        alerting: 'error',
        message: "You can't post for a future date.",
        loggedIn: req.loggedIn,
        username: req.username,
        countries: getCountries(),
        cities: getCities('Afghanistan'),
      });
    case 'missing street':
      return res.status(403).render('postListing', {
        alerting: 'error',
        message: 'The street field must not be empty if the number field is filled in.',
        loggedIn: req.loggedIn,
        username: req.username,
        countries: getCountries(),
        cities: getCities('Afghanistan'),
      });
    case 'invalid country':
      return res.status(403).render('postListing', {
        alerting: 'error',
        message: "We couldn't find that country in our database. Please select one from the list bellow.",
        loggedIn: req.loggedIn,
        username: req.username,
        countries: getCountries(),
        cities: getCities('Afghanistan'),
      });
    case 'invalid city':
      return res.status(403).render('postListing', {
        alerting: 'error',
        message: "We couldn't find that city in our database. Please select one from the list bellow.",
        loggedIn: req.loggedIn,
        username: req.username,
        countries: getCountries(),
        cities: getCities('Afghanistan'),
      });
    default:
      alerting = 'success';
      message = 'The listing was posted successfully.';
      return res.status(303).redirect('/');
  }
});

route.get('/login', (req, res) => {
  if (req.loggedIn) {
    alerting = 'error';
    message = 'You are already logged in';
    return res.status(400).redirect('/');
  }
  return res.status(200).render('login', {
    alerting: 'no alert',
    message: '',
  });
});

route.get('/dashboard', isAuthenticated, async (req, res) =>
  res.status(200).render('dashboard', {
    alerting: 'no alert',
    message: '',
    loggedIn: req.loggedIn,
    username: req.username,
    isAdmin: req.isAdmin,
    fullName: req.fullName,
    twoFact: (await findOne('users', { username: req.username })).twoFact,
    users: await getEverything('users'),
    listings: await getCorrectListings(req.username, req.isAdmin),
  }),
);

route.get('*', (req, res) => {
  res.status(404).render('errorPage', {
    code: '404 Not Found',
    title: "It looks like you're lost buddy",
    heading: "Let's get you back to safety",
    loggedIn: req.loggedIn,
    username: req.username,
  });
});

export default route;
