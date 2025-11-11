CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Demographics
    age INTEGER,
    gender TEXT,
    education TEXT,
    occupation TEXT,
    income TEXT,
    country TEXT,
    ai_knowledge TEXT,

    -- Awareness & Perceptions (8)
    awareness1 INTEGER,
    awareness2 INTEGER,
    awareness3 INTEGER,
    awareness4 INTEGER,
    awareness5 INTEGER,
    awareness6 INTEGER,
    awareness7 INTEGER,
    awareness8 INTEGER,

    -- Preferences & Attitudes (8)
    preference1 INTEGER,
    preference2 INTEGER,
    preference3 INTEGER,
    preference4 INTEGER,
    preference5 INTEGER,
    preference6 INTEGER,
    preference7 INTEGER,
    preference8 INTEGER,

    -- Willingness to Pay (8)
    wtp1 INTEGER,
    wtp2 INTEGER,
    wtp3 INTEGER,
    wtp4 INTEGER,
    wtp5 INTEGER,
    wtp6 INTEGER,
    wtp7 INTEGER,
    wtp8 INTEGER,

    ai_mug_price REAL,
    human_mug_price REAL,

    -- Comparative Analysis (8)
    comparative1 INTEGER,
    comparative2 INTEGER,
    comparative3 INTEGER,
    comparative4 INTEGER,
    comparative5 INTEGER,
    comparative6 INTEGER,
    comparative7 INTEGER,
    comparative8 INTEGER
);
