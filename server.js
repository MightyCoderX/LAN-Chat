const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server);

const messages = [];
let users = [];

server.listen(3000, () =>
{
    console.log('Listening at "http://localhost:3000/"...');
});

app.use(express.static('./client/'));

app.get('/', (req, res) =>
{
    res.sendFile('join.html', {root: './client/'});
});

io.on('connection', socket =>
{
    socket.on('join', username =>
    {
        if(users.includes(username))
        {
            return socket.emit('username_status', 'in_use');
        }

        socket.emit('username_status', 'ok');

        users.push(username);

        console.log(`${username} joined the chat!`);
        console.log(users);

        io.emit('user_joined', username);
    
        socket.on('send_message', content =>
        {
            let msg = { username, content };
            io.emit('message_received', msg);

            messages.push(msg);
        });

        socket.on('send_image', content =>
        {
            let imgMsg = { username, text: content.text, buffer: content.buffer.toString('base64')};
            io.emit('image_received', imgMsg);

            messages.push(imgMsg);
        });

        socket.emit('all_messages', messages);

        io.emit('all_users', users);

        socket.on('disconnect', socketDisc =>
        {
            console.log(`${username} left the chat!`);
            io.emit('user_left', username);
            users = users.filter(e => e !== username);
            console.log(users);
            io.emit('all_users', users);
        });
    });
});