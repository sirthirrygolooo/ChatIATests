// index.js
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function main() {
    const db = await open({
        filename: 'chat.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        DROP TABLE IF EXISTS messages;
      CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_offset TEXT UNIQUE,
          username TEXT DEFAULT 'Anonyme',
          content TEXT,
          timestamp TEXT
      );
    `);

    const app = express();
    const server = createServer(app);
    const io = new Server(server, {
        connectionStateRecovery: {}
    });
    const path = require('path');

    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, '/public/index.html'));
    });

    io.on('connection', async (socket) => {
        const username = socket.handshake.auth.username || 'Anonyme';
        console.log(`[+] ${username} connected`);
        io.emit('status message', `✅ ${username} est connecté !`, 'green');

        socket.on('disconnect', () => {
            console.log(`[-] ${username} disconnected`);
            io.emit('status message', `❌ ${username} s'est déconnecté.`, 'red');
        });

        socket.on('chat message', async (msg, clientOffset, callback) => {
            const timestamp = new Date().toLocaleTimeString();
            try {
                await db.run('INSERT INTO messages (content, client_offset, username, timestamp) VALUES (?, ?, ?, ?)', msg, clientOffset, username, timestamp);
            } catch (e) {
                if (e.errno === 19) {
                    callback();
                }
                return;
            }
            io.emit('chat message', msg, username, timestamp);
            callback();
        });
    });

    app.use(express.static(path.join(__dirname, 'public')));

    server.listen(3000, () => {
        console.log('Server running at http://localhost:3000');
    });
}

main();