# Cenimax Database - Local PostgreSQL

This database runs **locally** in your project - no cloud, no Neon, no vendor lock-in!

## What's Included

```
database/
├── data/              # PostgreSQL data files (NOT in GitHub - .gitignored)
├── scripts/           # Management scripts (IN GitHub)
│   ├── start-db.sh   # Start PostgreSQL
│   └── stop-db.sh    # Stop PostgreSQL
├── schema.sql         # Database structure (IN GitHub)
└── README.md          # This file (IN GitHub)
```

## Database Structure

### Tables:
- **movies** - Movie metadata (title, description, year, rating, CDN URLs)
- **genres** - Genre list (Action, Comedy, Drama, etc.)
- **movie_genres** - Many-to-many relationship
- **cast_members** - Actors, directors, producers
- **movie_cast** - Movie-to-cast relationships

### Performance Features:
- ✅ Indexed on title, year, rating for fast queries
- ✅ Automatic timestamp updates
- ✅ Proper foreign key relationships
- ✅ Optimized for read-heavy workloads (browsing movies)

## Usage on Replit

### Start Database:
```bash
./database/scripts/start-db.sh
```

### Stop Database:
```bash
./database/scripts/stop-db.sh
```

### Connect:
```bash
psql -d cenimax
```

### Connection String:
```
postgresql://localhost:5432/cenimax
```

## Moving to GitHub

When you push to GitHub:
- ✅ `schema.sql` goes to GitHub
- ✅ Scripts go to GitHub
- ✅ Structure is preserved
- ❌ Data files stay local (too large for Git)

## Moving to Your VM

### Step 1: On your VM, install PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### Step 2: Clone your GitHub repo
```bash
git clone your-repo-url
cd cenimax
```

### Step 3: Initialize database
```bash
# Initialize PostgreSQL
sudo -u postgres createdb cenimax

# Apply schema
sudo -u postgres psql -d cenimax -f database/schema.sql
```

### Step 4: Done!
Your VM now has the same database structure. Just update your backend connection string.

## Migrating Data Between Environments

### Export data (from Replit or any PostgreSQL):
```bash
pg_dump -d cenimax --data-only > database/data-export.sql
```

### Import data (on your VM):
```bash
psql -d cenimax < database/data-export.sql
```

## Moving Between VMs

Same process:
1. Export: `pg_dump -d cenimax > backup.sql`
2. Clone repo on new VM
3. Import: `psql -d cenimax < backup.sql`

Your data follows you anywhere! 🚀
