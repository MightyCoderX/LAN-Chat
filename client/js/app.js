const socket = io(location.origin);

if ('serviceWorker' in navigator)
{
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

let urlParams = (new URL(location)).searchParams;
let username = urlParams.get('username');
document.title += ` - ${username}`;


const chatBox = document.querySelector('.chat > .chat-box');
const txtMsg = document.getElementById('txtMsg');
const btnSend = document.querySelector('.btn-send');
const imageInput = document.querySelector(".file-input");
const customInput = imageInput.nextElementSibling;
const usersList = document.querySelector('.users-list');
const bigImageContainer = document.querySelector('.big-image-container');
const bigImage = document.querySelector('.big-image');
const attachmentPreview = document.querySelector('.attachment-preview');

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
    attachmentPreview.style.padding = '0.5rem';
    attachmentPreview.innerHTML = '';
    Array.from(imageInput.files).forEach(file =>
    {
        addPreviewItem(file);
    });
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
        attachmentPreview.style.padding = '0';
        attachmentPreview.innerHTML = '';
        socket.emit('send_file', { content: formattedMessageText(), file: imageInput.files[0] });
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
        addMessage(msg.user, msg.content, msg.timestamp, msg.file);
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

socket.on('file_received', ({ user, content, timestamp, file }) =>
{   
    addMessage(user, content, timestamp, file);
});

function addPreviewItem(file)
{
    const previewItem = document.createElement('img');
    previewItem.classList.add('item');
    previewItem.src = URL.createObjectURL(file);
    document.querySelector('.attachment-preview').appendChild(previewItem);
}

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
        //TODO: fix xss vulnerability
        // pText.innerHTML = text.replace(/(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/g, '<a href="$1">$1</a>');
        pText.innerText = text;
        messageDiv.appendChild(pText);
    }

    const smallTimestamp = document.createElement('small');
    smallTimestamp.classList.add('timestamp');
    smallTimestamp.textContent = (new Date(timestamp)).toLocaleString();

    
    if(imageBuffer)
    {
        const image = document.createElement('img');
        image.src = 'data:image/webp;base64,' + imageBuffer;
        
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

    bigImageContainer.addEventListener('click', e =>
    {
        if(e.target == bigImageContainer)
        {
            bigImageContainer.style.display = 'none';
        }
    });

    document.addEventListener('keyup', e =>
    {
        if(e.key == 'Escape' && bigImageContainer.style.display != 'none')
        {
            bigImageContainer.style.display = 'none';
        } 
    });
}
