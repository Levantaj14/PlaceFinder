import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import cookieParser from 'cookie-parser';
import { findOne, getEverything, insertIntoCollection, updateData } from './connectToMongo.js';
import { isAdmin, isAuthenticated } from '../middlewares/loginStatus.js';
import { deleteAccount } from './delete/account.js';
import { getCorrectListings } from './correctListings.js';
import { decrypt, encrypt } from './encryption.js';

const route = express.Router();
const secret = '5z7H6%cQPefXmw7t##TVTkEAqGPTa%G3UrvbSK@K3#GY^qhyw3Bj3cYSKhN@QMqi';

route.post('/loginUser', express.urlencoded(), async (req, res) => {
  const aux = req.body;
  if (!aux.username || !aux.password) {
    return res.status(400).send('It looks like you forgot at least a field. Please try again.');
  }
  const { username, password } = req.body;
  const user = await findOne('users', { username });
  if (!user) {
    return res.status(400).render('login', {
      alerting: 'error',
      message: `${username} does not exist. Make sure that your username is correct.`,
    });
  }
  if (username === '' || password === '') {
    return res.status(400).render('login', {
      alerting: 'error',
      message: 'All fields are required',
    });
  }
  await bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).render('login', {
        alerting: 'error',
        message: 'There was a problem on our part.',
      });
    }
    if (!result) {
      return res.status(400).render('login', {
        alerting: 'error',
        message: 'The password is incorrect.',
      });
    }
    if (user.twoFact) {
      const userToken = jwt.sign({ username }, secret, { expiresIn: '300s' });
      return res
        .status(200)
        .cookie('user', userToken, {
          httpOnly: true,
          maxAge: 50000,
        })
        .redirect('/account/enter2Factor');
    }
    const token = jwt.sign({ username }, secret, { expiresIn: '7d' });
    return res
      .status(202)
      .cookie('auth', token, {
        httpOnly: true,
        maxAge: 604800000,
      })
      .redirect('/');
  });
  return '';
});

function verifyHereness(req) {
  if (!req.cookies.user) {
    return '401';
  }
  if (!jwt.verify(req.cookies.user, secret)) {
    return '403';
  }
  return 'ok';
}

route.get('/enter2Factor', (req, res) => {
  const result = verifyHereness(req, res);
  if (result === 'ok') {
    return res.status(200).render('verify2Factor', {
      alerting: 'no alert',
      message: '',
      loggedIn: req.loggedIn,
      username: req.username,
    });
  }
  if (result === '401') {
    return res.status(401).render('errorPage', {
      code: '401 Unauthorized',
      title: "We can't recognise you",
      heading: 'Please log in and then try again',
      loggedIn: false,
      username: '',
    });
  }
  return res.status(403).render('errorPage', {
    code: '403 Forbidden',
    title: "You shouldn't be here",
    heading: 'Please try to log in again',
    loggedIn: false,
    username: '',
  });
});

route.post('/verify2factor', express.urlencoded(), async (req, res) => {
  if (!req.body.code) {
    return res.status(400).send('Please provide the code shown in your authentication app');
  }
  const result = verifyHereness(req, res);
  if (result === 'ok') {
    const { username } = jwt.verify(req.cookies.user, secret);
    const mySecret = (await findOne('users', { username })).secret;
    if (speakeasy.totp.verify({ secret: decrypt(mySecret), token: req.body.code, encoding: 'base32' })) {
      const token = jwt.sign({ username }, secret, { expiresIn: '7d' });
      return res
        .status(202)
        .clearCookie('user')
        .cookie('auth', token, {
          httpOnly: true,
          maxAge: 10080000,
        })
        .redirect('/');
    }
    const userToken = jwt.sign({ username }, secret, { expiresIn: '5m' });
    return res
      .status(400)
      .cookie('user', userToken, {
        httpOnly: true,
        maxAge: 50000,
      })
      .render('verify2Factor', {
        alerting: 'error',
        message: 'The code you provided is incorrect.',
        loggedIn: req.loggedIn,
        username: req.username,
      });
  }
  if (result === '401') {
    return res.status(401).render('errorPage', {
      code: '401 Unauthorized',
      title: "We can't recognise you",
      heading: 'Please log in and then try again',
      loggedIn: false,
      username: '',
    });
  }
  return res.status(403).render('errorPage', {
    code: '403 Forbidden',
    title: "You shouldn't be here",
    heading: 'Please try to log in again',
    loggedIn: false,
    username: '',
  });
});

