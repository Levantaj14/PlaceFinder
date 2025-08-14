/* global bootstrap */
let passwordButton;
let profileButton;

async function changeAdmin(event) {
  const button = event.target;
  const user = button.getAttribute('data-user');
  const loader = document.createElement('span');
  loader.setAttribute('id', `${user}-adminSpinner`);
  loader.classList.add('spinner-border');
  loader.classList.add('spinner-border-sm');
  button.insertBefore(loader, button.firstChild);
  button.classList.add('disabled');
  if (Array.from(button.classList).includes('makeAdmin')) {
    const response = await fetch('/account/makeAdmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user,
      }),
    });
    if (response.status === 403) {
      document.getElementById(`${user}-adminSpinner`).remove();
      document.getElementById('toastTitle').textContent = "You're no longer an admin";
      document.getElementById('toastBody').textContent = 'The page will reload.';
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } else if (response.status !== 200) {
      document.getElementById(`${user}-adminSpinner`).remove();
      document.getElementById('toastTitle').textContent = 'Error';
      document.getElementById('toastBody').textContent = `There was an error while promoting ${user} as admin.`;
    } else {
      button.classList.remove('btn-outline-primary');
      button.classList.remove('makeAdmin');
      button.classList.add('btn-outline-danger');
      button.classList.add('revokeAdmin');
      button.textContent = 'Revoke admin';
      const badge = document.getElementById(`${user}-badge`);
      badge.classList.add('badge');
      badge.classList.add('bg-secondary');
      badge.textContent = 'admin';
      document.getElementById('toastTitle').textContent = 'Success';
      document.getElementById('toastBody').textContent = `${user} is now an admin.`;
    }
    const toastMessage = document.getElementById('liveToast');
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
    toastBootstrap.show();
  } else if (Array.from(button.classList).includes('revokeAdmin')) {
    const response = await fetch('/account/revokeAdmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user,
      }),
    });
    if (response.status === 403) {
      document.getElementById(`${user}-adminSpinner`).remove();
      document.getElementById('toastTitle').textContent = "You're no longer an admin";
      document.getElementById('toastBody').textContent = 'The page will reload.';
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } else if (response.status !== 200) {
      document.getElementById(`${user}-adminSpinner`).remove();
      document.getElementById('toastTitle').textContent = 'Error';
      document.getElementById(
        'toastBody',
      ).textContent = `There was an error while revoking admin privileges from ${user}.`;
    } else {
      button.classList.remove('btn-outline-danger');
      button.classList.remove('revokeAdmin');
      button.classList.add('btn-outline-primary');
      button.classList.add('makeAdmin');
      button.textContent = 'Make admin';
      const badge = document.getElementById(`${user}-badge`);
      badge.classList.remove('badge');
      badge.classList.remove('bg-secondary');
      badge.textContent = '';
      document.getElementById('toastTitle').textContent = 'Success';
      document.getElementById('toastBody').textContent = `${user} is not an admin anymore.`;
    }
    const toastMessage = document.getElementById('liveToast');
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
    toastBootstrap.show();
  }
  button.classList.remove('disabled');
}

async function requestAdmin(event) {
  const button = event.target;
  const user = button.getAttribute('data-user');
  const response = await fetch('/account/requestAdmin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user,
    }),
  });
  if (response.status !== 200) {
    document.getElementById('toastTitle').textContent = 'Error';
    document.getElementById('toastBody').textContent = 'There was an error while requesting admin privileges.';
  } else {
    const otherButton = document.getElementById('preRequestButton');
    otherButton.classList.add('disabled');
    otherButton.textContent = 'Already requested';
    document.getElementById('toastTitle').textContent = 'Success';
    document.getElementById('toastBody').textContent = 'Your request was sent.';
  }
  const toastMessage = document.getElementById('liveToast');
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
  toastBootstrap.show();
}

async function deleteListing(event) {
  const button = event.target;
  const id = button.getAttribute('data-id');
  const loader = document.createElement('span');
  loader.setAttribute('id', `${id}-spinner`);
  loader.classList.add('spinner-border');
  loader.classList.add('spinner-border-sm');
  button.insertBefore(loader, button.firstChild);
  button.classList.add('disabled');
  const response = await fetch(`/listings/deleteListing?id=${id}`, {
    method: 'DELETE',
  });
  if (response.status === 403) {
    button.classList.remove('disabled');
    document.getElementById(`${id}-spinner`).remove();
    document.getElementById('toastTitle').textContent = "You're no longer an admin";
    document.getElementById('toastBody').textContent = 'The page will reload.';
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  } else if (response.status !== 200) {
    button.classList.remove('disabled');
    document.getElementById(`${id}-spinner`).remove();
    document.getElementById('toastTitle').textContent = 'Error';
    document.getElementById('toastBody').textContent = 'There was an error while deleting the listing.';
  } else {
    document.getElementById(`${id}-row`).remove();
    document.getElementById('toastTitle').textContent = 'Success';
    document.getElementById('toastBody').textContent = 'Listing deleted successfully.';
  }
  const toastMessage = document.getElementById('liveToast');
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
  toastBootstrap.show();
}

