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
      CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_offset TEXT UNIQUE,
          content TEXT
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
        console.log('[+] User connected');

        socket.on('disconnect', () => {
            console.log('[-] User disconnected');
        });

        socket.on('chat message', async (msg, clientOffest, callback) => {
            let result;
            try {
                result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
            } catch (e) {
                if (e.errno === 19) {
                    callback();
                  } else {
                  }
                  return;
            }
            io.emit('chat message', msg, result.lastID);
            callback();
        });

        if (!socket.recovered) {
            try {
                await db.each('SELECT id, content FROM messages WHERE id > ?',
                    [socket.handshake.auth.serverOffset || 0],
                    (_err, row) => {
                        socket.emit('chat message', row.content, row.id);
                    }
                )
            } catch (e) {
                console.log("error : ", e)
            }
        }
    });

    app.use(express.static(path.join(__dirname, 'public')));

    server.listen(3000, () => {
        console.log('server running at http://localhost:3000');
    });
}

main();