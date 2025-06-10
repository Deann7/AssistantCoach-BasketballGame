-- ============================================================================
-- FOUNDATIONAL TABLE DEFINITIONS
-- Core database schema for the basketball coach assistant application
-- ============================================================================

-- Users table - Primary user authentication and profile data
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    age INTEGER,
    is_assistant BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stats table - Player statistics tracking
CREATE TABLE IF NOT EXISTS stats (
    stats_id SERIAL PRIMARY KEY,
    point_stats INTEGER DEFAULT 0,
    assist_stats INTEGER DEFAULT 0,
    rebound_stats INTEGER DEFAULT 0,
    steal_stats INTEGER DEFAULT 0,
    block_stats INTEGER DEFAULT 0
);

-- User League table - Each user's isolated league instance
CREATE TABLE IF NOT EXISTS user_league (
    league_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    league_name VARCHAR(100) DEFAULT 'Basketball League',
    season_number INTEGER DEFAULT 1,
    current_round INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, season_number)
);

-- Basketball Team table - Teams within each user's league
CREATE TABLE IF NOT EXISTS basketball_team (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    wins INTEGER DEFAULT 0,
    lose INTEGER DEFAULT 0,
    users_id UUID REFERENCES users(id),
    league_id INTEGER REFERENCES user_league(league_id),
    is_user_team BOOLEAN DEFAULT FALSE
);

-- Player table - Individual players belonging to teams
CREATE TABLE IF NOT EXISTS player (
    player_id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    team_id BIGINT REFERENCES basketball_team(team_id),
    stats_id BIGINT REFERENCES stats(stats_id),
    player_age INTEGER,
    player_rating INTEGER,
    player_height INTEGER,
    player_position VARCHAR(10),
    player_tendencies VARCHAR(20),
    UNIQUE(player_name, team_id)
);

-- Squad table - Starting lineups for teams
CREATE TABLE IF NOT EXISTS squad (
    squad_id SERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES basketball_team(team_id),
    pg VARCHAR(100), -- Point Guard player name
    sg VARCHAR(100), -- Shooting Guard player name
    sf VARCHAR(100), -- Small Forward player name
    pf VARCHAR(100), -- Power Forward player name
    c VARCHAR(100)   -- Center player name
);

-- Coach table - Coach profiles linked to users
CREATE TABLE IF NOT EXISTS coach (
    coach_name VARCHAR(100) PRIMARY KEY DEFAULT 'John Doe',
    users_id UUID REFERENCES users(id),
    good_emotion INTEGER DEFAULT 0,
    bad_emotion INTEGER DEFAULT 0
);

-- League Schedule table - Game schedules for each league
CREATE TABLE IF NOT EXISTS league_schedule (
    schedule_id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES user_league(league_id),
    home_team_id BIGINT REFERENCES basketball_team(team_id),
    away_team_id BIGINT REFERENCES basketball_team(team_id),
    game_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(20) DEFAULT 'SCHEDULED' -- SCHEDULED, COMPLETED
);

-- Game Schedule table (alternative/additional scheduling)
CREATE TABLE IF NOT EXISTS game_schedule (
    schedule_id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES user_league(league_id),
    home_team_id BIGINT REFERENCES basketball_team(team_id),
    away_team_id BIGINT REFERENCES basketball_team(team_id),
    game_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(20) DEFAULT 'SCHEDULED'
);

-- Team Templates table - Master data for team creation
CREATE TABLE IF NOT EXISTS team_template (
    template_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_logo VARCHAR(10) DEFAULT '🏀',
    team_color VARCHAR(50) DEFAULT 'from-blue-500 to-blue-600',
    is_user_team BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0
);