function checkPassword(res, password, passwordAgain) {
  if (password.length < 8) {
    return 'The password must be at least 8 characters.';
  }
  if (!(/\d/.test(password) && /[a-zA-Z]/.test(password))) {
    return 'The passwords must contain at least one number and one letter.';
  }
  if (password !== passwordAgain) {
    return 'The two passwords must match';
  }
  return 'ok';
}

route.post('/signupUser', express.urlencoded(), async (req, res) => {
  const aux = req.body;
  if (!aux.username || !aux.password || !aux.passwordAgain) {
    return res.status(400).send('It looks like you forgot at least a field. Please try again.');
  }
  const { username, name, password, passwordAgain } = aux;
  if (username === '' || name === '' || password === '') {
    return res.status(400).render('login', {
      alerting: 'error',
      message: 'All fields are required',
    });
  }
  const response = checkPassword(res, password, passwordAgain);
  if (response !== 'ok') {
    return res.status(400).render('login', {
      alerting: 'error',
      message: response,
    });
  }
  if (await findOne('users', { username })) {
    return res.status(400).render('login', {
      alerting: 'error',
      message: `${username} already exists`,
    });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await insertIntoCollection('users', {
      name,
      username,
      password: passwordHash,
      isAdmin: 'false',
      twoFact: false,
      secret: '',
    });
  } catch (e) {
    return res.status(500).render('login', {
      alerting: 'error',
      message: 'There was an error creating your account. Please try again!',
    });
  }
  const token = jwt.sign({ username }, secret, { expiresIn: '7d' });
  return res
    .status(202)
    .cookie('auth', token, {
      httpOnly: true,
      expiresIn: '7d',
    })
    .redirect('/');
});

route.post('/resetPassword', isAuthenticated, express.urlencoded(), async (req, res) => {
  const aux = req.body;
  if (!aux.password || !aux.newPassword || !aux.newPasswordAgain) {
    return res.status(400).send('It looks like you forgot at least a field. Please try again.');
  }
  const { password, newPassword, newPasswordAgain } = aux;
  const user = await findOne('users', { username: req.username });
  if (password === '' || newPassword === '' || newPasswordAgain === '') {
    return res.status(400).render('dashboard', {
      alerting: 'error',
      message: 'All fields are required',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
      fullName: req.fullName,
      twoFact: user.twoFact,
      users: await getEverything('users'),
      listings: await getCorrectListings(req.username, req.isAdmin),
    });
  }
  const response = checkPassword(res, newPassword, newPasswordAgain);
  if (response !== 'ok') {
    return res.status(400).render('dashboard', {
      alerting: 'error',
      message: response,
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
      fullName: req.fullName,
      twoFact: user.twoFact,
      users: await getEverything('users'),
      listings: await getCorrectListings(req.username, req.isAdmin),
    });
  }
  const serverPassword = user.password;
  await bcrypt.compare(password, serverPassword, async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).render('dashboard', {
        alerting: 'error',
        message: 'There was a problem on our part.',
        loggedIn: req.loggedIn,
        username: req.username,
        isAdmin: req.isAdmin,
        fullName: req.fullName,
        twoFact: user.twoFact,
        users: await getEverything('users'),
        listings: await getCorrectListings(req.username, req.isAdmin),
      });
    }
    if (!result) {
      return res.status(400).render('dashboard', {
        alerting: 'error',
        message: 'Your current password is not correct.',
        loggedIn: req.loggedIn,
        username: req.username,
        isAdmin: req.isAdmin,
        fullName: req.fullName,
        twoFact: user.twoFact,
        users: await getEverything('users'),
        listings: await getCorrectListings(req.username, req.isAdmin),
      });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    try {
      await updateData('users', { username: req.username }, { $set: { password: passwordHash } });
    } catch (err1) {
      return res.status(500).render('dashboard', {
        alerting: 'error',
        message: 'There was an error resetting your password. Please try again!',
        loggedIn: req.loggedIn,
        username: req.username,
        isAdmin: req.isAdmin,
        fullName: req.fullName,
        twoFact: user.twoFact,
        users: await getEverything('users'),
        listings: await getCorrectListings(req.username, req.isAdmin),
      });
    }
    return res.status(202).render('dashboard', {
      alerting: 'success',
      message: 'Your password was changed successfully.',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
      fullName: req.fullName,
      twoFact: user.twoFact,
      users: await getEverything('users'),
      listings: await getCorrectListings(req.username, req.isAdmin),
    });
  });
  return '';
});

