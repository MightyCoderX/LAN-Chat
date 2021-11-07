const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const messages = [];
let users = [];

const PORT = process.env.PORT || 3000;

server.listen(PORT, () =>
{
    console.log(`Listening at http://localhost:${PORT}/...`);
});

app.use(express.static('./client/', { index: '_' }));
app.use(express.json());

app.get('/', (req, res) =>
{
    res.sendFile('index.html', { root: './client/' });
});

app.post('/join', (req, res) =>
{
    const username = req.body.username;
    
    const illegalCharacters = '`"\'\\';
    const isUsernameValid = username?.split('')
        .every(char => !illegalCharacters.includes(char));

    if(!isUsernameValid)
    {
        return res.send({
            status: 'error',
            message: 'Username contains illegal characters',
            error: 'illegal'
        });
    }

    const user = { username, id: username.replace(/ +/g, '-') };
    
    if(users.map(user => user.username).includes(user.username))
    {
        return res.send({
            status: 'error',
            message: 'Username is already taken',
            error: 'taken'
        });
    }
    else
    {
        users.push(user);
        return res.send({
            status: 'ok',
            message: 'Username available'
        });
    }
});

io.on('connection', socket =>
{
    socket.on('join', username =>
    {
        const user = users.find(user => user.username == username);
        if(!user) return;
        console.log(`${username} joined the chat!`);
        console.log('Users:', users, '\n');

        io.emit('user_joined', user);
    
        socket.on('typing', typing =>
        {
            io.emit('typing', { user, typing });
        });

        socket.on('send_message', content =>
        {
            let msg = { user, content: escapeHtml(content), timestamp: Date.now() };

            io.emit('message_received', msg);
            messages.push(msg);
        });

        socket.on('send_file', ({ content, file }) =>
        {
            let imgMsg = {
                user, 
                content: escapeHtml(content), 
                timestamp: new Date(), 
                file: file.toString('base64')
            };

            io.emit('file_received', imgMsg);

            messages.push(imgMsg);
        });

        socket.emit('all_messages', messages);

        io.emit('all_users', users);

        socket.on('disconnect', socketDisc =>
        {
            console.log(`${username} left the chat!`);
            io.emit('user_left', user);
            users = users.filter(user => user.username !== username);
            console.log('Users:', users, '\n');
            io.emit('all_users', users);
        });
    });
});

function escapeHtml(text)
{
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
