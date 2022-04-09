DROP TABLE IF EXISTS users;

CREATE TABLE users 
(
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    easy_highscore INT,
    hard_highscore INT
);