UPDATE roles SET name = 'access_administrator' WHERE name = 'admin';

-- Add comment for documentation
COMMENT ON TABLE roles IS 'User roles with access_administrator having highest privileges';
