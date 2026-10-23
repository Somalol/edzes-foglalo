import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

export const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('KRITIKUS HIBA: A JWT_SECRET környezeti változó nincs beállítva!');
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  ageRange: string;
  role: 'user' | 'admin';
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

// --- MIDDLEWARE-EK ---
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Bejelentkezés szükséges.' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: 'Érvénytelen vagy lejárt munkamenet.' });
  }
};

const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as AuthUser;
    } catch {
      // Érvénytelen token esetén vendégként folytatja
    }
  }
  next();
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Ehhez a művelethez admin jogosultság szükséges.' });
  }
  next();
};

// ==========================================
// 1. AUTH VÉGPONTOK
// ==========================================
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, ageRange } = req.body;
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ezzel az e-mail címmel már regisztráltak.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password_hash, age_range, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, ageRange, 'user']
    );

    const user: AuthUser = { id: result.insertId, name, email, ageRange, role: 'user' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { ...user, id: String(user.id) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Szerverhiba a regisztráció során.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Hibás e-mail cím vagy jelszó.' });
    }

    const dbUser = rows[0];
    const valid = await bcrypt.compare(password, dbUser.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Hibás e-mail cím vagy jelszó.' });
    }

    const user: AuthUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      ageRange: dbUser.age_range,
      role: dbUser.role,
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { ...user, id: String(user.id) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Szerverhiba a belépés során.' });
  }
});

// ==========================================
// 2. EDZÉSEK ÉS FOGLALÁSOK VÉGPONTOK
// ==========================================
app.get('/api/workouts', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const currentUserId = req.user?.id;

    const [workouts] = await pool.query<RowDataPacket[]>('SELECT * FROM workouts ORDER BY start_time ASC');
    const [bookings] = await pool.query<RowDataPacket[]>('SELECT * FROM bookings ORDER BY created_at ASC');

    const formatted = workouts.map((w) => ({
      id: String(w.id),
      baseTitle: w.base_title,
      description: w.description || '',
      type: w.type,
      start: w.start_time,
      end: w.end_time,
      maxCapacity: w.max_capacity,
      participants: bookings
        .filter((b) => b.workout_id === w.id)
        .map((b) => {
          // ADATVÉDELEM: Csak az Admin láthatja a résztvevők nevét és korosztályát!
          if (isAdmin) {
            return {
              id: String(b.id),
              name: b.participant_name,
              ageRange: b.age_range,
              isGuest: Boolean(b.is_guest),
              userId: b.user_id ? String(b.user_id) : undefined,
            };
          }
          // Nem-adminoknak anonimizált adatot küldünk (csak a létszámhoz és a saját foglalás felismeréséhez)
          return {
            id: String(b.id),
            name: 'Jelentkező',
            ageRange: '26-35',
            isGuest: Boolean(b.is_guest),
            userId: b.user_id === currentUserId ? String(b.user_id) : undefined,
          };
        }),
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba az edzések lekérésekor.' });
  }
});

app.post('/api/workouts', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { baseTitle, description, type, start, end, maxCapacity } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO workouts (base_title, description, type, start_time, end_time, max_capacity) VALUES (?, ?, ?, ?, ?, ?)',
      [baseTitle, description || '', type, new Date(start), new Date(end), maxCapacity]
    );
    res.json({ id: String(result.insertId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba az edzés létrehozásakor.' });
  }
});

app.put('/api/workouts/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { baseTitle, description, type, start, end, maxCapacity } = req.body;
    await pool.query(
      'UPDATE workouts SET base_title=?, description=?, type=?, start_time=?, end_time=?, max_capacity=? WHERE id=?',
      [baseTitle, description || '', type, new Date(start), new Date(end), maxCapacity, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba az edzés módosításakor.' });
  }
});

app.delete('/api/workouts/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM workouts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba az edzés törlésekor.' });
  }
});

// Jelentkezés edzésre (Vendégként vagy Tagként)
app.post('/api/workouts/:id/book', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const workoutId = req.params.id;
    const [workouts] = await pool.query<RowDataPacket[]>('SELECT max_capacity, start_time FROM workouts WHERE id = ?', [workoutId]);
    if (workouts.length === 0) return res.status(404).json({ error: 'Az edzés nem található.' });

    const [currentBookings] = await pool.query<RowDataPacket[]>('SELECT id, user_id FROM bookings WHERE workout_id = ?', [workoutId]);
    if (currentBookings.length >= workouts[0].max_capacity) {
      return res.status(400).json({ error: 'Erre az edzésre sajnos minden hely betelt.' });
    }

    if (req.user) {
      const alreadyBooked = currentBookings.some((b) => b.user_id === req.user!.id);
      if (alreadyBooked) return res.status(400).json({ error: 'Erre az edzésre már feliratkoztál.' });

      await pool.query(
        'INSERT INTO bookings (workout_id, user_id, participant_name, age_range, is_guest) VALUES (?, ?, ?, ?, FALSE)',
        [workoutId, req.user.id, req.user.name, req.user.ageRange]
      );
    } else {
      const { name, ageRange } = req.body;
      if (!name || !ageRange) return res.status(400).json({ error: 'Név és korosztály megadása kötelező.' });

      await pool.query(
        'INSERT INTO bookings (workout_id, user_id, participant_name, age_range, is_guest) VALUES (?, NULL, ?, ?, TRUE)',
        [workoutId, name, ageRange]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a jelentkezés során.' });
  }
});

// Jelentkezés lemondása (Tagként)
app.delete('/api/workouts/:id/book', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM bookings WHERE workout_id = ? AND user_id = ?', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a lemondás során.' });
  }
});

// ==========================================
// 3. BLOG ÉS KOMMENTEK VÉGPONTOK
// ==========================================
app.get('/api/posts', async (_req: Request, res: Response) => {
  try {
    const [posts] = await pool.query<RowDataPacket[]>('SELECT * FROM blog_posts ORDER BY created_at DESC');
    const [comments] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, u.name as author_name 
       FROM blog_comments c 
       JOIN users u ON c.user_id = u.id 
       ORDER BY c.created_at ASC`
    );

    const formatted = posts.map((p) => ({
      id: String(p.id),
      title: p.title,
      content: p.content,
      createdAt: p.created_at,
      comments: comments
        .filter((c) => c.post_id === p.id)
        .map((c) => ({
          id: String(c.id),
          authorId: String(c.user_id),
          authorName: c.author_name,
          content: c.content,
          createdAt: c.created_at,
        })),
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a blogbejegyzések lekérésekor.' });
  }
});

app.post('/api/posts', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    await pool.query('INSERT INTO blog_posts (title, content) VALUES (?, ?)', [title, content]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a poszt mentésekor.' });
  }
});

app.delete('/api/posts/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a poszt törlésekor.' });
  }
});

app.post('/api/posts/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    await pool.query('INSERT INTO blog_comments (post_id, user_id, content) VALUES (?, ?, ?)', [
      req.params.id,
      req.user!.id,
      content,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a hozzászólás küldésekor.' });
  }
});

app.delete('/api/comments/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM blog_comments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a hozzászólás törlésekor.' });
  }
});