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


io.on('connection', socket =>
{
    socket.on('login', username =>
    {
        if(!validateUsername(username)) 
            return socket.emit('login_error', 'Username contains illegal characters');
        
        if(users.map(user => user.username).includes(username))
            return socket.emit('login_error', 'Username is already taken');
        
        const user = { username, id: username.replace(/ +/g, '-') };
        users.push(user);
        socket.emit('login', user);

        console.log(`${username} joined the chat!`);
        console.log('Users:', users, '\n');

        socket.emit('all_messages', messages);
        io.emit('user_joined', user);
    
        socket.on('typing', typing =>
        {
            io.emit('typing', { user, typing });
        });

        socket.on('send_message', content =>
        {
            let msg = { user, content, timestamp: Date.now() };

            io.emit('message_received', msg);
            messages.push(msg);
        });

        socket.on('send_file', ({ content, file }) =>
        {
            let imgMsg = {
                user, 
                content, 
                timestamp: new Date(), 
                file: file.toString('base64')
            };

            io.emit('file_received', imgMsg);

            messages.push(imgMsg);
        });

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

function validateUsername(username)
{
    const illegalCharacters = '`"\'\\';

    return username?.split('').every(char => !illegalCharacters.includes(char));
}
