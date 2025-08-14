import multer from 'multer';
import express from 'express';
import { ObjectId } from 'mongodb';
import fs from 'node:fs';
import { uploadPicture } from './uploadPicture.js';
import { deleteData, findOne, getEverything, updateData } from './connectToMongo.js';
import { isAuthenticated, isThisMine } from '../middlewares/loginStatus.js';

const storage = multer.diskStorage({
  destination: './public/images',
  filename: (req, file, cb) => {
    cb(null, `${req.body.listingID}_${file.originalname}`);
  },
});

const multerInstance = multer({
  storage,
  async fileFilter(req, file, cb) {
    const postUser = (await findOne('listings', { _id: new ObjectId(req.body.listingID) })).user;
    if (!(req.username === postUser || (req.username !== postUser && req.isAdmin === 'true'))) {
      req.fileAccepted = false;
      return cb(new Error('forbidden'), false);
    }
    if (!file.mimetype.startsWith('image/')) {
      req.fileAccepted = false;
      return cb(new Error('no picture'), false);
    }
    const response = await uploadPicture(req.body.listingID, `${req.body.listingID}_${file.originalname}`);
    if (response === -1) {
      req.fileAccepted = false;
      return cb(new Error('no ID'), false);
    }
    req.fileAccepted = true;
    return cb(null, true);
  },
});

const route = express.Router();
route.use(isAuthenticated);

route.delete('/deletePicture', isThisMine, async (req, res) => {
  const theListing = await findOne('listings', { _id: new ObjectId(req.query.id) });
  let pictureArray = theListing.pictures;
  pictureArray = pictureArray.filter((x) => x.toString() !== req.query.pictureID);
  await updateData(
    'listings',
    { _id: new ObjectId(req.query.id) },
    {
      $set: {
        pictures: pictureArray,
      },
    },
  );
  const deletedData = await findOne('pictures', { _id: new ObjectId(req.query.pictureID) });
  const fileToDelete = `public/images/${deletedData.fileName}`;
  fs.access(fileToDelete, fs.constants.F_OK, (err1) => {
    if (err1) {
      console.error('File does not exist: ', err1);
      res.status(404).send('error');
    }
    fs.unlink(fileToDelete, (err2) => {
      if (err2) {
        console.error('Error while deleting picture: ', err2);
        res.status(500).send('error');
      }
    });
  });
  try {
    await deleteData('pictures', {
      _id: new ObjectId(req.query.pictureID),
      listingID: new ObjectId(req.query.id),
    });
    res.status(200).send('done');
  } catch (err) {
    res.status(500).send('error');
  }
});

route.post('/uploadPicture', (req, res) => {
  multerInstance.single('uploadedPicture')(req, res, async (err) => {
    const id = req.body.listingID;
    if (err instanceof Error) {
      if (err.message === 'forbidden') {
        return res.status(403).render('errorPage', {
          code: '403 Forbidden',
          title: 'Well, well, well',
          heading: "You don't have access to make this operation",
          loggedIn: req.loggedIn,
          username: req.username,
        });
      }
      const theListing = await findOne('listings', { _id: new ObjectId(id) });
      const pictures = await getEverything('pictures');
      const thePictures = pictures.filter((x) => x.listingID.toString() === id);
      if (err.message === 'no ID') {
        return res.status(404).render('moreData', {
          alerting: 'error',
          message: 'Invalid ID.',
          listings: theListing,
          pictures: thePictures,
          loggedIn: req.loggedIn,
          username: req.username,
          hasAccess: theListing.user === req.username,
          isAdmin: req.isAdmin,
        });
      }
      if (err.message === 'no picture') {
        return res.status(400).render('moreData', {
          alerting: 'error',
          message: 'The file you are trying to upload is not a picture.',
          listing: theListing,
          pictures: thePictures,
          loggedIn: req.loggedIn,
          username: req.username,
          hasAccess: theListing.user === req.username,
          isAdmin: req.isAdmin,
        });
      }
    }
    const theListing = await findOne('listings', { _id: new ObjectId(id) });
    const pictures = await getEverything('pictures');
    const thePictures = pictures.filter((x) => x.listingID.toString() === id);
    return res.status(201).render('moreData', {
      alerting: 'success',
      message: 'Picture uploaded successfully.',
      listing: theListing,
      pictures: thePictures,
      loggedIn: req.loggedIn,
      username: req.username,
      hasAccess: theListing.user === req.username,
      isAdmin: req.isAdmin,
    });
  });
});

export default route;
