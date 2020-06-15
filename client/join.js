const form = document.querySelector('form');
const txtUsername = document.getElementById('txtUsername');

txtUsername.focus();

const username = txtUsername.value.trim();


if(localStorage.getItem('username'))
{
    txtUsername.value = localStorage.getItem('username');
}

form.addEventListener('submit', e =>
{
    const username = txtUsername.value.trim();

    if(!username)
    {
        e.preventDefault();
        alert('Nome non valido!');
        txtUsername.value = "";
        return;
    }

    if(!localStorage.getItem('username'))
    {
        localStorage.setItem('username', username);
    }
});