let messageButton;
let messageForm;

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
  messageButton = document.getElementById('messageButton');
  messageForm = document.getElementById('messageForm');
  messageButton.addEventListener('click', sendMessage);
};