route.post('/makeAdmin', isAdmin, express.json(), async (req, res) => {
  if (req.body.user === undefined) {
    return res.status(400).send('Please provide a user.');
  }
  try {
    await updateData('users', { username: req.body.user }, { $set: { isAdmin: 'true' } });
    return res.status(200).send('Done');
  } catch (err) {
    return res.status(500).send('Error while adding admin privileges.');
  }
});

route.post('/revokeAdmin', isAdmin, express.json(), async (req, res) => {
  if (req.body.user === undefined) {
    return res.status(400).send('Please provide a user.');
  }
  try {
    await updateData('users', { username: req.body.user }, { $set: { isAdmin: 'false' } });
    return res.status(200).send('Done');
  } catch (err) {
    return res.status(500).send('Error while revoking admin privileges.');
  }
});

route.post('/requestAdmin', isAuthenticated, express.json(), async (req, res) => {
  if (req.body.user === undefined) {
    return res.status(400).send('Please provide a user.');
  }
  try {
    await updateData('users', { username: req.body.user }, { $set: { isAdmin: 'waiting' } });
    return res.status(200).send('Done');
  } catch (err) {
    return res.status(500).send('Error while requesting admin privileges.');
  }
});

route.post('/deleteMyAccount', isAuthenticated, async (req, res) => {
  try {
    await deleteAccount(req.username);
    res.status(200).clearCookie('auth').redirect('/');
  } catch (err) {
    res.status(500).render('dashboard', {
      alerting: 'error',
      message: 'There was an error deleting your account.',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
      fullName: req.fullName,
      twoFact: (await findOne('users', { username: req.username })).twoFact,
      users: await getEverything('users'),
      listings: await getCorrectListings(req.username, req.isAdmin),
    });
  }
});

route.delete('/deleteAccount', isAdmin, async (req, res) => {
  if (req.query.user === undefined) {
    return res.status(400).send('Please provide a user.');
  }
  try {
    await deleteAccount(req.query.user);
    return res.status(200).send('Done');
  } catch (err) {
    return res.status(500).send('Error while deleting the account.');
  }
});

function initialCheck(name, username) {
  let goodName = true;
  let goodUsername = true;
  if (name === undefined || name === '') {
    goodName = false;
  }
  if (username === undefined || username === '') {
    goodUsername = false;
  }
  return { goodName, goodUsername };
}

