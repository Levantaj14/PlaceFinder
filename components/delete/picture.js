import fs from 'node:fs';

export function deletePicture(fileName) {
  try {
    const fileToDelete = `public/images/${fileName}`;
    fs.access(fileToDelete, fs.constants.F_OK, (err1) => {
      if (err1) {
        console.error('File does not exist: ', err1);
      }
      fs.unlink(fileToDelete, (err2) => {
        if (err2) {
          console.error('Error while deleting picture: ', err2);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
}
