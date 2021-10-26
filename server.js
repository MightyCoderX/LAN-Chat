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

app.use(express.static('./client/'));

app.get('/', (req, res) =>
{
    res.sendFile('join.html', {root: './client/'});
});

io.on('connection', socket =>
{
    socket.on('join', username =>
    {
        const user = { username, id: username.replace(/ +/g, '-') };

        if(users.includes(user))
        {
            return socket.emit('username_status', 'in_use');
        }

        socket.emit('username_status', 'ok');

        users.push(user);

        console.log(`${username} joined the chat!`);
        console.log('Users:', users);

        io.emit('user_joined', user);
    
        socket.on('typing', typing =>
        {
            console.log(`${username} is typing...`);

            io.emit('typing', { user, typing });
        });

        socket.on('send_message', content =>
        {
            let msg = { user, content, timestamp: Date.now() };

            io.emit('message_received', msg);
            messages.push(msg);
        });

        socket.on('send_image', content =>
        {
            let imgMsg = {
                user, 
                text: content.text, 
                timestamp: new Date(), 
                buffer: content.buffer.toString('base64') 
            };

            io.emit('image_received', imgMsg);

            messages.push(imgMsg);
        });

        socket.emit('all_messages', messages);

        io.emit('all_users', users);

        socket.on('disconnect', socketDisc =>
        {
            console.log(`${username} left the chat!`);
            io.emit('user_left', user);
            users = users.filter(user => user.username !== username);
            console.log(users, '\n');
            io.emit('all_users', users);
        });
    });
});
