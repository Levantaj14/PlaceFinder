/* global bootstrap */
let postButton;
let filterForm;
let getting = false;

function filtering(event) {
  event.preventDefault();
  if (filterForm.checkValidity()) {
    postButton.textContent = ' Filtering...';
    postButton.disabled = true;
    const loader = document.createElement('span');
    loader.setAttribute('id', 'spinner');
    loader.classList.add('spinner-border');
    loader.classList.add('spinner-border-sm');
    postButton.insertBefore(loader, postButton.firstChild);
    filterForm.submit();
  } else {
    filterForm.reportValidity();
  }
}

async function getMoreData(event) {
  if (!getting) {
    getting = true;
    const button = event.target;
    const id = button.getAttribute('data-info');

    const loader = document.createElement('div');
    loader.classList.add('spinner-border');
    loader.classList.add('spinner-border-sm');
    loader.setAttribute('id', `${id}-spinner`);
    button.insertBefore(loader, button.firstChild);

    const theCard = document.getElementById(id);
    if (theCard.querySelector('.postingDate')) {
      if (theCard.querySelector('.numberOfRooms')) {
        theCard.removeChild(theCard.querySelector('.numberOfRooms'));
      }
      theCard.removeChild(theCard.querySelector('.postingDate'));
    }
    let response = await fetch(`/listings/getAdditionalData?id=${id}`, {
      method: 'GET',
    });
    if (response.status !== 200) {
      document.getElementById(`${id}-spinner`).remove();
      document.getElementById('toastTitle').textContent = 'Error';
      document.getElementById('toastBody').textContent = 'There was an error getting a response from the server.';
      const toastMessage = document.getElementById('liveToast');
      const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
      toastBootstrap.show();
    } else {
      response = await response.json();
      if (response.roomNumber !== 0) {
        const roomNumber = document.createElement('p');
        roomNumber.classList.add('card-text');
        roomNumber.classList.add('numberOfRooms');
        roomNumber.textContent = `Number of rooms: ${response.roomNumber}`;
        theCard.append(roomNumber);
      }
      const postingDate = document.createElement('p');
      postingDate.classList.add('card-text');
      postingDate.classList.add('postingDate');
      postingDate.textContent = `Date of availability: ${response.date}`;
      theCard.append(postingDate);
      button.textContent = 'Update information';
    }
    getting = false;
  }
}

window.onload = () => {
  postButton = document.getElementById('getListings');
  filterForm = document.getElementById('filterForm');
  postButton.addEventListener('click', filtering);
  const getMoreDataButtons = document.getElementsByClassName('dataGetting');
  for (let i = 0; i < getMoreDataButtons.length; i++) {
    getMoreDataButtons[i].addEventListener('click', getMoreData);
  }
};
