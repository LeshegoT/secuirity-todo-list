INSERT INTO todo_statuses (name)
VALUES
    ('Todo'),
    ('In Progress'),
    ('Completed'),
ON CONFLICT (name) DO NOTHING;

INSERT INTO todo_priorities (name)
VALUES
    ('Low'),
    ('Medium'),
    ('High')
    ON CONFLICT (name) DO NOTHING