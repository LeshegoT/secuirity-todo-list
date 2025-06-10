CREATE OR REPLACE FUNCTION get_todos_priority_counts_by_team(p_team_id INT DEFAULT NULL)
RETURNS TABLE (
    "priorityID" INT,
    "priorityName" VARCHAR,
    "todoCount" BIGINT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.priority_id AS "priorityID",
        tp.name AS "priorityName",
        COUNT(t.id) AS "todoCount"
    FROM
        todos t
        JOIN
            todo_priorities tp ON t.priority_id = tp.id
    WHERE
        (p_team_id IS NULL OR t.team_id = p_team_id)
    GROUP BY
        tp.name
    ORDER BY
        "priorityName";
END;
$$ LANGUAGE plpgsql;