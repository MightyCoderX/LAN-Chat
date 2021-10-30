const form = document.querySelector('form');
const txtUsername = document.getElementById('txtUsername');
const pError = document.querySelector('p.error');
txtUsername.focus();

const username = txtUsername.value.trim();

if(localStorage.getItem('username'))
{
    txtUsername.value = localStorage.getItem('username');
}

const illegalCharacters = '`"\'\\';

form.addEventListener('submit', e =>
{
    e.preventDefault();

    const formData = new FormData(form);
    const username = formData.get('username');

    fetch(e.target.action,
    {
        method: e.target.method,
        body: JSON.stringify({ username }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(async res =>
    {
        const json = await res.json();
        if(json.status == 'ok')
        {
            localStorage.setItem('username', username);
            window.open(`/chat?username=${username}`, '_self');
        }
        else
        {
            pError.innerText = json.message;
            pError.classList.add('shown');
            throw Error('Error while checking username');
        }
    })
    .catch(err => console.error(err));
});