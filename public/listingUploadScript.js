let postButton;
let uploadForm;
let countries;
let cities;

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
    document.getElementById('street').setCustomValidity('');
    if (document.getElementById('number').value !== '' && document.getElementById('street').value === '') {
      document.getElementById('street').setCustomValidity(true);
    }
    uploadForm.classList.add('was-validated');
  }
}

async function getNewCountries() {
  while (cities.lastElementChild) {
    cities.lastElementChild.remove();
  }
  const response = await fetch('listings/getCities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      country: countries.options[countries.selectedIndex].text,
    }),
  });
  if (response.status !== 200) {
    window.alert('Error getting cities.');
  } else {
    const citiesList = await response.json();
    if (citiesList.length > 0) {
      citiesList.forEach((city) => {
        const element = document.createElement('option');
        element.value = city;
        element.textContent = city;
        cities.append(element);
      });
    } else {
      const element = document.createElement('option');
      element.value = '-';
      element.textContent = '-';
      cities.append(element);
    }
  }
}

window.onload = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  document.getElementById('dateOfAvailability').defaultValue = `${year}-${month}-${day}`;
  countries = document.getElementById('country');
  cities = document.getElementById('city');
  postButton = document.getElementById('uploadButton');
  uploadForm = document.getElementById('uploadForm');
  postButton.addEventListener('click', posting);
  countries.addEventListener('change', getNewCountries);
};
