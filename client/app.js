const socket = io(location.origin);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    .then(reg =>
    {
        console.log('Registration successful, scope is:', reg.scope);
    })
    .catch(err =>
    {
        console.error('Service worker registration failed, error:', err);
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
        window.open('/', '_self');
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

txtMsg.addEventListener('input', e =>
{
    txtMsg.style.height = '40px';
    txtMsg.style.height = txtMsg.scrollHeight + 'px';
    if(formattedMessageText())
    {
        socket.emit('typing', true);
    }
    else
    {
        socket.emit('typing', false);
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
txtMsg.addEventListener('keydown', e =>
{
    if(e.key == 'Enter' && !e.shiftKey)
    {
        if(formattedMessageText()) txtMsg.style.height = '40px';
        e.preventDefault();
    }
});
txtMsg.addEventListener('keyup', e => 
{
    if(e.key === 'Enter' && !e.shiftKey)
    {
        sendMessage();
    }
});

function formattedMessageText()
{
    return txtMsg.value.trim();
}

function sendMessage()
{
    if(imageInput.files[0])
    {
        socket.emit('send_image', { text: formattedMessageText(), buffer: imageInput.files[0] });
    }
    else
    {
        if(!formattedMessageText()) return;
        socket.emit('send_message', formattedMessageText());
    }
    
    console.log(username, formattedMessageText(), imageInput.value);
    imageInput.value = '';
    txtMsg.value = '';
    socket.emit('typing', false);
}

socket.on('all_messages', messages =>
{
    for(let msg of messages)
    {
        addMessage(msg.user, msg.content, msg.timestamp, msg.buffer);
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
    
    let typingElem = chatBox.querySelector(`[data-user="${user.id}"]`);
    console.log({ typingElem, user, typing });

    if(!typingElem)
    {
        typingElem = createIsTyping(user);
    }

    console.log(typing, typingElem);

    if(typing)
    {
        if(chatBox.contains(typingElem)) return;
        chatBox.appendChild(typingElem);
        chatBox.scrollTo(0, chatBox.scrollHeight+100);
    }
    else
    {
        chatBox.removeChild(typingElem);
    }

});

socket.on('message_received', ({ user, content, timestamp }) =>
{
    addMessage(user, content, timestamp, null);
});

socket.on('image_received', ({ user, text, timestamp, buffer }) =>
{   
    addMessage(user, text, timestamp, buffer);
});

function addMessage(user, text, timestamp, imageBuffer)
{
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('msg-container');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('msg');

    const pUsername = document.createElement('p');
    pUsername.classList.add('username');
    pUsername.textContent = user.username;
    messageDiv.appendChild(pUsername);

    if(text)
    {
        const pText = document.createElement('p');
        pText.classList.add('text');
        pText.innerText = text;
        messageDiv.appendChild(pText);
    }

    const smallTimestamp = document.createElement('small');
    smallTimestamp.classList.add('timestamp');
    smallTimestamp.textContent = (new Date(timestamp)).toLocaleString();

    
    if(imageBuffer)
    {
        const image = document.createElement('img');
        image.src = 'data:image/jpeg;base64,' + imageBuffer;
        
        messageDiv.appendChild(image);
        image.addEventListener('click', e =>
        {
            openImage(image.src);
        });
    }
    
    messageDiv.appendChild(smallTimestamp);
    messageContainer.appendChild(messageDiv);

    if(username === user.username)
    {
        messageContainer.classList.add('self');
    }

    if(username === user.username || !chatBox.querySelector(`[data-user="${user.id}"]`))
    {
        chatBox.appendChild(messageContainer);
    }
    else
    {
        chatBox.querySelector(`[data-user="${user.id}"]`).replaceWith(messageContainer);
    }

    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function addJoined(nick)
{
    const joinMsgDiv = document.createElement('div');
    joinMsgDiv.classList.add('system-msg');

    if(nick != username)
    {
        joinMsgDiv.textContent = `${nick} joined the chat!`;
    }
    else
    {
        joinMsgDiv.textContent = `You joined the chat!`;
    }

    chatBox.appendChild(joinMsgDiv);
    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function addLeft(uname)
{
    const leftMsgDiv = document.createElement('div');
    leftMsgDiv.classList.add('system-msg');

    if(uname != username)
    {
        leftMsgDiv.textContent = `${uname} left the chat!`;
    }

    chatBox.appendChild(leftMsgDiv);
    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function createIsTyping(user)
{
    const isTypingDiv = document.createElement('div');
    isTypingDiv.setAttribute('data-user', user.id);
    isTypingDiv.classList.add('system-msg');
    isTypingDiv.textContent = `${user.username} is typing...`;

    return isTypingDiv;
}

function openImage(dataUrl)
{
    bigImage.src = dataUrl;
    bigImageContainer.style.display = 'block';

    document.addEventListener('click', e =>
    {
        console.log(e.target);
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
