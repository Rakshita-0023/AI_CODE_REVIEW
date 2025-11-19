import express from 'express';
const router = express.Router();

router.post('/run', (req, res) => {
  res.json({ message: 'Execute endpoint' });
});

export default router;