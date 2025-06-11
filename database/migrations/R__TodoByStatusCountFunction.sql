CREATE OR REPLACE FUNCTION get_todos_status_counts_by_team(p_team_id INT DEFAULT NULL)
RETURNS TABLE (
    "statusId" INT,
    "statusName" VARCHAR,
    "todoCount" BIGINT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.status_id AS "statusId",
        ts.name AS "statusName",
        COUNT(t.id) AS "todoCount"
    FROM
        todos t
        JOIN
            todo_statuses ts ON t.status_id = ts.id
    WHERE
        (p_team_id IS NULL OR t.team_id = p_team_id)
    GROUP BY
        t.status_id,
        ts.name
    ORDER BY
        "statusName";
END;
$$ LANGUAGE plpgsql;