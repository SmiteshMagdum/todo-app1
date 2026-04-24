const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

app.use(cors());
app.use(express.json());

// ─── In-Memory Store ──────────────────────────────────────────────────────────
const users = [];   
const todos = [];   

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}




app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Signed in successfully',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, username: user.username, email: user.email });
});


app.get('/api/todos', authenticateToken, (req, res) => {
  const userTodos = todos
    .filter(t => t.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userTodos);
});

app.post('/api/todos', authenticateToken, (req, res) => {
  const { title, description } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTodo = {
    id: uuidv4(),
    userId: req.user.id,
    title: title.trim(),
    description: description ? description.trim() : '',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.put('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;

  const todoIndex = todos.findIndex(t => t.id === id && t.userId === req.user.id);
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const todo = todos[todoIndex];

  if (title !== undefined) todo.title = title.trim();
  if (description !== undefined) todo.description = description.trim();
  if (completed !== undefined) todo.completed = Boolean(completed);
  todo.updatedAt = new Date().toISOString();

  todos[todoIndex] = todo;
  res.json(todo);
});

app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex(t => t.id === id && t.userId === req.user.id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(todoIndex, 1);
  res.json({ message: 'Todo deleted successfully' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST   /api/auth/signup`);
  console.log(`   POST   /api/auth/signin`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/todos`);
  console.log(`   POST   /api/todos`);
  console.log(`   PUT    /api/todos/:id`);
  console.log(`   DELETE /api/todos/:id`);
});