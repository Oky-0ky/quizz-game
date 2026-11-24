-- ============================================================================
-- QUIZ BOARD ADVENTURE — DATABASE SCHEMA
-- PostgreSQL / Supabase Schema for Multiplayer Educational Adventure Board Game
-- All 20 tables as specified in Master Requirement #23
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'player' CHECK (role IN ('player', 'host', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GAME ROOMS TABLE
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'paused', 'finished')),
    game_mode VARCHAR(50) DEFAULT 'classic' CHECK (game_mode IN ('classic', 'quiz_race', 'dice_adventure', 'strategy_battle', 'mystery_board', 'custom')),
    movement_mode VARCHAR(50) DEFAULT 'fixed' CHECK (movement_mode IN ('fixed', 'dice', 'challenge', 'strategy')),
    current_turn INT DEFAULT 1,
    current_team_index INT DEFAULT 0,
    max_teams INT DEFAULT 4,
    members_per_team INT DEFAULT 3,
    total_tiles INT DEFAULT 100,
    question_time_limit INT DEFAULT 30,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    settings_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(30) NOT NULL,
    avatar_emoji VARCHAR(20) DEFAULT '🦅',
    current_position INT DEFAULT 1,
    coins INT DEFAULT 0,
    score INT DEFAULT 0,
    correct_answers_count INT DEFAULT 0,
    duel_wins_count INT DEFAULT 0,
    is_protected BOOLEAN DEFAULT FALSE,
    skip_turns INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    avatar_emoji VARCHAR(20) DEFAULT '👦',
    is_current_speaker BOOLEAN DEFAULT FALSE,
    turn_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOARD CONFIGS TABLE
CREATE TABLE IF NOT EXISTS board_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_tiles INT DEFAULT 100,
    grid_columns INT DEFAULT 10,
    environment_theme VARCHAR(50) DEFAULT 'mixed',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BOARD TILES TABLE
CREATE TABLE IF NOT EXISTS board_tiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_config_id UUID NOT NULL REFERENCES board_configs(id) ON DELETE CASCADE,
    position INT NOT NULL,
    tile_type VARCHAR(50) NOT NULL CHECK (tile_type IN ('normal', 'start', 'finish', 'reward', 'challenge', 'trap', 'shop', 'mystery', 'duel', 'shortcut', 'rest', 'tax')),
    label VARCHAR(100),
    description TEXT,
    effect_type VARCHAR(50),
    effect_value INT DEFAULT 0,
    effect_target_tile INT,
    color VARCHAR(30),
    icon VARCHAR(30),
    environment VARCHAR(50),
    x_coord INT,
    y_coord INT,
    CONSTRAINT unique_board_tile_position UNIQUE (board_config_id, position)
);

-- 7. QUESTION CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS question_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES question_categories(id) ON DELETE SET NULL,
    type VARCHAR(50) DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'image_guess', 'logic', 'math', 'buzzer', 'special_challenge')),
    difficulty VARCHAR(30) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
    question_text TEXT NOT NULL,
    image_url TEXT,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    time_limit INT DEFAULT 30,
    coins_reward INT DEFAULT 10,
    movement_reward INT DEFAULT 3,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. GAME TURNS TABLE
CREATE TABLE IF NOT EXISTS game_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    turn_number INT NOT NULL,
    active_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    active_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'answered', 'moving', 'completed', 'skipped')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 10. ANSWERS TABLE
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turn_id UUID NOT NULL REFERENCES game_turns(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT,
    coins_awarded INT DEFAULT 0,
    steps_moved INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TEAM POSITIONS (AUDIT & HISTORY) TABLE
CREATE TABLE IF NOT EXISTS team_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    turn_id UUID REFERENCES game_turns(id) ON DELETE SET NULL,
    from_position INT NOT NULL,
    to_position INT NOT NULL,
    steps_delta INT NOT NULL,
    trigger_reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TEAM COINS (AUDIT & TRANSACTION) TABLE
CREATE TABLE IF NOT EXISTS team_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    amount_change INT NOT NULL,
    balance_after INT NOT NULL,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('answer_reward', 'bonus_speed', 'shop_purchase', 'tax', 'trap', 'duel_win', 'mission_reward', 'event', 'admin_adjustment')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SHOP ITEMS TABLE
CREATE TABLE IF NOT EXISTS shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) CHECK (category IN ('help', 'strategy', 'defense')),
    description TEXT NOT NULL,
    icon VARCHAR(30),
    emoji VARCHAR(20),
    price INT NOT NULL DEFAULT 10,
    max_stock INT DEFAULT 99,
    usage_limit INT DEFAULT 3,
    requires_target BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    effect_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TEAM INVENTORY TABLE
CREATE TABLE IF NOT EXISTS team_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    used_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_team_item UNIQUE (team_id, item_id)
);

-- 15. ITEM USAGE LOG TABLE
CREATE TABLE IF NOT EXISTS item_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    target_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    turn_id UUID REFERENCES game_turns(id) ON DELETE SET NULL,
    effect_result_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. RANDOM EVENTS TABLE
CREATE TABLE IF NOT EXISTS random_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    emoji VARCHAR(20),
    event_type VARCHAR(50) NOT NULL,
    affects_all_teams BOOLEAN DEFAULT TRUE,
    duration_turns INT DEFAULT 0,
    effect_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. MISSIONS TABLE
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    emoji VARCHAR(20),
    condition_type VARCHAR(50) NOT NULL,
    condition_target INT NOT NULL,
    reward_coins INT DEFAULT 0,
    reward_steps INT DEFAULT 0,
    reward_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. DUELS TABLE
CREATE TABLE IF NOT EXISTS duels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    challenger_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    defender_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    challenger_answer TEXT,
    defender_answer TEXT,
    challenger_is_correct BOOLEAN,
    defender_is_correct BOOLEAN,
    challenger_time_seconds NUMERIC(5,2),
    defender_time_seconds NUMERIC(5,2),
    winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    stakes_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'challenger_turn', 'defender_turn', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    emoji VARCHAR(20),
    criteria_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. GAME RESULTS TABLE
CREATE TABLE IF NOT EXISTS game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    total_turns INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    standings_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    achievements_awarded_json JSONB DEFAULT '[]'::jsonb,
    ended_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE & REALTIME
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_teams_room_id ON teams(room_id);
CREATE INDEX IF NOT EXISTS idx_board_tiles_board ON board_tiles(board_config_id, position);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_game_turns_room ON game_turns(room_id);
CREATE INDEX IF NOT EXISTS idx_answers_team ON answers(team_id);
CREATE INDEX IF NOT EXISTS idx_duels_room ON duels(room_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE random_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Public read policies for game participation
CREATE POLICY "Public can view active game rooms" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "Public can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public can view board tiles" ON board_tiles FOR SELECT USING (true);
CREATE POLICY "Public can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public can view shop items" ON shop_items FOR SELECT USING (true);
CREATE POLICY "Public can view random events" ON random_events FOR SELECT USING (true);
CREATE POLICY "Public can view missions" ON missions FOR SELECT USING (true);
CREATE POLICY "Public can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public can view game results" ON game_results FOR SELECT USING (true);
