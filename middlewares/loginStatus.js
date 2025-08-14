import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { findOne } from '../components/connectToMongo.js';

const secret = '5z7H6%cQPefXmw7t##TVTkEAqGPTa%G3UrvbSK@K3#GY^qhyw3Bj3cYSKhN@QMqi';

export async function authenticatedUser(req, res, next) {
  if (!req.cookies || !req.cookies.auth) {
    req.loggedIn = false;
    req.username = '';
    req.isAdmin = 'false';
    return next();
  }
  try {
    req.loggedIn = true;
    req.username = jwt.verify(req.cookies.auth, secret).username;
    const dbData = await findOne('users', { username: req.username });
    req.isAdmin = dbData.isAdmin;
    req.fullName = dbData.name;
    return next();
  } catch (err) {
    return res.status(401).clearCookie('auth').render('errorPage', {
      code: '401 Unauthorized',
      title: 'It looks like we you are no longer part of our community',
      heading: 'You could try to sign up again',
      loggedIn: false,
      username: '',
    });
  }
}

export function isAuthenticated(req, res, next) {
  if (!req.loggedIn) {
    return res.status(401).render('errorPage', {
      code: '401 Unauthorized',
      title: "We can't recognise you",
      heading: 'Please log in and then try again',
      loggedIn: false,
      username: '',
    });
  }
  return next();
}

export function isAdmin(req, res, next) {
  if (!req.loggedIn) {
    return res.status(401).render('errorPage', {
      code: '401 Unauthorized',
      title: "We can't recognise you",
      heading: 'Please log in and then try again',
      loggedIn: false,
      username: '',
    });
  }
  if (req.isAdmin !== 'true') {
    return res.status(403).render('errorPage', {
      code: '403 Forbidden',
      title: 'Well, well, well',
      heading: "You don't have access to make this operation",
      loggedIn: req.loggedIn,
      username: req.username,
    });
  }
  return next();
}

export async function isThisMine(req, res, next) {
  let userPost;
  try {
    userPost = (await findOne('listings', { _id: new ObjectId(req.body.listingID) })).user;
  } catch (e1) {
    try {
      userPost = (await findOne('listings', { _id: new ObjectId(req.query.id) })).user;
    } catch (e2) {
      return res.status(404).render('errorPage', {
        code: '404 Not Found',
        title: "It looks like you're lost buddy",
        heading: "Let's get you back to safety",
        loggedIn: req.loggedIn,
        username: req.username,
      });
    }
  }
  if (userPost === req.username || req.isAdmin === 'true') {
    return next();
  }
  return res.status(403).render('errorPage', {
    code: '403 Forbidden',
    title: 'Well, well, well',
    heading: "You don't have access to make this operation",
    loggedIn: req.loggedIn,
    username: req.username,
  });
}
