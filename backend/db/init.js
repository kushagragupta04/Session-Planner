const db = require('./index');

const initDb = async () => {
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'ATTENDEE' CHECK (role IN ('ADMIN', 'SPEAKER', 'ATTENDEE')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    const createConferencesTable = `
    CREATE TABLE IF NOT EXISTS conferences (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        start_date DATE,
        end_date DATE,
        timezone VARCHAR(50)
    );
  `;

    // Adding the rest of the schema from the project brief
    const createTracksTable = `
    CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        conference_id INTEGER REFERENCES conferences(id),
        name VARCHAR(100),
        description TEXT
    );
  `;

    const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        track_id INTEGER REFERENCES tracks(id),
        title VARCHAR(255),
        description TEXT,
        level VARCHAR(20),
        duration INTERVAL,
        prerequisites TEXT[],
        status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        equipment_requirements TEXT,
        slides_url TEXT
    );
  `;

    const createSpeakersTable = `
    CREATE TABLE IF NOT EXISTS speakers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        bio TEXT,
        expertise TEXT[],
        availability JSONB,
        user_id INTEGER REFERENCES users(id)
    );
  `;

    const createVenuesTable = `
    CREATE TABLE IF NOT EXISTS venues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        address TEXT,
        floor_plan JSONB
    );
  `;

    const createRoomsTable = `
    CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        venue_id INTEGER REFERENCES venues(id),
        name VARCHAR(100),
        capacity INTEGER,
        resources TEXT[]
    );
  `;

    const createSessionSpeakersTable = `
    CREATE TABLE IF NOT EXISTS session_speakers (
        session_id INTEGER REFERENCES sessions(id),
        speaker_id INTEGER REFERENCES speakers(id),
        is_primary BOOLEAN,
        PRIMARY KEY (session_id, speaker_id)
    );
  `;

    const createSessionScheduleTable = `
    CREATE TABLE IF NOT EXISTS session_schedule (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id),
        room_id INTEGER REFERENCES rooms(id),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        UNIQUE(room_id, start_time)
    );
  `;

    const createRegistrationsTable = `
    CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id INTEGER REFERENCES sessions(id),
        status VARCHAR(20) CHECK (status IN ('CONFIRMED', 'WAITLISTED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    const createBookmarksTable = `
    CREATE TABLE IF NOT EXISTS bookmarks (
        user_id INTEGER REFERENCES users(id),
        session_id INTEGER REFERENCES sessions(id),
        PRIMARY KEY (user_id, session_id)
    );
  `;

    const createSessionRatingsTable = `
    CREATE TABLE IF NOT EXISTS session_ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id INTEGER REFERENCES sessions(id),
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    try {
        await db.query(createUsersTable);
        await db.query(createConferencesTable);
        await db.query(createTracksTable);
        await db.query(createSessionsTable);
        await db.query(createSpeakersTable);
        await db.query(createVenuesTable);
        await db.query(createRoomsTable);
        await db.query(createSessionSpeakersTable);
        await db.query(createSessionScheduleTable);
        await db.query(createRegistrationsTable);
        await db.query(createBookmarksTable);
        await db.query(createSessionRatingsTable);

        // Migrations: Ensure all essential columns exist if tables were created with older schema
        const migrations = `
          DO $$ 
          BEGIN 
            -- Speakers Table Migrations
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='speakers' AND column_name='user_id') THEN
                ALTER TABLE speakers ADD COLUMN user_id INTEGER REFERENCES users(id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='speakers' AND column_name='expertise') THEN
                ALTER TABLE speakers ADD COLUMN expertise TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='speakers' AND column_name='bio') THEN
                ALTER TABLE speakers ADD COLUMN bio TEXT;
            END IF;

            -- Sessions Table Migrations
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='track_id') THEN
                ALTER TABLE sessions ADD COLUMN track_id INTEGER REFERENCES tracks(id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='status') THEN
                ALTER TABLE sessions ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PENDING_CONFLICT', 'SCHEDULED'));
            ELSE
                -- Update existing constraint if it exists
                ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
                ALTER TABLE sessions ADD CONSTRAINT sessions_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PENDING_CONFLICT', 'SCHEDULED'));
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='level') THEN
                ALTER TABLE sessions ADD COLUMN level VARCHAR(20);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='duration') THEN
                ALTER TABLE sessions ADD COLUMN duration INTERVAL;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='prerequisites') THEN
                ALTER TABLE sessions ADD COLUMN prerequisites TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='equipment_requirements') THEN
                ALTER TABLE sessions ADD COLUMN equipment_requirements TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='slides_url') THEN
                ALTER TABLE sessions ADD COLUMN slides_url TEXT;
            END IF;

            -- Schedule Table Index Migrations
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_schedule_session_id_key') THEN
                ALTER TABLE session_schedule ADD CONSTRAINT session_schedule_session_id_key UNIQUE (session_id);
            END IF;
          END $$;
        `;
        await db.query(migrations);

        // One-time fix for the user's date selection issue
        await db.query(`
          UPDATE conferences 
          SET start_date = '2026-03-10', end_date = '2026-03-25' 
          WHERE id = (SELECT id FROM conferences LIMIT 1)
        `);

        console.log("Database initialized and migrated successfully");
    } catch (err) {
        console.error("Error initializing database", err);
    }
};

module.exports = initDb;
