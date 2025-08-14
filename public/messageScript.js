/* global bootstrap */

async function deleteMessage(event) {
  const button = event.target;
  const messageID = button.getAttribute('data-id');
  const listingID = button.getAttribute('data-listingID');
  const response = await fetch('/listings/deleteMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageID,
      listingID,
    }),
  });
  if (response.status !== 200) {
    document.getElementById('toastTitle').textContent = 'Error';
    document.getElementById('toastBody').textContent = 'There was an error deleting the message.';
  } else {
    document.getElementById(`${messageID}-row`).remove();
    document.getElementById('toastTitle').textContent = 'Success';
    document.getElementById('toastBody').textContent = 'The message was deleted successfully.';
  }
  const toastMessage = document.getElementById('liveToast');
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
  toastBootstrap.show();
}

window.onload = () => {
  const buttons = document.getElementsByClassName('btn');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', deleteMessage);
  }
};
