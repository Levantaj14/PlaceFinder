let loginButton;
let loginForm;
let signUpButton;
let signUpForm;

function signUp(event) {
  event.preventDefault();
  if (signUpForm.checkValidity()) {
    signUpButton.textContent = ' Signing up...';
    signUpButton.disabled = true;
    const loader = document.createElement('span');
    loader.classList.add('spinner-border');
    loader.classList.add('spinner-border-sm');
    signUpButton.insertBefore(loader, signUpButton.firstChild);
    signUpForm.submit();
  } else {
    document.getElementById('signUpPassword').setCustomValidity('');
    document.getElementById('passwordAgain').setCustomValidity('');
    const passwordValue = document.getElementById('signUpPassword').value;
    if (!(/\d/.test(passwordValue) && /[a-zA-Z]/.test(passwordValue))) {
      document.getElementById('signUpPassword').setCustomValidity(true);
      document.getElementById('passwordError').textContent =
        'The passwords must contain at least one number and one letter.';
    }
    if (passwordValue.length < 8) {
      document.getElementById('signUpPassword').setCustomValidity(true);
      document.getElementById('passwordError').textContent = 'The password must be at least 8 characters.';
    }
    if (document.getElementById('passwordAgain').value !== passwordValue) {
      document.getElementById('passwordAgain').setCustomValidity(true);
      document.getElementById('passwordAgainError').textContent = 'The passwords do not match.';
    }
    signUpForm.classList.add('was-validated');
  }
}

function login(event) {
  event.preventDefault();
  if (loginForm.checkValidity()) {
    loginButton.textContent = ' Logging in...';
    loginButton.disabled = true;
    const loader = document.createElement('span');
    loader.classList.add('spinner-border');
    loader.classList.add('spinner-border-sm');
    loginButton.insertBefore(loader, loginButton.firstChild);
    loginForm.submit();
  } else {
    loginForm.classList.add('was-validated');
  }
}

window.onload = () => {
  loginButton = document.getElementById('loginButton');
  loginForm = document.getElementById('loginForm');
  signUpButton = document.getElementById('signUpButton');
  signUpForm = document.getElementById('signUpForm');
  loginButton.addEventListener('click', login);
  signUpButton.addEventListener('click', signUp);
};
