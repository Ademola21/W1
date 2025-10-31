import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcrypt';
const { Pool } = pkg;

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.get('/api/movies', async (req, res) => {
  try {
    const { genre, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT m.id, m.title, m.description, m.year, m.rating, m.duration, m.poster_url, m.trailer_url, m.part, m.created_at, m.updated_at,
        (SELECT ARRAY_AGG(DISTINCT g.name) FROM movie_genres mg2 JOIN genres g ON mg2.genre_id = g.id WHERE mg2.movie_id = m.id) as genres,
        (SELECT json_agg(json_build_object('name', cm.name, 'avatarUrl', cm.profile_url))
         FROM movie_cast mc
         JOIN cast_members cm ON mc.cast_id = cm.id
         WHERE mc.movie_id = m.id) as cast
      FROM movies m
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (genre && genre !== 'All Popular') {
      query += ` AND EXISTS (SELECT 1 FROM movie_genres mg JOIN genres g ON mg.genre_id = g.id WHERE mg.movie_id = m.id AND g.name = $${paramIndex})`;
      params.push(genre);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND m.title ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY m.rating DESC, m.year DESC`;
    
    let countQuery = 'SELECT COUNT(m.id) as total FROM movies m WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;
    
    if (genre && genre !== 'All Popular') {
      countQuery += ` AND EXISTS (SELECT 1 FROM movie_genres mg JOIN genres g ON mg.genre_id = g.id WHERE mg.movie_id = m.id AND g.name = $${countParamIndex})`;
      countParams.push(genre);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND m.title ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const movies = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      posterUrl: row.poster_url,
      rating: parseFloat(row.rating),
      year: row.year,
      part: row.part,
      genres: (row.genres || []).filter(g => g !== null),
      description: row.description,
      cast: row.cast || [],
      trailerUrl: row.trailer_url
    }));
    
    res.json({ 
      movies, 
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT m.*, 
        ARRAY_AGG(DISTINCT g.name) as genres,
        COALESCE(
          (SELECT json_agg(json_build_object('name', cm.name, 'avatarUrl', cm.profile_url))
           FROM movie_cast mc
           JOIN cast_members cm ON mc.cast_id = cm.id
           WHERE mc.movie_id = m.id),
          '[]'::json
        ) as cast
      FROM movies m
      LEFT JOIN movie_genres mg ON m.id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      WHERE m.id = $1
      GROUP BY m.id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    const row = result.rows[0];
    const movie = {
      id: row.id,
      title: row.title,
      posterUrl: row.poster_url,
      rating: parseFloat(row.rating),
      year: row.year,
      part: row.part,
      genres: (row.genres || []).filter(g => g !== null),
      description: row.description,
      cast: row.cast || [],
      trailerUrl: row.trailer_url
    };
    
    res.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

app.get('/api/movies/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT c.id, c.text, c.created_at, u.name as user, u.avatar_url as avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.movie_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const result = await pool.query(query, [id]);
    
    const comments = result.rows.map(row => ({
      id: row.id,
      user: row.user,
      avatar: row.avatar,
      timestamp: formatTimestamp(row.created_at),
      text: row.text
    }));
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/movies/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = `
      INSERT INTO comments (movie_id, user_id, text)
      VALUES ($1, $2, $3)
      RETURNING id, text, created_at
    `;
    
    const result = await pool.query(query, [id, userId, text]);
    
    const userQuery = 'SELECT name, avatar_url FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    const comment = {
      id: result.rows[0].id,
      user: userResult.rows[0].name,
      avatar: userResult.rows[0].avatar_url,
      timestamp: formatTimestamp(result.rows[0].created_at),
      text: result.rows[0].text
    };
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Account exists but password not set. Please reset your password.' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, avatar_url
    `;
    const defaultAvatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
    const result = await pool.query(insertQuery, [name, email, passwordHash, defaultAvatar]);
    
    const user = result.rows[0];
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url
    });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Failed to signup' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT id, name, email, avatar_url FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, avatarUrl } = req.body;
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (name) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }
    
    if (email) {
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }
    
    if (avatarUrl) {
      updates.push(`avatar_url = $${paramIndex}`);
      params.push(avatarUrl);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, avatar_url
    `;
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    const query = 'SELECT name FROM genres ORDER BY name';
    const result = await pool.query(query);
    const genres = ['All Popular', ...result.rows.map(row => row.name)];
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

app.get('/api/users/:userId/watchlist', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT m.id, m.title, m.description, m.year, m.rating, m.duration, m.poster_url, m.trailer_url, m.part,
        (SELECT ARRAY_AGG(DISTINCT g.name) FROM movie_genres mg2 JOIN genres g ON mg2.genre_id = g.id WHERE mg2.movie_id = m.id) as genres
      FROM movies m
      JOIN watchlist w ON m.id = w.movie_id
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    const movies = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      posterUrl: row.poster_url,
      rating: parseFloat(row.rating),
      year: row.year,
      part: row.part,
      genres: (row.genres || []).filter(g => g !== null),
      description: row.description,
      trailerUrl: row.trailer_url
    }));
    
    res.json(movies);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

app.post('/api/users/:userId/watchlist/:movieId', async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    
    const query = `
      INSERT INTO watchlist (user_id, movie_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, movie_id) DO NOTHING
      RETURNING *
    `;
    
    await pool.query(query, [userId, movieId]);
    res.status(201).json({ message: 'Added to watchlist' });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

app.delete('/api/users/:userId/watchlist/:movieId', async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    
    const query = 'DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2';
    await pool.query(query, [userId, movieId]);
    
    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

app.get('/api/users/:userId/continue-watching', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT m.id, m.title, m.description, m.year, m.rating, m.duration, m.poster_url, m.trailer_url, m.part,
        wp.progress_seconds, wp.last_watched,
        (SELECT ARRAY_AGG(DISTINCT g.name) FROM movie_genres mg2 JOIN genres g ON mg2.genre_id = g.id WHERE mg2.movie_id = m.id) as genres
      FROM movies m
      JOIN watch_progress wp ON m.id = wp.movie_id
      WHERE wp.user_id = $1
      ORDER BY wp.last_watched DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [userId]);
    
    const movies = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      posterUrl: row.poster_url,
      rating: parseFloat(row.rating),
      year: row.year,
      part: row.part,
      genres: (row.genres || []).filter(g => g !== null),
      description: row.description,
      trailerUrl: row.trailer_url,
      progress: row.progress_seconds,
      lastWatched: row.last_watched
    }));
    
    res.json(movies);
  } catch (error) {
    console.error('Error fetching continue watching:', error);
    res.status(500).json({ error: 'Failed to fetch continue watching' });
  }
});

app.post('/api/users/:userId/watch-progress/:movieId', async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    const { progressSeconds } = req.body;
    
    const query = `
      INSERT INTO watch_progress (user_id, movie_id, progress_seconds, last_watched)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, movie_id) 
      DO UPDATE SET progress_seconds = $3, last_watched = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    await pool.query(query, [userId, movieId, progressSeconds]);
    res.json({ message: 'Progress updated' });
  } catch (error) {
    console.error('Error updating watch progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

function formatTimestamp(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;
  
  return new Date(date).toLocaleDateString();
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend API running on port ${port}`);
});
