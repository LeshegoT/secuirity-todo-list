
CREATE TABLE users (
    id SERIAL CONSTRAINT pk_users PRIMARY KEY,
    email VARCHAR(255) NOT NULL CONSTRAINT uq_users_email UNIQUE,
    name VARCHAR(100) NOT NULL CONSTRAINT uq_users_username UNIQUE,
    password VARCHAR(255) NOT NULL,
    temp_secret  CHAR(64),
    created_at TIMESTAMP ,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    secret  CHAR(64)
);


CREATE TABLE roles (
    id SERIAL CONSTRAINT pk_roles PRIMARY KEY,
    name VARCHAR(100) NOT NULL CONSTRAINT uq_roles_name UNIQUE
);


CREATE TABLE user_roles (
    user_role_id SERIAL CONSTRAINT pk_user_roles PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id)
);

CREATE TABLE teams (
    id SERIAL CONSTRAINT pk_teams PRIMARY KEY,
    name TEXT NOT NULL CONSTRAINT uq_teams_name UNIQUE,
    team_lead_id INT,
    CONSTRAINT fk_teams_lead FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE team_members (
    id SERIAL CONSTRAINT pk_team_members PRIMARY KEY,
    user_id INT NOT NULL,
    team_id INT NOT NULL,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT uq_team_members_user_team UNIQUE (user_id, team_id)
);


CREATE TABLE todo_statuses (
    id SERIAL CONSTRAINT pk_todo_statuses PRIMARY KEY,
    name VARCHAR(100) NOT NULL CONSTRAINT uq_todo_statuses_name UNIQUE
);


CREATE TABLE todo_priorities (
    id SERIAL CONSTRAINT pk_todo_priorities PRIMARY KEY,
    name VARCHAR(100) NOT NULL CONSTRAINT uq_todo_priorities_name UNIQUE
);


CREATE TABLE todos (
    id SERIAL CONSTRAINT pk_todos PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    assigned_to_id INT,
    team_id INT,
    status_id INT,
    priority_id INT,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by INT,
    description TEXT,
    CONSTRAINT fk_todos_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_todos_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    CONSTRAINT fk_todos_status FOREIGN KEY (status_id) REFERENCES todo_statuses(id),
    CONSTRAINT fk_todos_priority FOREIGN KEY (priority_id) REFERENCES todo_priorities(id),
    CONSTRAINT fk_todos_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE todo_audit_logs (
    id SERIAL CONSTRAINT pk_todo_audit_logs PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    todo_id INT,
    title VARCHAR(255),
    assigned_to_id INT,
    team_id INT,
    status_id INT,
    priority_id INT,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by INT,
    description TEXT,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_todo FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
  
);
