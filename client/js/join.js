const form = document.querySelector('form.join-form');
const txtUsername = document.getElementById('txtUsername');
const pError = document.querySelector('p.error');
txtUsername.focus();


if(localStorage.getItem('username'))
{
    txtUsername.value = localStorage.getItem('username');
}