route.post('/changeUserData', isAuthenticated, express.urlencoded(), async (req, res) => {
  const { name, username } = req.body;
  const { goodName, goodUsername } = initialCheck(name, username);
  if (!goodName && !goodUsername) {
    return res.status(400).render('dashboard', {
      alerting: 'error',
      message: 'You must provide at least one of the 2 fields.',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
      fullName: req.fullName,
      twoFact: (await findOne('users', { username: req.username })).twoFact,
      users: await getEverything('users'),
      listings: await getCorrectListings(req.username, req.isAdmin),
    });
  }
  try {
    if (!goodName) {
      if (req.username !== username && (await findOne('users', { username }))) {
        return res.status(400).render('dashboard', {
          alerting: 'error',
          message: `${username} already exists`,
          loggedIn: req.loggedIn,
          username: req.username,
          isAdmin: req.isAdmin,
          fullName: req.fullName,
          twoFact: (await findOne('users', { username: req.username })).twoFact,
          users: await getEverything('users'),
          listings: await getCorrectListings(req.username, req.isAdmin),
        });
      }
      await updateData('users', { username: req.username }, { $set: { username } });
    } else if (!goodUsername) {
      await updateData('users', { username: req.username }, { $set: { name } });
    } else {
      if (req.username !== username && (await findOne('users', { username }))) {
        return res.status(400).render('dashboard', {
          alerting: 'error',
          message: `${username} already exists`,
          loggedIn: req.loggedIn,
          username: req.username,
          isAdmin: req.isAdmin,
          fullName: req.fullName,
          twoFact: (await findOne('users', { username: req.username })).twoFact,
          users: await getEverything('users'),
          listings: await getCorrectListings(req.username, req.isAdmin),
        });
      }
      await updateData('users', { username: req.username }, { $set: { name, username } });
    }
    const token = jwt.sign({ username }, secret, { expiresIn: '7d' });
    return res
      .status(202)
      .clearCookie('auth')
      .cookie('auth', token, {
        httpOnly: true,
        expiresIn: '7d',
      })
      .render('dashboard', {
        alerting: 'success',
        message: 'Your information was changed successfully.',
        loggedIn: req.loggedIn,
        username: username === undefined ? req.username : username,
        isAdmin: req.isAdmin,
        fullName: name === undefined ? req.fullName : name,
        twoFact: (await findOne('users', { username })).twoFact,
        users: await getEverything('users'),
        listings: await getCorrectListings(req.username, req.isAdmin),
      });
  } catch (err) {
    return res.status(500).render('dashboard', {
      alerting: 'error',
      message: 'An error occurred. Please try again',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
      fullName: req.fullName,
      twoFact: (await findOne('users', { username: req.username })).twoFact,
      users: await getEverything('users'),
      listings: await getCorrectListings(req.username, req.isAdmin),
    });
  }
});

route.get('/2factorAuthenticationOn', isAuthenticated, (req, res) => {
  const speakSecret = speakeasy.generateSecret({ length: 20 });
  const url = `otpauth://totp/PlaceFinder: ${req.username}?secret=${speakSecret.base32}`;
  QRCode.toDataURL(url, (err, dataUrl) => {
    if (req.query.error === undefined) {
      res.status(200).render('2factorAuthenticationOn', {
        alerting: 'no alert',
        message: '',
        loggedIn: req.loggedIn,
        username: req.username,
        secret: speakSecret.base32,
        qrCode: dataUrl,
      });
    } else {
      res.status(400).render('2factorAuthenticationOn', {
        alerting: 'error',
        message: 'The code provided is not correct. Please try again!',
        loggedIn: req.loggedIn,
        username: req.username,
        secret: speakSecret.base32,
        qrCode: dataUrl,
      });
    }
  });
});

route.post('/check2factor', isAuthenticated, express.urlencoded(), async (req, res) => {
  if (req.body.code === undefined || req.body.secret === undefined) {
    return res.status(400).send('Incomplete data');
  }
  if (speakeasy.totp.verify({ secret: req.body.secret, token: req.body.code, encoding: 'base32' })) {
    await updateData(
      'users',
      { username: req.username },
      {
        $set: {
          twoFact: true,
          secret: encrypt(req.body.secret),
        },
      },
    );
    return res.status(200).render('dashboard', {
      alerting: 'success',
      message: '2-factor authentication is now turned on.',
      loggedIn: req.loggedIn,
      username: req.username,
      isAdmin: req.isAdmin,
      fullName: req.fullName,
      twoFact: (await findOne('users', { username: req.username })).twoFact,
      listings: await getCorrectListings(req.username, req.isAdmin),
    });
  }
  return res.status(400).redirect('2factorAuthenticationOn?error=true');
});

route.post('/2factorOff', isAuthenticated, express.json(), async (req, res) => {
  try {
    await updateData('users', { username: req.username }, { $set: { twoFact: false, secret: '' } });
    res.status(200).send('done');
  } catch (err) {
    res.status(500).send('error');
  }
});

route.get('/logout', isAuthenticated, cookieParser(), (req, res) => {
  res.status(200).clearCookie('auth').redirect('/');
});

export default route;
