import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', req.body);
  res.json({ 
    message: 'Registration successful',
    user: { id: 1, email: req.body.email },
    token: 'test-token'
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});