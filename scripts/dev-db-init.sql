-- Runs once when the local database container is first created (docker-compose.yml).
-- vault_test is for npm run test:db; Prisma also needs a scratch database for migrate dev.
CREATE DATABASE IF NOT EXISTS vault_test;
GRANT ALL PRIVILEGES ON *.* TO 'vault'@'%';
