const form = document.querySelector('form.login-form');
const txtUsername = document.getElementById('txtUsername');
const pError = document.querySelector('p.error');

const chatBox = document.querySelector('.chat-box');
const txtMsg = document.getElementById('txtMsg');
const btnSend = document.querySelector('.btn-send');
const imageInput = document.querySelector('.file-input');
const customInput = imageInput.nextElementSibling;
const usersList = document.querySelector('.users-list');
const bigImageContainer = document.querySelector('.big-image-container');
const bigImage = document.querySelector('.big-image');
const attachmentPreview = document.querySelector('.attachment-preview');
const btnClearAttachments = document.getElementById('btnClearAttachments');

let localUser = { username: '', id: '' };

if(Notification.permission !== 'denied')
{
    Notification.requestPermission();
}

let socket = io(location.origin);

socket.on('connect', () =>
{
    //TODO: Fix auto login & increase image margin top
    if(localStorage.getItem('username'))
    {
        return login(localStorage.getItem('username'));
    }

    console.log('Connected to the server!', form);
    
    txtUsername.focus();

    document.querySelector('.login-form-container').classList.remove('hidden');
    form.addEventListener('submit', e =>
    {
        console.log('Form submitted!');
        e.preventDefault();

        const formData = new FormData(form);
        const formUsername = formData.get('username');

        login(formUsername);
    });
});

function login(username)
{
    socket.emit('login', username);
        
    socket.on('login', user => 
    {
        localUser = user;

        localStorage.setItem('username', username);

        document.querySelector('.login-form-container').classList.add('hidden');

        onJoin();
    });

    socket.on('login_error', errorMessage =>
    {
        socket = io(location.origin);
        pError.innerText = errorMessage;
        pError.classList.add('shown');
    });
}

function onJoin()
{
    document.title += ` - ${localUser.username}`;
    txtMsg.focus();

    btnClearAttachments.addEventListener('click', () =>
    {
        attachmentPreview.querySelectorAll('.item').forEach(e => e.remove());
        attachmentPreview.classList.remove('shown');
        imageInput.value = '';
    });

    txtMsg.addEventListener('input', e =>
    {
        console.log(+txtMsg.style.height.replace('px', ''), +getComputedStyle(txtMsg).height.replace('px', ''));
        if(+txtMsg.style.height.replace('px', '') > +getComputedStyle(txtMsg).height.replace('px', ''))
        {
            txtMsg.classList.add('expanded');
        }
        else
        {
            txtMsg.classList.remove('expanded');
        }
        
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
        attachmentPreview.classList.add('shown');
        attachmentPreview.querySelectorAll('.item').forEach(e => e.remove());
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
            e.preventDefault();
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
        if(user.username == localUser.username) return;
        
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
    if(Notification.permission === 'denied' || message.user.username === localUser.username) return;

    if(Notification.permission === 'default') Notification.requestPermission();

    try
    {
        const notification = new Notification(
            message.user.username, 
            { 
                body: message.content,
                vibrate: true,
                requireInteraction: true,
                icon: '/img/icon.svg',
                badge: '/img/icon.svg'
            }
        );
        
        return notification;
    }
    catch(_)
    {
    }
    
    return null;
}

function formattedMessageText()
{
    return txtMsg.value.trim();
}

function sendMessage()
{
    if(imageInput.files[0])
    {
        attachmentPreview.classList.remove('shown');
        attachmentPreview.querySelectorAll('.item').forEach(e => e.remove());
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


function addMessage(user, content, timestamp, imageBuffer)
{
    const message = document.createElement('chat-message');
    message.setAttribute('username', user.username);
    
    if(content)
    {
        message.setAttribute('content', content);
    }

    message.setAttribute('timestamp', (new Date(timestamp)).toLocaleString());
    
    if(imageBuffer)
    {
        message.setAttribute('img', 'data:image/webp;base64,' + imageBuffer)
    }

    if(localUser.username === user.username)
    {
        message.setAttribute('self', true);
    }

    if(localUser.username === user.username || !chatBox.querySelector(`[data-user="${user.id}"]`))
    {
        chatBox.appendChild(message);
    }
    else
    {
        chatBox.querySelector(`[data-user="${user.id}"]`).replaceWith(message);
    }

    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function addJoined(nick)
{
    const systemMessage = document.createElement('system-message');

    if(nick != localUser.username)
    {
        systemMessage.setAttribute('content', `${nick} joined the chat!`);
    }
    else
    {
        systemMessage.setAttribute('content', `You joined the chat!`);
    }

    chatBox.appendChild(systemMessage);
    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function addLeft(uname)
{
    const systemMessage = document.createElement('system-message');

    if(uname != localUser.username)
    {
        systemMessage.setAttribute('content', `${uname} left the chat!`);
    }

    chatBox.appendChild(systemMessage);
    chatBox.scrollTo(0, chatBox.scrollHeight+100);
}

function createIsTyping(user)
{
    const systemMessage = document.createElement('system-message');
    systemMessage.setAttribute('data-user', user.id);
    systemMessage.systemMessage.setAttribute('content', `${user.username} is typing...`);

    return systemMessage;
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
