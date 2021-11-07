const chatBox = document.querySelector('.chat-box');
const txtMsg = document.getElementById('txtMsg');
const btnSend = document.querySelector('.btn-send');
const imageInput = document.querySelector(".file-input");
const customInput = imageInput.nextElementSibling;
const usersList = document.querySelector('.users-list');
const bigImageContainer = document.querySelector('.big-image-container');
const bigImage = document.querySelector('.big-image');
const attachmentPreview = document.querySelector('.attachment-preview');
txtMsg.focus();

console.log('chat.js', username);

if(Notification.permission !== 'denied')
{
    Notification.requestPermission();
}

let socket;

function connect()
{
    socket = io(location.origin);
    socket.on('connect', onConnect);
}

function onConnect()
{
    socket.emit('join', username);
    document.title += ` - ${username}`;

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

    customInput.addEventListener('click', e =>
    {
        imageInput.click();
    });

    imageInput.addEventListener('change', e =>
    {
        if(imageInput.files.length == 0) return;
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

        if(!typingElem)
        {
            typingElem = createIsTyping(user);
        }

        if(typing)
        {
            if(chatBox.contains(typingElem)) return;
            chatBox.appendChild(typingElem);
            chatBox.scrollTo(0, chatBox.scrollHeight+100);
        }
        else if(chatBox.contains(typingElem))
        {
            chatBox.removeChild(typingElem);
        }
    });

    socket.on('message_received', ({ user, content, timestamp }) =>
    {
        sendMessageNotification({ user, content, timestamp });
        addMessage(user, content, timestamp, null);
    });

    socket.on('file_received', ({ user, content, timestamp, file }) =>
    {
        sendMessageNotification({ user, content, timestamp, file });
        addMessage(user, content, timestamp, file);
    });
}

function sendMessageNotification(message)
{
    if(Notification.permission === 'denied' || message.user.username === username) return;

    if(Notification.permission === 'default') Notification.requestPermission();

    return new Notification(
        message.user.username, 
        { 
            body: message.content,
            vibrate: true,
            requireInteraction: true,
            icon: '/img/icon.svg',
            badge: '/img/icon.svg'
        }
    );
}

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

    imageInput.value = '';
    txtMsg.value = '';
    
    socket.emit('typing', false);
}

function addPreviewItem(file)
{
    const previewItem = document.createElement('img');
    previewItem.classList.add('item');
    previewItem.src = URL.createObjectURL(file);
    document.querySelector('.attachment-preview').appendChild(previewItem);
}

function escapeHtml(text)
{
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function addMessage(user, content, timestamp, imageBuffer)
{
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('msg-container');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('msg');

    const pUsername = document.createElement('p');
    pUsername.classList.add('username');
    pUsername.textContent = user.username;
    messageDiv.appendChild(pUsername);

    if(content)
    {
        const pContent = document.createElement('p');
        pContent.classList.add('content');
        pContent.innerHTML = marked.marked(escapeHtml(content));
        messageDiv.appendChild(pContent);
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
