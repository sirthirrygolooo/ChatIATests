const socket = io({
    auth: { serverOffset: 0, username: localStorage.getItem('username') || 'Anonyme' },
    ackTimeout: 10000,
    retries: 3,
});

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const toggleButton = document.getElementById('toggle-btn');

usernameInput.value = localStorage.getItem('username') || '';
usernameInput.addEventListener('change', () => {
    localStorage.setItem('username', usernameInput.value || 'Anonyme');
    socket.disconnect();
    socket.auth.username = usernameInput.value;
    socket.connect();
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        const clientOffset = `${socket.id}-${Date.now()}`;
        socket.emit('chat message', input.value, clientOffset);
        input.value = '';
    }
});

socket.on('chat message', (msg, sender, time) => {
    const item = document.createElement('li');
    item.innerHTML = `<strong>[${time}] ${sender}:</strong> ${msg}`;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on('status message', (msg, color) => {
    const item = document.createElement('li');
    item.textContent = msg;
    item.style.color = color;
    messages.appendChild(item);
});

toggleButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (socket.connected) {
        toggleButton.innerText = 'Connect';
        socket.disconnect();
    } else {
        toggleButton.innerText = 'Disconnect';
        socket.connect();
    }
});