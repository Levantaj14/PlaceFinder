import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { initialiseConnection } from './components/connectToMongo.js';
import requestRoutes from './components/routes.js';
import pictureCommands from './components/pictureCommands.js';
import listingsCommands from './components/listingCommands.js';
import accountManagement from './components/accountManagement.js';
import { authenticatedUser } from './middlewares/loginStatus.js';
import { initialiseLocations } from './components/citiesAndCountries.js';

const app = express();

await initialiseConnection();
await initialiseLocations();

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'webpages'));
app.use(express.static('public'));
app.use(cookieParser());
app.use(authenticatedUser);
app.use('/listings', listingsCommands);
app.use('/picture', pictureCommands);
app.use('/account', accountManagement);
app.use('/', requestRoutes);

app.listen(8080, () => {
  console.log('Server started on port 8080!');
});
