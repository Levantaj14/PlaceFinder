/* global bootstrap */

let postButton;
let uploadForm;
let editButton;
let editForm;
let toastBootstrap;
let deleteButtons;
let messageButton;
let messageForm;

function posting(event) {
  event.preventDefault();
  if (uploadForm.checkValidity()) {
    postButton.textContent = ' Uploading...';
    postButton.disabled = true;
    const loader = document.createElement('span');
    loader.classList.add('spinner-border');
    loader.classList.add('spinner-border-sm');
    postButton.insertBefore(loader, postButton.firstChild);
    uploadForm.submit();
  } else {
    uploadForm.classList.add('was-validated');
  }
}

async function deletePicture(event) {
  const deleteButton = event.target;
  const pictureID = deleteButton.getAttribute('data-pictureID');
  const listingID = deleteButton.getAttribute('data-listingID');
  deleteButton.textContent = ' Deleting...';
  deleteButton.disabled = true;
  const loader = document.createElement('span');
  loader.classList.add('spinner-border');
  loader.classList.add('spinner-border-sm');
  deleteButton.insertBefore(loader, deleteButton.firstChild);
  const response = await fetch(`/picture/deletePicture?id=${listingID}&pictureID=${pictureID}`, {
    method: 'DELETE',
  });
  if (response.status !== 200) {
    deleteButton.textContent = 'Delete';
    deleteButton.disabled = false;
    document.getElementById('toastTitle').textContent = 'Error';
    document.getElementById('toastBody').textContent = 'There was an error while deleting the picture.';
  } else {
    document.getElementById('toastTitle').textContent = 'Success';
    document.getElementById('toastBody').textContent = 'Picture deleted successfully.';
    document.getElementById(pictureID).remove();
  }
  toastBootstrap.show();
}

async function changeDetails(event) {
  event.preventDefault();
  const loader = document.createElement('span');
  loader.setAttribute('id', 'editSpinner');
  loader.classList.add('spinner-border');
  loader.classList.add('spinner-border-sm');
  editButton.textContent = ' Saving...';
  editButton.disabled = true;
  editButton.insertBefore(loader, editButton.firstChild);
  const formData = new FormData(editForm);
  const response = await fetch('/listings/editListing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listingID: formData.get('listingID'),
      title: formData.get('title'),
      price: formData.get('price'),
      description: formData.get('description'),
    }),
  });
  if (response.status !== 200) {
    document.getElementById('toastTitle').textContent = 'Error';
    document.getElementById('toastBody').textContent = 'There was an error saving your changes. Please try again.';
  } else {
    document.getElementById('toastTitle').textContent = 'Success';
    document.getElementById('toastBody').textContent = 'Your changes were saved successfully.';
  }
  document.getElementById('editSpinner').remove();
  editButton.textContent = 'Save changes';
  editButton.disabled = false;
  toastBootstrap.show();
}

function sendMessage(event) {
  event.preventDefault();
  if (messageForm.checkValidity()) {
    messageButton.textContent = ' Sending...';
    messageButton.disabled = true;
    const loader = document.createElement('span');
    loader.classList.add('spinner-border');
    loader.classList.add('spinner-border-sm');
    messageButton.insertBefore(loader, messageButton.firstChild);
    messageForm.submit();
  } else {
    messageForm.classList.add('was-validated');
  }
}

window.onload = () => {
  postButton = document.getElementById('uploadButton');
  uploadForm = document.getElementById('uploadForm');
  editButton = document.getElementById('editButton');
  editForm = document.getElementById('editForm');
  const toastMessage = document.getElementById('liveToast');
  toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
  postButton.addEventListener('click', posting);
  deleteButtons = document.getElementsByClassName('deleteButton');
  for (let i = 0; i < deleteButtons.length; i++) {
    deleteButtons[i].addEventListener('click', deletePicture);
  }
  if (document.getElementById('messageButton')) {
    messageButton = document.getElementById('messageButton');
    messageForm = document.getElementById('messageForm');
    messageButton.addEventListener('click', sendMessage);
  }
  editButton.addEventListener('click', changeDetails);
};