-- Player Templates table - Master data for player creation
CREATE TABLE IF NOT EXISTS player_template (
    template_id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    team_template_id INTEGER REFERENCES team_template(template_id),
    player_age INTEGER DEFAULT 25,
    player_rating INTEGER DEFAULT 80,
    player_height INTEGER DEFAULT 185,
    player_position VARCHAR(5) DEFAULT 'PG',
    player_tendencies VARCHAR(20) DEFAULT 'MIDRANGE',
    is_starter BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- DATA CLEANUP SECTION
-- Clean up existing data and reset sequences
-- ============================================================================

DELETE FROM squad WHERE team_id IN (SELECT team_id FROM basketball_team);
DELETE FROM player WHERE team_id IN (SELECT team_id FROM basketball_team);

-- 2. Delete from basketball_team
DELETE FROM basketball_team;

-- 3. Delete from user_league
DELETE FROM user_league;

-- 4. Reset sequences for clean start (PostgreSQL)
ALTER SEQUENCE basketball_team_team_id_seq RESTART WITH 1;
ALTER SEQUENCE user_league_league_id_seq RESTART WITH 1;
ALTER SEQUENCE player_player_id_seq RESTART WITH 1;

-- 5. (Optional) Vacuum to reclaim space
VACUUM FULL;


CREATE OR REPLACE FUNCTION cleanup_user_data(target_user_id UUID)
RETURNS TABLE(
    deleted_schedules INTEGER,
    deleted_players INTEGER,
    deleted_teams INTEGER,
    deleted_leagues INTEGER,
    deleted_coaches INTEGER
) AS $$
DECLARE
    user_league_id INTEGER;
    schedule_count INTEGER := 0;
    player_count INTEGER := 0;
    team_count INTEGER := 0;
    league_count INTEGER := 0;
    coach_count INTEGER := 0;
BEGIN
    -- Get user's league ID
    SELECT get_user_league_id(target_user_id) INTO user_league_id;
    
    IF user_league_id IS NOT NULL THEN
        -- Delete schedules for this league
        DELETE FROM league_schedule WHERE league_id = user_league_id;
        GET DIAGNOSTICS schedule_count = ROW_COUNT;
        
        -- Delete players for teams in this league
        DELETE FROM player WHERE team_id IN (
            SELECT team_id FROM basketball_team WHERE league_id = user_league_id
        );
        GET DIAGNOSTICS player_count = ROW_COUNT;
        
        -- Delete teams in this league
        DELETE FROM basketball_team WHERE league_id = user_league_id;
        GET DIAGNOSTICS team_count = ROW_COUNT;
        
        -- Delete the league itself
        DELETE FROM user_league WHERE league_id = user_league_id;
        GET DIAGNOSTICS league_count = ROW_COUNT;
    END IF;
    
    -- Delete coach record for this user
    DELETE FROM coach WHERE users_id = target_user_id;
    GET DIAGNOSTICS coach_count = ROW_COUNT;
    
    RETURN QUERY SELECT schedule_count, player_count, team_count, league_count, coach_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up all test users (usernames starting with 'test')
CREATE OR REPLACE FUNCTION cleanup_all_test_users()
RETURNS TABLE(
    cleaned_users INTEGER,
    total_schedules INTEGER,
    total_players INTEGER,
    total_teams INTEGER,
    total_leagues INTEGER,
    total_coaches INTEGER
) AS $$
DECLARE
    test_user RECORD;
    cleanup_result RECORD;
    user_count INTEGER := 0;
    total_schedule_count INTEGER := 0;
    total_player_count INTEGER := 0;
    total_team_count INTEGER := 0;
    total_league_count INTEGER := 0;
    total_coach_count INTEGER := 0;
BEGIN
    -- Loop through all test users
    FOR test_user IN 
        SELECT id FROM users WHERE username LIKE 'test%'
    LOOP
        -- Clean up each test user's data
        SELECT * FROM cleanup_user_data(test_user.id) INTO cleanup_result;
        
        -- Accumulate totals
        total_schedule_count := total_schedule_count + cleanup_result.deleted_schedules;
        total_player_count := total_player_count + cleanup_result.deleted_players;
        total_team_count := total_team_count + cleanup_result.deleted_teams;
        total_league_count := total_league_count + cleanup_result.deleted_leagues;
        total_coach_count := total_coach_count + cleanup_result.deleted_coaches;
        
        user_count := user_count + 1;
    END LOOP;
    
    -- Delete the test users themselves
    DELETE FROM users WHERE username LIKE 'test%';
    
    RETURN QUERY SELECT user_count, total_schedule_count, total_player_count, total_team_count, total_league_count, total_coach_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user data summary
CREATE OR REPLACE FUNCTION get_user_data_summary(target_user_id UUID)
RETURNS TABLE(
    username TEXT,
    league_id INTEGER,
    team_count INTEGER,
    player_count INTEGER,
    schedule_count INTEGER
) AS $$
DECLARE
    user_league_id INTEGER;
BEGIN
    -- Get user's league ID
    SELECT get_user_league_id(target_user_id) INTO user_league_id;
    
    RETURN QUERY
    SELECT 
        u.username::TEXT,
        user_league_id,
        COALESCE((SELECT COUNT(*)::INTEGER FROM basketball_team WHERE league_id = user_league_id), 0),
        COALESCE((SELECT COUNT(*)::INTEGER FROM player WHERE team_id IN (
            SELECT team_id FROM basketball_team WHERE league_id = user_league_id
        )), 0),
        COALESCE((SELECT COUNT(*)::INTEGER FROM league_schedule WHERE league_id = user_league_id), 0)
    FROM users u 
    WHERE u.id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- View to see all users and their data
CREATE OR REPLACE VIEW user_data_overview AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.age,
    COALESCE(get_user_league_id(u.id), 0) as league_id,
    COALESCE((
        SELECT COUNT(*) 
        FROM basketball_team bt 
        WHERE bt.league_id = get_user_league_id(u.id)
    ), 0) as team_count,
    COALESCE((
        SELECT COUNT(*) 
        FROM player p 
        JOIN basketball_team bt ON p.team_id = bt.team_id 
        WHERE bt.league_id = get_user_league_id(u.id)
    ), 0) as player_count,
    COALESCE((
        SELECT COUNT(*) 
        FROM league_schedule ls 
        WHERE ls.league_id = get_user_league_id(u.id)
    ), 0) as schedule_count
FROM users u
ORDER BY u.username;

CREATE OR REPLACE FUNCTION create_complete_user_league(user_uuid UUID)
RETURNS TABLE(league_id INTEGER, teams_created INTEGER, players_created INTEGER) AS $$
DECLARE
    new_league_id INTEGER;
    team_count INTEGER := 0;
    player_count INTEGER := 0;
    user_suffix VARCHAR(8);
    
    -- Team IDs for the 6 teams
    imagine_team_id BIGINT;
    eagles_team_id BIGINT;
    storm_team_id BIGINT;
    dragons_team_id BIGINT;
    wolverines_team_id BIGINT;
    tigers_team_id BIGINT;
BEGIN
    -- Check if user already has an active league
    SELECT ul.league_id INTO new_league_id 
    FROM user_league ul 
    WHERE ul.user_id = user_uuid AND ul.status = 'ACTIVE';
    
    IF new_league_id IS NOT NULL THEN
        -- User already has a league, return existing data
        SELECT 
            new_league_id,
            (SELECT COUNT(*)::INTEGER FROM basketball_team WHERE league_id = new_league_id),
            (SELECT COUNT(*)::INTEGER FROM player WHERE team_id IN (
                SELECT team_id FROM basketball_team WHERE league_id = new_league_id
            ));
        RETURN;
    END IF;

    -- Create user-specific suffix from first 8 characters of UUID
    user_suffix := SUBSTRING(REPLACE(user_uuid::text, '-', ''), 1, 8);
    
    -- Create new league for this user
    INSERT INTO user_league (user_id, status) 
    VALUES (user_uuid, 'ACTIVE') 
    RETURNING user_league.league_id INTO new_league_id;
    
    -- Create the 6 teams for this user's league
    
    -- Team 1: Imagine (User's main team)
    INSERT INTO basketball_team (team_name, wins, lose, users_id, league_id, is_user_team)
    VALUES ('Imagine', 0, 0, user_uuid, new_league_id, TRUE)
    RETURNING team_id INTO imagine_team_id;
    team_count := team_count + 1;
    
    -- Team 2: Riverlake Eagles (Bot team)
    INSERT INTO basketball_team (team_name, wins, lose, users_id, league_id, is_user_team)
    VALUES ('Riverlake Eagles', 0, 0, NULL, new_league_id, FALSE)
    RETURNING team_id INTO eagles_team_id;
    team_count := team_count + 1;
    
    -- Team 3: Storm Breakers (Bot team)
    INSERT INTO basketball_team (team_name, wins, lose, users_id, league_id, is_user_team)
    VALUES ('Storm Breakers', 0, 0, NULL, new_league_id, FALSE)
    RETURNING team_id INTO storm_team_id;
    team_count := team_count + 1;
    
    -- Team 4: Red Dragons (Bot team)
    INSERT INTO basketball_team (team_name, wins, lose, users_id, league_id, is_user_team)
    VALUES ('Red Dragons', 0, 0, NULL, new_league_id, FALSE)
    RETURNING team_id INTO dragons_team_id;
    team_count := team_count + 1;
    
    -- Team 5: Wolverines (Bot team)
    INSERT INTO basketball_team (team_name, wins, lose, users_id, league_id, is_user_team)
    VALUES ('Wolverines', 0, 0, NULL, new_league_id, FALSE)
    RETURNING team_id INTO wolverines_team_id;
    team_count := team_count + 1;
    
    -- Team 6: Golden Tigers (Bot team)
    INSERT INTO basketball_team (team_name, wins, lose, users_id, league_id, is_user_team)
    VALUES ('Golden Tigers', 0, 0, NULL, new_league_id, FALSE)
    RETURNING team_id INTO tigers_team_id;
    team_count := team_count + 1;
    
    -- ============================================================================
    -- Create players for each team with unique names using user suffix
    -- ============================================================================
    
    -- Players for Imagine team (User's team) - use suffix for uniqueness
    INSERT INTO player (player_name, team_id, player_age, player_rating, player_height, player_position, player_tendencies) VALUES
    (CONCAT('Alex Johnson ', user_suffix), imagine_team_id, 24, 85, 188, 'PG', 'THREE_POINT'),
    (CONCAT('Mike Davis ', user_suffix), imagine_team_id, 26, 82, 191, 'PG', 'MIDRANGE'),
    (CONCAT('Chris Wilson ', user_suffix), imagine_team_id, 23, 87, 196, 'SG', 'THREE_POINT'),
    (CONCAT('Danny Brown ', user_suffix), imagine_team_id, 25, 84, 198, 'SG', 'MIDRANGE'),
    (CONCAT('James Taylor ', user_suffix), imagine_team_id, 27, 89, 203, 'SF', 'MIDRANGE'),
    (CONCAT('Kevin White ', user_suffix), imagine_team_id, 24, 86, 205, 'SF', 'THREE_POINT'),
    (CONCAT('Robert Green ', user_suffix), imagine_team_id, 28, 90, 208, 'PF', 'POST'),
    (CONCAT('Marcus Lee ', user_suffix), imagine_team_id, 26, 87, 206, 'PF', 'MIDRANGE'),
    (CONCAT('David Miller ', user_suffix), imagine_team_id, 29, 92, 213, 'C', 'POST'),
    (CONCAT('Andrew Clark ', user_suffix), imagine_team_id, 27, 88, 211, 'C', 'POST');
    player_count := player_count + 10;
    
    -- Players for Riverlake Eagles
    INSERT INTO player (player_name, team_id, player_age, player_rating, player_height, player_position, player_tendencies) VALUES
    (CONCAT('Steve Nash Jr ', user_suffix), eagles_team_id, 26, 89, 185, 'PG', 'THREE_POINT'),
    (CONCAT('Tony Parker Jr ', user_suffix), eagles_team_id, 28, 86, 183, 'PG', 'MIDRANGE'),
    (CONCAT('Kobe Bryant Jr ', user_suffix), eagles_team_id, 25, 91, 198, 'SG', 'MIDRANGE'),
    (CONCAT('Ray Allen Jr ', user_suffix), eagles_team_id, 27, 88, 196, 'SG', 'THREE_POINT'),
    (CONCAT('LeBron James Jr ', user_suffix), eagles_team_id, 26, 93, 203, 'SF', 'MIDRANGE'),
    (CONCAT('Kevin Durant Jr ', user_suffix), eagles_team_id, 28, 90, 211, 'SF', 'THREE_POINT'),
    (CONCAT('Tim Duncan Jr ', user_suffix), eagles_team_id, 30, 89, 213, 'PF', 'POST'),
    (CONCAT('Dirk Nowitzki Jr ', user_suffix), eagles_team_id, 29, 87, 213, 'PF', 'MIDRANGE'),
    (CONCAT('Shaq O Neal Jr ', user_suffix), eagles_team_id, 31, 94, 216, 'C', 'POST'),
    (CONCAT('Dwight Howard Jr ', user_suffix), eagles_team_id, 28, 88, 211, 'C', 'POST');
    player_count := player_count + 10;
    
    -- Players for Storm Breakers
    INSERT INTO player (player_name, team_id, player_age, player_rating, player_height, player_position, player_tendencies) VALUES
    (CONCAT('Russell Westbrook Jr ', user_suffix), storm_team_id, 25, 90, 191, 'PG', 'MIDRANGE'),
    (CONCAT('Chris Paul Jr ', user_suffix), storm_team_id, 29, 88, 183, 'PG', 'THREE_POINT'),
    (CONCAT('James Harden Jr ', user_suffix), storm_team_id, 27, 91, 196, 'SG', 'THREE_POINT'),
    (CONCAT('Dwyane Wade Jr ', user_suffix), storm_team_id, 30, 87, 193, 'SG', 'MIDRANGE'),
    (CONCAT('Paul George Jr ', user_suffix), storm_team_id, 26, 89, 206, 'SF', 'THREE_POINT'),
    (CONCAT('Kawhi Leonard Jr ', user_suffix), storm_team_id, 28, 92, 201, 'SF', 'MIDRANGE'),
    (CONCAT('Blake Griffin Jr ', user_suffix), storm_team_id, 27, 88, 208, 'PF', 'POST'),
    (CONCAT('Lamarcus Aldridge Jr ', user_suffix), storm_team_id, 29, 86, 211, 'PF', 'MIDRANGE'),
    (CONCAT('DeAndre Jordan Jr ', user_suffix), storm_team_id, 30, 87, 213, 'C', 'POST'),
    (CONCAT('Andre Drummond Jr ', user_suffix), storm_team_id, 27, 85, 211, 'C', 'POST');
    player_count := player_count + 10;
    
    -- Players for Red Dragons
    INSERT INTO player (player_name, team_id, player_age, player_rating, player_height, player_position, player_tendencies) VALUES
    (CONCAT('Damian Lillard Jr ', user_suffix), dragons_team_id, 26, 91, 188, 'PG', 'THREE_POINT'),
    (CONCAT('Kyrie Irving Jr ', user_suffix), dragons_team_id, 27, 89, 191, 'PG', 'MIDRANGE'),
    (CONCAT('Devin Booker Jr ', user_suffix), dragons_team_id, 24, 88, 198, 'SG', 'THREE_POINT'),
    (CONCAT('CJ McCollum Jr ', user_suffix), dragons_team_id, 28, 86, 193, 'SG', 'MIDRANGE'),
    (CONCAT('Jayson Tatum Jr ', user_suffix), dragons_team_id, 23, 90, 203, 'SF', 'THREE_POINT'),
    (CONCAT('Jimmy Butler Jr ', user_suffix), dragons_team_id, 30, 89, 201, 'SF', 'MIDRANGE'),
    (CONCAT('Zion Williamson Jr ', user_suffix), dragons_team_id, 21, 87, 201, 'PF', 'POST'),
    (CONCAT('Julius Randle Jr ', user_suffix), dragons_team_id, 26, 85, 206, 'PF', 'MIDRANGE'),
    (CONCAT('Bam Adebayo Jr ', user_suffix), dragons_team_id, 24, 88, 206, 'C', 'POST'),
    (CONCAT('Clint Capela Jr ', user_suffix), dragons_team_id, 27, 84, 208, 'C', 'POST');
    player_count := player_count + 10;
    
    -- Players for Wolverines
    INSERT INTO player (player_name, team_id, player_age, player_rating, player_height, player_position, player_tendencies) VALUES
    (CONCAT('Trae Young Jr ', user_suffix), wolverines_team_id, 22, 89, 183, 'PG', 'THREE_POINT'),
    (CONCAT('Ja Morant Jr ', user_suffix), wolverines_team_id, 21, 87, 191, 'PG', 'MIDRANGE'),
    (CONCAT('Donovan Mitchell Jr ', user_suffix), wolverines_team_id, 25, 88, 185, 'SG', 'THREE_POINT'),
    (CONCAT('Zach LaVine Jr ', user_suffix), wolverines_team_id, 26, 86, 196, 'SG', 'MIDRANGE'),
    (CONCAT('Jaylen Brown Jr ', user_suffix), wolverines_team_id, 25, 89, 198, 'SF', 'MIDRANGE'),
    (CONCAT('Brandon Ingram Jr ', user_suffix), wolverines_team_id, 24, 87, 203, 'SF', 'THREE_POINT'),
    (CONCAT('John Collins Jr ', user_suffix), wolverines_team_id, 24, 85, 206, 'PF', 'POST'),
    (CONCAT('Tobias Harris Jr ', user_suffix), wolverines_team_id, 29, 84, 203, 'PF', 'MIDRANGE'),
    (CONCAT('Myles Turner Jr ', user_suffix), wolverines_team_id, 25, 86, 211, 'C', 'POST'),
    (CONCAT('Jonas Valanciunas Jr ', user_suffix), wolverines_team_id, 29, 83, 213, 'C', 'POST');
    player_count := player_count + 10;
    
    -- Players for Golden Tigers
    INSERT INTO player (player_name, team_id, player_age, player_rating, player_height, player_position, player_tendencies) VALUES
    (CONCAT('De Aaron Fox Jr ', user_suffix), tigers_team_id, 23, 88, 191, 'PG', 'MIDRANGE'),
    (CONCAT('Tyler Herro Jr ', user_suffix), tigers_team_id, 22, 85, 196, 'PG', 'THREE_POINT'),
    (CONCAT('Anthony Edwards Jr ', user_suffix), tigers_team_id, 20, 86, 193, 'SG', 'THREE_POINT'),
    (CONCAT('Malik Beasley Jr ', user_suffix), tigers_team_id, 25, 83, 196, 'SG', 'MIDRANGE'),
    (CONCAT('RJ Barrett Jr ', user_suffix), tigers_team_id, 21, 84, 201, 'SF', 'MIDRANGE'),
    (CONCAT('Mikal Bridges Jr ', user_suffix), tigers_team_id, 25, 87, 198, 'SF', 'THREE_POINT'),
    (CONCAT('Jaren Jackson Jr Jr ', user_suffix), tigers_team_id, 22, 85, 211, 'PF', 'POST'),
    (CONCAT('Lauri Markkanen Jr ', user_suffix), tigers_team_id, 24, 84, 213, 'PF', 'MIDRANGE'),
    (CONCAT('Wendell Carter Jr Jr ', user_suffix), tigers_team_id, 22, 82, 208, 'C', 'POST'),
    (CONCAT('Mitchell Robinson Jr ', user_suffix), tigers_team_id, 23, 81, 213, 'C', 'POST');
    player_count := player_count + 10;
    
    RETURN QUERY SELECT new_league_id, team_count, player_count;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS user_league (
    league_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    league_name VARCHAR(100) DEFAULT 'Basketball League',
    season_number INTEGER DEFAULT 1,
    current_round INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, season_number)
);

-- Ensure basketball_team has required columns
ALTER TABLE basketball_team 
ADD COLUMN IF NOT EXISTS league_id INTEGER REFERENCES user_league(league_id),
ADD COLUMN IF NOT EXISTS is_user_team BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION simulate_league_games(user_league_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    bot_teams BIGINT[];
    team_1 BIGINT;
    team_2 BIGINT;
    i INTEGER;
    j INTEGER;
    result_text TEXT := '';
    sim_result RECORD;
BEGIN

    SELECT ARRAY(
        SELECT team_id 
        FROM basketball_team 
        WHERE league_id = user_league_id AND is_user_team = FALSE
    ) INTO bot_teams;
    
    FOR i IN 1..array_length(bot_teams, 1) LOOP
        FOR j IN (i+1)..array_length(bot_teams, 1) LOOP
            team_1 := bot_teams[i];
            team_2 := bot_teams[j];

            SELECT * FROM simulate_single_game(team_1, team_2) INTO sim_result;

            IF sim_result.winner_team_id = team_1 THEN
                UPDATE basketball_team SET wins = wins + 1 WHERE team_id = team_1;
                UPDATE basketball_team SET lose = lose + 1 WHERE team_id = team_2;
            ELSE
                UPDATE basketball_team SET wins = wins + 1 WHERE team_id = team_2;
                UPDATE basketball_team SET lose = lose + 1 WHERE team_id = team_1;
            END IF;
            
            result_text := result_text || 'Game simulated between teams ' || team_1 || ' and ' || team_2 || '. ';
        END LOOP;
    END LOOP;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION simulate_single_game(home_team_id BIGINT, away_team_id BIGINT)
RETURNS TABLE(winner_team_id BIGINT, home_score INTEGER, away_score INTEGER) AS $$
DECLARE
    home_rating NUMERIC;
    away_rating NUMERIC;
    home_final_score INTEGER;
    away_final_score INTEGER;
    winner_id BIGINT;
BEGIN
    -- Get team ratings based on average player rating
    SELECT AVG(player_rating) INTO home_rating
    FROM player
    WHERE team_id = home_team_id;
    
    SELECT AVG(player_rating) INTO away_rating
    FROM player
    WHERE team_id = away_team_id;
    
    -- Simple simulation logic
    home_final_score := 80 + ROUND(RANDOM() * 40) + (home_rating - 80);
    away_final_score := 80 + ROUND(RANDOM() * 40) + (away_rating - 80);
    
    -- Determine winner
    IF home_final_score > away_final_score THEN
        winner_id := home_team_id;
    ELSE
        winner_id := away_team_id;
    END IF;
    
    RETURN QUERY SELECT winner_id, home_final_score, away_final_score;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_user_league_id(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    league_id_result INTEGER;
BEGIN
    SELECT league_id INTO league_id_result
    FROM user_league
    WHERE user_id = user_uuid AND status = 'ACTIVE'
    LIMIT 1;
    
    RETURN league_id_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 5: FIX PLAYER UNIQUE CONSTRAINT
-- Source: fix_player_unique_constraint.sql
-- ============================================================================

ALTER TABLE player DROP CONSTRAINT IF EXISTS player_pkey;
ALTER TABLE player DROP CONSTRAINT IF EXISTS player_player_name_key;


-- First, add an auto-generated ID as primary key
ALTER TABLE player ADD COLUMN IF NOT EXISTS player_id SERIAL;
ALTER TABLE player ADD CONSTRAINT player_pkey PRIMARY KEY (player_id);

-- Make player_name + team_id combination unique instead of just player_name
ALTER TABLE player ADD CONSTRAINT player_name_team_unique UNIQUE (player_name, team_id);

-- ============================================================================
-- SECTION 6: SETUP 6 TEAMS PER USER SYSTEM
-- Source: setup_6_teams_per_user_fixed.sql
-- ============================================================================

-- Create team_template table for team master data
CREATE TABLE IF NOT EXISTS team_template (
    template_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_logo VARCHAR(10) DEFAULT '🏀',
    team_color VARCHAR(50) DEFAULT 'from-blue-500 to-blue-600',
    is_user_team BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0
);

-- Insert team templates
INSERT INTO team_template (team_name, team_logo, team_color, is_user_team, display_order) VALUES
('Imagine', '💫', 'from-purple-500 to-indigo-600', TRUE, 1),
('Riverlake Eagles', '🦅', 'from-yellow-500 to-orange-600', FALSE, 2),
('Storm Breakers', '⚡', 'from-blue-500 to-cyan-600', FALSE, 3),
('Red Dragons', '🐉', 'from-red-500 to-rose-600', FALSE, 4),
('Wolverines', '🐺', 'from-gray-500 to-slate-600', FALSE, 5),
('Golden Tigers', '🐅', 'from-orange-500 to-yellow-600', FALSE, 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 2: Create Player Templates (Master Data)
-- ============================================================================

-- Create player_template table for player master data
CREATE TABLE IF NOT EXISTS player_template (
    template_id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    team_template_id INTEGER REFERENCES team_template(template_id),
    player_age INTEGER DEFAULT 25,
    player_rating INTEGER DEFAULT 80,
    player_height INTEGER DEFAULT 185,
    player_position VARCHAR(5) DEFAULT 'PG',
    player_tendencies VARCHAR(20) DEFAULT 'MIDRANGE',
    is_starter BOOLEAN DEFAULT FALSE
);

-- Insert player templates for each team
-- Imagine Team Players (User's team)
INSERT INTO player_template (player_name, team_template_id, player_age, player_rating, player_height, player_position, player_tendencies, is_starter) VALUES
-- Starters
('Alex Johnson', 1, 24, 85, 188, 'PG', 'THREE_POINT', TRUE),
('Marcus Thompson', 1, 26, 82, 195, 'SG', 'MIDRANGE', TRUE),
('DeAndre Williams', 1, 25, 88, 203, 'SF', 'MIDRANGE', TRUE),
('Jayson Davis', 1, 27, 84, 206, 'PF', 'POST', TRUE),
('Dwight Robinson', 1, 29, 87, 211, 'C', 'POST', TRUE),
-- Bench
('Tyler Brown', 1, 22, 78, 185, 'PG', 'MIDRANGE', FALSE),
('Kevin Wilson', 1, 24, 80, 193, 'SG', 'THREE_POINT', FALSE),
('Chris Anderson', 1, 26, 79, 201, 'SF', 'THREE_POINT', FALSE),
('Brandon Miller', 1, 25, 81, 208, 'PF', 'MIDRANGE', FALSE),
('Hassan Jackson', 1, 28, 83, 213, 'C', 'POST', FALSE);

-- Riverlake Eagles Players
INSERT INTO player_template (player_name, team_template_id, player_age, player_rating, player_height, player_position, player_tendencies, is_starter) VALUES
-- Starters
('John Stevens', 2, 25, 86, 190, 'PG', 'THREE_POINT', TRUE),
('Mike Richardson', 2, 27, 84, 196, 'SG', 'MIDRANGE', TRUE),
('Robert Clark', 2, 26, 89, 205, 'SF', 'MIDRANGE', TRUE),
('David Martinez', 2, 28, 85, 208, 'PF', 'POST', TRUE),
('Andrew Walker', 2, 30, 88, 213, 'C', 'POST', TRUE),
-- Bench
('Tony Garcia', 2, 23, 79, 188, 'PG', 'MIDRANGE', FALSE),
('Luis Rodriguez', 2, 25, 81, 194, 'SG', 'THREE_POINT', FALSE),
('Carlos Lopez', 2, 27, 80, 203, 'SF', 'THREE_POINT', FALSE),
('Jose Gonzalez', 2, 26, 82, 206, 'PF', 'MIDRANGE', FALSE),
('Pedro Hernandez', 2, 29, 84, 211, 'C', 'POST', FALSE);

-- Storm Breakers Players
INSERT INTO player_template (player_name, team_template_id, player_age, player_rating, player_height, player_position, player_tendencies, is_starter) VALUES
-- Starters
('James Wilson', 3, 24, 87, 185, 'PG', 'THREE_POINT', TRUE),
('William Jones', 3, 26, 85, 198, 'SG', 'MIDRANGE', TRUE),
('Richard Taylor', 3, 25, 90, 203, 'SF', 'MIDRANGE', TRUE),
('Thomas Moore', 3, 27, 86, 208, 'PF', 'POST', TRUE),
('Charles White', 3, 29, 89, 213, 'C', 'POST', TRUE),
-- Bench
('Daniel Harris', 3, 22, 80, 188, 'PG', 'MIDRANGE', FALSE),
('Matthew Lewis', 3, 24, 82, 196, 'SG', 'THREE_POINT', FALSE),
('Anthony King', 3, 26, 81, 201, 'SF', 'THREE_POINT', FALSE),
('Mark Wright', 3, 25, 83, 206, 'PF', 'MIDRANGE', FALSE),
('Steven Hill', 3, 28, 85, 211, 'C', 'POST', FALSE);

-- Red Dragons Players
INSERT INTO player_template (player_name, team_template_id, player_age, player_rating, player_height, player_position, player_tendencies, is_starter) VALUES
-- Starters
('Paul Scott', 4, 25, 88, 190, 'PG', 'THREE_POINT', TRUE),
('Joshua Green', 4, 27, 86, 195, 'SG', 'MIDRANGE', TRUE),
('Christopher Adams', 4, 26, 91, 205, 'SF', 'MIDRANGE', TRUE),
('Matthew Baker', 4, 28, 87, 208, 'PF', 'POST', TRUE),
('Ryan Nelson', 4, 30, 90, 213, 'C', 'POST', TRUE),
-- Bench
('Kevin Carter', 4, 23, 81, 185, 'PG', 'MIDRANGE', FALSE),
('Brian Mitchell', 4, 25, 83, 198, 'SG', 'THREE_POINT', FALSE),
('Gary Perez', 4, 27, 82, 203, 'SF', 'THREE_POINT', FALSE),
('Ronald Roberts', 4, 26, 84, 206, 'PF', 'MIDRANGE', FALSE),
('Jason Turner', 4, 29, 86, 211, 'C', 'POST', FALSE);

-- Wolverines Players
INSERT INTO player_template (player_name, team_template_id, player_age, player_rating, player_height, player_position, player_tendencies, is_starter) VALUES
-- Starters
('Frank Phillips', 5, 24, 89, 188, 'PG', 'THREE_POINT', TRUE),
('George Campbell', 5, 26, 87, 196, 'SG', 'MIDRANGE', TRUE),
('Henry Parker', 5, 25, 92, 203, 'SF', 'MIDRANGE', TRUE),
('Harold Evans', 5, 27, 88, 208, 'PF', 'POST', TRUE),
('Ralph Edwards', 5, 29, 91, 213, 'C', 'POST', TRUE),
-- Bench
('Lawrence Collins', 5, 22, 82, 190, 'PG', 'MIDRANGE', FALSE),
('Walter Stewart', 5, 24, 84, 194, 'SG', 'THREE_POINT', FALSE),
('Arthur Sanchez', 5, 26, 83, 201, 'SF', 'THREE_POINT', FALSE),
('Roy Morris', 5, 25, 85, 206, 'PF', 'MIDRANGE', FALSE),
('Earl Rogers', 5, 28, 87, 211, 'C', 'POST', FALSE);

-- Golden Tigers Players (New 6th team)
INSERT INTO player_template (player_name, team_template_id, player_age, player_rating, player_height, player_position, player_tendencies, is_starter) VALUES
-- Starters
('Marcus Williams', 6, 25, 88, 185, 'PG', 'THREE_POINT', TRUE),
('Tyler Johnson', 6, 27, 86, 196, 'SG', 'MIDRANGE', TRUE),
('Brandon Lee', 6, 26, 90, 203, 'SF', 'MIDRANGE', TRUE),
('Chris Thompson', 6, 28, 87, 208, 'PF', 'POST', TRUE),
('Andre Davis', 6, 30, 89, 213, 'C', 'POST', TRUE),
-- Bench
('Jordan Smith', 6, 23, 81, 188, 'PG', 'MIDRANGE', FALSE),
('Cameron White', 6, 25, 83, 194, 'SG', 'THREE_POINT', FALSE),
('Terrell Jones', 6, 27, 82, 201, 'SF', 'THREE_POINT', FALSE),
('Malik Brown', 6, 26, 84, 206, 'PF', 'MIDRANGE', FALSE),
('Isaiah Wilson', 6, 29, 86, 211, 'C', 'POST', FALSE);

-- ============================================================================
-- SECTION 7: TEST USER DEBUG QUERIES
-- Source: test-user-debug.sql
-- ============================================================================


CREATE OR REPLACE FUNCTION debug_user_data(user_uuid UUID)
RETURNS TABLE(
    info_type TEXT,
    data_value TEXT
) AS $$
BEGIN
    -- Check if user exists
    RETURN QUERY
    SELECT 'User Info'::TEXT, 
           CONCAT('ID: ', id, ', Username: ', username, ', Email: ', email)::TEXT
    FROM users 
    WHERE id = user_uuid;

    -- Check user leagues
    RETURN QUERY
    SELECT 'League Info'::TEXT,
           CONCAT('League ID: ', league_id, ', Status: ', status, ', Created: ', created_at)::TEXT
    FROM user_league 
    WHERE user_id = user_uuid
    ORDER BY created_at DESC;

    -- Check teams for this user
    RETURN QUERY
    SELECT 'Team Info'::TEXT,
           CONCAT('Team: ', team_name, ', Wins: ', wins, ', Losses: ', lose, ', User Team: ', is_user_team)::TEXT
    FROM basketball_team 
    WHERE league_id = get_user_league_id(user_uuid)
    ORDER BY is_user_team DESC, team_name;

    -- Check player count
    RETURN QUERY
    SELECT 'Player Count'::TEXT,
           CONCAT('Total Players: ', COUNT(*))::TEXT
    FROM player p
    JOIN basketball_team bt ON p.team_id = bt.team_id
    WHERE bt.league_id = get_user_league_id(user_uuid);
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECTION 8: ADDITIONAL DEBUG QUERIES AND TEST SCRIPTS
-- Consolidated from remaining demo folder SQL files
-- ============================================================================

-- Quick debug queries for specific user (example with Arsen's UUID)
-- Usage: Replace UUID with actual user ID to debug specific user
/*
-- Check if user exists
SELECT 'User Data:' as info;
SELECT id, username, email, age, is_assistant 
FROM users 
WHERE id = '0d198788-e450-4ee9-ae64-82ea94f87353';

-- Check user leagues
SELECT 'User Leagues:' as info;
SELECT league_id, user_id, league_name, season_number, status, created_at
FROM user_league 
WHERE user_id = '0d198788-e450-4ee9-ae64-82ea94f87353'
ORDER BY created_at DESC;

-- Check teams for this user
SELECT 'User Teams:' as info;
SELECT team_id, team_name, wins, lose, league_id, users_id, is_user_team
FROM basketball_team 
WHERE users_id = '0d198788-e450-4ee9-ae64-82ea94f87353'
ORDER BY league_id, team_name;

-- Test get_user_league_id function
SELECT 'Testing get_user_league_id function:' as info;
SELECT get_user_league_id('0d198788-e450-4ee9-ae64-82ea94f87353') as league_id;

-- Check all leagues (for comparison)
SELECT 'All Leagues:' as info;
SELECT league_id, user_id, status, created_at
FROM user_league
ORDER BY created_at DESC
LIMIT 10;

-- Count teams per league
SELECT 'Teams count per league:' as info;
SELECT league_id, COUNT(*) as team_count
FROM basketball_team
WHERE league_id IS NOT NULL
GROUP BY league_id
ORDER BY league_id;
*/

-- ============================================================================
-- FINAL SETUP VERIFICATION
-- ============================================================================

-- Insert master data templates on conflict do nothing
INSERT INTO team_template (team_name, team_logo, team_color, is_user_team, display_order) VALUES
('Imagine', '💫', 'from-purple-500 to-indigo-600', TRUE, 1),
('Riverlake Eagles', '🦅', 'from-yellow-500 to-orange-600', FALSE, 2),
('Storm Breakers', '⚡', 'from-blue-500 to-cyan-600', FALSE, 3),
('Red Dragons', '🐉', 'from-red-500 to-rose-600', FALSE, 4),
('Wolverines', '🐺', 'from-gray-500 to-slate-600', FALSE, 5),
('Golden Tigers', '🐅', 'from-orange-500 to-yellow-600', FALSE, 6)
ON CONFLICT (team_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_league_user_id ON user_league(user_id);
CREATE INDEX IF NOT EXISTS idx_basketball_team_league_id ON basketball_team(league_id);
CREATE INDEX IF NOT EXISTS idx_basketball_team_users_id ON basketball_team(users_id);
CREATE INDEX IF NOT EXISTS idx_player_team_id ON player(team_id);
CREATE INDEX IF NOT EXISTS idx_squad_team_id ON squad(team_id);
CREATE INDEX IF NOT EXISTS idx_league_schedule_league_id ON league_schedule(league_id);

-- Add helpful utility function for league standings
CREATE OR REPLACE VIEW league_standings_view AS
SELECT 
    bt.team_id,
    bt.team_name,
    bt.wins,
    bt.lose,
    bt.league_id,
    bt.users_id,
    bt.is_user_team,
    CASE 
        WHEN (bt.wins + bt.lose) = 0 THEN 0.0
        ELSE ROUND((bt.wins::DECIMAL / (bt.wins + bt.lose)) * 100, 1)
    END as win_percentage,
    (bt.wins + bt.lose) as games_played,
    CASE 
        WHEN bt.is_user_team THEN 'USER_TEAM'
        ELSE 'BOT_TEAM'
    END as team_type,
    ul.season_number,
    ul.current_round
FROM basketball_team bt
JOIN user_league ul ON bt.league_id = ul.league_id
ORDER BY bt.league_id, bt.wins DESC, bt.lose ASC;

-- ============================================================================
-- USAGE INSTRUCTIONS AND COMPLETION STATUS
-- ============================================================================

/*
DATABASE SETUP COMPLETE!

This file consolidates all SQL scripts from the demo folder including:
1. Foundational table definitions (users, teams, players, etc.)
2. Data cleanup functions 
3. User league creation and management
4. Game simulation functions
5. Player constraint fixes
6. Template system for teams and players
7. Debug and testing utilities

MAIN FUNCTIONS AVAILABLE:
- create_complete_user_league(user_uuid) - Creates isolated league for user
- simulate_league_games(league_id) - Simulates bot vs bot games
- cleanup_user_data(user_uuid) - Removes all data for a user
- debug_user_data(user_uuid) - Debug information for a user
- get_user_league_id(user_uuid) - Gets user's active league ID

VIEWS AVAILABLE:
- user_data_overview - Summary of all users and their data
- league_standings_view - Team standings within leagues

For new user registration:
1. User account is created in users table
2. Call create_complete_user_league(user_uuid) to set up their league
3. This creates 6 teams (1 user team + 5 bot teams) with full rosters
4. User can then play games and simulate league progression

All data is isolated per user - no shared state between users.
*/

SELECT 'Setup Complete!' as status;