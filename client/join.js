const form = document.querySelector('form');
const txtUsername = document.getElementById('txtUsername');
txtUsername.focus();

const username = txtUsername.value.trim();

if(localStorage.getItem('username'))
{
    txtUsername.value = localStorage.getItem('username');
}

const illegalCharacters = '`"\'\\';

form.addEventListener('submit', e =>
{
    const username = txtUsername.value.trim();

    const isUsernameValid = username?.split('')
        .every(char => !illegalCharacters.includes(char));

    if(!isUsernameValid)
    {
        e.preventDefault();
        alert('Nome non valido!');
        txtUsername.value = "";
        return;
    }

    localStorage.setItem('username', username);
});