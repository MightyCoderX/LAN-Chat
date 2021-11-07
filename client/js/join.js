const form = document.querySelector('form.join-form');
const txtUsername = document.getElementById('txtUsername');
const pError = document.querySelector('p.error');
txtUsername.focus();

console.log('join.js');

let username;

if(localStorage.getItem('username'))
{
    txtUsername.value = localStorage.getItem('username');
}

const illegalCharacters = '`"\'\\';

form.addEventListener('submit', e =>
{
    e.preventDefault();

    const formData = new FormData(form);
    const formUsername = formData.get('username');

    fetch(e.target.action,
    {
        method: e.target.method,
        body: JSON.stringify({ username: formUsername }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(async res =>
    {
        const json = await res.json();
        if(json.status === 'ok')
        {
            localStorage.setItem('username', formUsername);
            username = formUsername;
            connect();
            document.querySelector('.join-form-container').classList.add('hidden');
            document.querySelector('.chat-box').classList.add('shown');
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