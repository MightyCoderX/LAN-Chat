const socket = io(location.origin);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    .then(reg =>
    {
      console.log('Registration successful, scope is:', registration.scope);
    })
    .catch(err =>
    {
      console.error('Service worker registration failed, error:', error);
    });
}

function joinChat()
{
    let urlParams = (new URL(location)).searchParams;
    let username = urlParams.get('username');

    // if(!storage.getItem('username') || storage.getItem('username') == 'null')
    // {
    //     username = prompt('Ciao, scegli un nome: ');
    //     storage.setItem('username', username);
    // }
    // else
    // {
    //     username = storage.getItem('username');
    // }
    
    socket.emit('join', username);

    return username;
}

let username = joinChat();

socket.on('username_status', status =>
{
    if(status == 'in_use')
    {
        window.open('./join.html', '_self');
    }
    else if(status == 'ok')
    {
        document.title += ` - ${username}`;
    }
});

const chatBox = document.querySelector('.chat > .chat-box');
const txtMsg = document.getElementById('txtMsg');
const btnSend = document.querySelector('.btn-send');
const imageInput = document.querySelector(".file-input");
const customInput = imageInput.nextElementSibling;
const usersList = document.querySelector('.users-list');
const bigImageContainer = document.querySelector('.big-image-container');
const bigImage = document.querySelector('.big-image');

txtMsg.addEventListener('keydown', e =>
{
    if(txtMsg.value)
    {
        socket.emit('typing', true);
    }
});

txtMsg.focus();
customInput.addEventListener('click', e =>
{
    imageInput.click();
});

imageInput.addEventListener('change', e =>
{
    txtMsg.focus();
});

btnSend.addEventListener('click', e => sendMessage());
txtMsg.addEventListener('keyup', e => 
{
    if(e.key === 'Enter')
    {
        sendMessage();
    }
});

function sendMessage()
{
    if(imageInput.files[0])
    {
        socket.emit('send_image', { text: txtMsg.value, buffer: imageInput.files[0] });
        console.log(username, txtMsg.value, imageInput.files);
        imageInput.value = '';
        txtMsg.value = '';
        socket.emit('typing', false);
        return;
    }

    if(!txtMsg.value.trim()) return;

    socket.emit('send_message', txtMsg.value.trim());
    socket.emit('typing', false);
    console.log(username, txtMsg.value);
    txtMsg.value = '';
}

socket.on('all_messages', messages =>
{
    for(let msg of messages)
    {
        addMessage(msg.user, msg.content, msg.buffer);
    }
});

socket.on('all_users', users =>
{
    usersList.textContent = '';
    users.map(user =>
    {
        const li = document.createElement('li');
        li.textContent = user.username;
        usersList.appendChild(li);
    });
});

socket.on('user_joined', user =>
{
    addJoined(user.username);
});

socket.on('user_left', user =>
{
    addLeft(user.username);
});

socket.on('typing', ({ user, typing }) =>
{
    if(user.username == username) return;
    
    let typingElem = chatBox.querySelector(`#${user.id}`);
    console.log({ typingElem, user, typing });

    if(!typingElem)
    {
        typingElem = createIsTyping(user);
    }

    console.log(typing, typingElem);

    if(typing)
    {
        console.log(`${user.username} is typing...`);
        if(chatBox.contains(typingElem)) return;
        chatBox.appendChild(typingElem);
        chatBox.scrollTo(0, chatBox.scrollHeight+100);
    }
    else
    {
        chatBox.removeChild(typingElem);
    }

});

socket.on('message_received', ({ user, content }) =>
{
    addMessage(user, content, null);
});

socket.on('image_received', ({ user, text, buffer }) =>
{   
    addMessage(user, text, buffer);
});

function addMessage(user, text, imageBuffer)
{
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('msg');

    const spanUsername = document.createElement('span');
    spanUsername.classList.add('username');
    spanUsername.textContent = user.username + ' > ';

    const spanText = document.createElement('span');
    spanText.classList.add('text');
    spanText.textContent = text;

    messageDiv.appendChild(spanUsername);
    messageDiv.appendChild(spanText);

    if(imageBuffer)
    {
        const image = document.createElement('img');
        image.src = 'data:image/jpeg;base64,' + imageBuffer;

        image.addEventListener('click', e =>
        {
            openImage(image.src);
        });
        messageDiv.appendChild(image);
    }

    if(username === user.username || !chatBox.querySelector(`#${user.username}`))
    {
        chatBox.appendChild(messageDiv);
    }
    else
    {
        chatBox.querySelector(`#${user.username}`).replaceWith(messageDiv);
    }

    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function addJoined(nick)
{
    const joinMsgDiv = document.createElement('div');
    joinMsgDiv.classList.add('join-msg');

    if(nick != username)
    {
        joinMsgDiv.textContent = `${nick} si è unito/a alla chat!`;
    }
    else
    {
        joinMsgDiv.textContent = `Ti sei unito/a alla chat!`;
    }

    chatBox.appendChild(joinMsgDiv);
    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function addLeft(uname)
{
    const leftMsgDiv = document.createElement('div');
    leftMsgDiv.classList.add('join-msg');

    if(uname != username)
    {
        leftMsgDiv.textContent = `${uname} ha abbandonato la chat!`;
    }

    chatBox.appendChild(leftMsgDiv);
    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function createIsTyping(user)
{
    const isTypingDiv = document.createElement('div');
    isTypingDiv.id = user.id;
    isTypingDiv.classList.add('join-msg');
    isTypingDiv.textContent = `${user.username} is typing...`;

    return isTypingDiv;
}

function openImage(dataUrl)
{
    bigImage.src = dataUrl;
    bigImageContainer.style.display = 'block';

    document.addEventListener('click', e =>
    {
        if(e.target != bigImage && e.target != bigImageContainer 
            && bigImageContainer.style.display != 'none' && e.target != document.querySelector('.chat-box .msg img'))
        {
            bigImageContainer.style.display = 'none';
            console.log('Closed window');
        }
    });

    document.addEventListener('keyup', e =>
    {
        if(e.key == 'Escape' && bigImageContainer.style.display != 'none')
        {
            bigImageContainer.style.display = 'none';
            console.log(e.key);
        } 
    });
}