async function deleteAccount(event) {
  const button = event.target;
  const username = button.getAttribute('data-username');
  const loader = document.createElement('span');
  loader.setAttribute('id', `${username}-spinner`);
  loader.classList.add('spinner-border');
  loader.classList.add('spinner-border-sm');
  button.insertBefore(loader, button.firstChild);
  button.classList.add('disabled');
  const response = await fetch(`/account/deleteAccount?user=${username}`, {
    method: 'DELETE',
  });
  if (response.status === 403) {
    document.getElementById(`${username}-spinner`).remove();
    button.classList.remove('disabled');
    document.getElementById('toastTitle').textContent = "You're no longer an admin";
    document.getElementById('toastBody').textContent = 'The page will reload.';
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  } else if (response.status !== 200) {
    document.getElementById(`${username}-spinner`).remove();
    button.classList.remove('disabled');
    document.getElementById('toastTitle').textContent = 'Error';
    document.getElementById('toastBody').textContent = `There was an error while deleting ${username}'s account.`;
  } else {
    document.getElementById(`${username}-row`).remove();
    document.getElementById('toastTitle').textContent = 'Success';
    document.getElementById('toastBody').textContent = `${username}'s account was deleted successfully.`;
  }
  const toastMessage = document.getElementById('liveToast');
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
  toastBootstrap.show();
}

async function turn2FactOff(event) {
  const button = event.target;
  const username = button.getAttribute('data-username');
  const removeButton = document.getElementById('2FactButtonOff');
  const loader = document.createElement('span');
  loader.setAttribute('id', '2FactSpinner');
  loader.classList.add('spinner-border');
  loader.classList.add('spinner-border-sm');
  removeButton.classList.add('disabled');
  removeButton.textContent = ' Turning off...';
  removeButton.insertBefore(loader, removeButton.firstChild);
  const response = await fetch('/account/2factorOff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: username,
    }),
  });
  if (response.status !== 200) {
    removeButton.textContent = 'Turn it off';
    removeButton.classList.remove('disabled');
    document.getElementById('toastTitle').textContent = 'Error';
    document.getElementById('toastBody').textContent = 'There was an error while turning off 2-factor authentication';
  } else {
    document.getElementById('2factIndicator').classList.remove('bg-success');
    document.getElementById('2factIndicator').classList.add('bg-danger');
    document.getElementById('2factIndicator').textContent = 'OFF';
    document.getElementById('2FactText').textContent =
      'For an extra layer of security we recommend that you turn this on.';
    const newButton = document.createElement('a');
    newButton.classList.add('btn');
    newButton.classList.add('btn-primary');
    newButton.textContent = 'Turn it on';
    newButton.href = '/account/2factorAuthenticationOn';
    removeButton.insertAdjacentElement('afterend', newButton);
    removeButton.remove();
    document.getElementById('toastTitle').textContent = 'Success';
    document.getElementById('toastBody').textContent = '2-factor authentication is now turned off';
  }
  const toastMessage = document.getElementById('liveToast');
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessage);
  toastBootstrap.show();
}

function checkPassword(event) {
  event.preventDefault();
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm.checkValidity()) {
    passwordButton.textContent = ' Changing your password...';
    passwordButton.disabled = true;
    const loader = document.createElement('span');
    loader.classList.add('spinner-border');
    loader.classList.add('spinner-border-sm');
    passwordButton.insertBefore(loader, passwordButton.firstChild);
    passwordForm.submit();
  } else {
    document.getElementById('newPassword').setCustomValidity('');
    document.getElementById('newPasswordAgain').setCustomValidity('');
    const passwordValue = document.getElementById('newPassword').value;
    if (!(/\d/.test(passwordValue) && /[a-zA-Z]/.test(passwordValue))) {
      document.getElementById('newPassword').setCustomValidity(true);
      document.getElementById('passwordError').textContent =
        'The passwords must contain at least one number and one letter.';
    }
    if (passwordValue.length < 8) {
      document.getElementById('newPassword').setCustomValidity(true);
      document.getElementById('passwordError').textContent = 'The password must be at least 8 characters long.';
    }
    if (document.getElementById('newPasswordAgain').value !== passwordValue) {
      document.getElementById('newPasswordAgain').setCustomValidity(true);
      document.getElementById('passwordAgainError').textContent = 'The passwords do not match.';
    }
    passwordForm.classList.add('was-validated');
  }
}

function checkUserInfo(event) {
  event.preventDefault();
  const profileForm = document.getElementById('profileForm');
  if (profileForm.checkValidity()) {
    profileButton.textContent = ' Changing your information...';
    profileButton.disabled = true;
    const loader = document.createElement('span');
    loader.classList.add('spinner-border');
    loader.classList.add('spinner-border-sm');
    profileButton.insertBefore(loader, profileButton.firstChild);
    profileForm.submit();
  } else {
    profileForm.classList.add('was-validated');
  }
}

window.onload = () => {
  const makeAdminButton = document.getElementsByClassName('makeAdmin');
  const revokeAdminButton = document.getElementsByClassName('revokeAdmin');
  const deleteListingButton = document.getElementsByClassName('deleteListing');
  const deleteAccountButton = document.getElementsByClassName('deleteAccount');
  profileButton = document.getElementById('profileButton');
  profileButton.addEventListener('click', checkUserInfo);
  passwordButton = document.getElementById('passwordButton');
  passwordButton.addEventListener('click', checkPassword);
  for (let i = 0; i < makeAdminButton.length; i++) {
    makeAdminButton[i].addEventListener('click', changeAdmin);
  }
  for (let i = 0; i < revokeAdminButton.length; i++) {
    revokeAdminButton[i].addEventListener('click', changeAdmin);
  }
  for (let i = 0; i < deleteListingButton.length; i++) {
    deleteListingButton[i].addEventListener('click', deleteListing);
  }
  for (let i = 0; i < deleteAccountButton.length; i++) {
    deleteAccountButton[i].addEventListener('click', deleteAccount);
  }
  if (document.getElementById('requestAdmin')) {
    document.getElementById('requestAdmin').addEventListener('click', requestAdmin);
  }
  if (document.getElementById('turn2FactOff')) {
    document.getElementById('turn2FactOff').addEventListener('click', turn2FactOff);
  }
};
