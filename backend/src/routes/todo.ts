import { Router } from "express";
import {
  createTodo,
  getTodoCountsByPriorityByTeamId,
  getTodoCountsByStatusByTeamId,
  getTodos, getTodosByPriority, getTodosByStatus, trackTodoChanges,
  updateTodo
} from "../queries/todo.js";
import {CreateTodoPayload, UpdateTodoPayload, UserResponse} from "../queries/models/todo.js";
import {NotFoundError, UnauthorizedError, InvalidIdError} from "./errors/customError.js";
import {getUser} from "../queries/users.js";
import {getTeamByTeamId} from "../queries/teams.js";

const router = Router();

const authorisedTodoRoles = ["team_lead", "team_member"];
const unrestrictedTodoRoles = ["team_lead"];

const isUserAuthorised = (userRoles: string[], details : string) => {
  for (const userRole of userRoles) {
    if (authorisedTodoRoles.includes(userRole)) {
      return;
    }
  }

  throw new UnauthorizedError("Unauthorized", details);
}

const isUserUnrestricted = (userRoles: string[]) => {
  for (const userRole of userRoles) {
    if (unrestrictedTodoRoles.includes(userRole)) {
      return true;
    }
  }

  return false;
}

const covertToNumberId = (stringId: string, details: string, mustBeDefined : boolean = false) => {
  const numberId : number | undefined = stringId ? parseInt(stringId as string) : undefined;
  if ((mustBeDefined || numberId) && isNaN(<number>numberId)) {
    throw new InvalidIdError("InvalidId", details);
  }

  return numberId;
}

const getUserFromUuid = async (userUuid : string | undefined, errorMessage: string | undefined = undefined, isCurrentUser : boolean = false) => {
  if (!userUuid) {
    if(isCurrentUser)
    {
      throw new UnauthorizedError("Unauthorized", "The user has not been authorized");
    }

    throw new NotFoundError("UserNotFound", errorMessage ? errorMessage : "User could not be found.");
  }

  const user = await getUser(userUuid);
  if (!user) {
    if(isCurrentUser)
    {
      throw new UnauthorizedError("Unauthorized", "The user has not been authorized");
    }

    throw new NotFoundError("UserNotFound", errorMessage ? errorMessage : "User could not be found.");
  }

  return user as UserResponse;
}

router.get('/', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)
    isUserAuthorised(currentUser.userRoles, 'You are not authorized to retrieve todos.');

    const id = covertToNumberId(req.query.id as string, 'Invalid Todo ID provided.' );
    const teamId = covertToNumberId(req.query.teamId as string, 'Invalid Todo Team ID provided.');
    const statusId = covertToNumberId(req.query.statusId as string, 'Invalid Todo Status ID provided.' );
    const priorityId = covertToNumberId(req.query.priorityId as string, 'Invalid Todo Priority ID provided.' );

    const assignedToUser = req.query.assignedToUuid
      ? await getUserFromUuid(req.query.assignedToUuid as string, "Assigned to user does not exist")
      : null;
    let assignedToId = assignedToUser ? assignedToUser.id : null;

    if (!isUserUnrestricted(currentUser.userRoles) && (!assignedToId || assignedToId !== currentUser.id)) {
      assignedToId = currentUser.id;
    }

    const filters = {
      id,
      teamId,
      assignedToId,
      statusId,
      priorityId
    };

    const todos = await getTodos(filters);

    return res.status(200).json(todos);
  } catch (error : any) {
    if (error instanceof UnauthorizedError || error instanceof InvalidIdError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid);

    isUserAuthorised(currentUser.userRoles, 'You are not authorized to create todos.');

    const createTodoPayload: CreateTodoPayload = req.body;

    createTodoPayload.createdBy = currentUser.id;

    const result = await createTodo(createTodoPayload);

    return res.status(200).json({
      data: { createdTodo: result },
    });
  } catch (error : any) {
    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    isUserAuthorised(currentUser.userRoles, 'You are not authorized to update todos.');

    const id = covertToNumberId(req.params.id as string, 'Invalid Todo ID provided.', true);

    let assignedToId : number | undefined | null = null;

    const isCurrentUserUnrestricted: boolean = isUserUnrestricted(currentUser.userRoles);

    if (!isCurrentUserUnrestricted) {
      assignedToId = currentUser.id;
    }

    const filters = {
      id,
      assignedToId,
    };

    const currentToDo = (await getTodos(filters))[0]

    if (!currentToDo) {
      return res.status(404).json({ message: `There is no todo with id: ${id}.` });
    }

    if (!isCurrentUserUnrestricted && (currentToDo.assignedToUser?.uuid !== currentUser.uuid && currentToDo.createdByUser?.uuid !== currentUser.uuid)) {
      return res.status(401).json({ message: `You are not authorized to update todo with id: ${id}.` });
    }

    const payload: UpdateTodoPayload = { ...req.body, lastModifiedBy: currentUser.id};

    const updatedTodo = await updateTodo(<number>id, payload);

    return res.status(200).json(updatedTodo);
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error instanceof InvalidIdError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/deactivate', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    isUserAuthorised(currentUser.userRoles, 'You are not authorized to deactivate todos.');

    const id = covertToNumberId(req.params.id as string, 'Invalid Todo ID provided.', true);

    let assignedToId : number | undefined | null = null;
    const isCurrentUserUnrestricted: boolean = isUserUnrestricted(currentUser.userRoles);
    if (!isCurrentUserUnrestricted) {
      assignedToId = currentUser.id;
    }

    const filters = {
      id,
      assignedToId,
    };

    const currentToDo = (await getTodos(filters))[0]

    if (!currentToDo) {
      return res.status(404).json({ message: `There is no todo with id: ${id}.` });
    } else if (!isCurrentUserUnrestricted && (currentToDo.assignedToUser?.uuid !== currentUser.uuid && currentToDo.createdByUser?.uuid !== currentUser.uuid)) {
      return res.status(401).json({ message: `You are not authorized to update todo with id: ${id}.` });
    }

    const payload: UpdateTodoPayload = {
      lastModifiedBy: currentUser.id,
      isActive: false
    };

    const updatedTodo = await updateTodo(<number>id, payload);

    return res.status(200).json(updatedTodo);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    if (error instanceof InvalidIdError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error.message });
  }
});

router.get('/counts-by-priority', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    if (!isUserUnrestricted(currentUser.userRoles)) {
      throw new UnauthorizedError("Unauthorized", "The user is not authorized to see all todos");
    }

    if(!req.query.teamId) {
      throw new Error('TeamId needs to be provided.');
    }

    const teamId = covertToNumberId(req.query.teamId as string, 'Invalid Team ID provided.' );

    if (!(await getTeamByTeamId(teamId as number))) {
      throw new NotFoundError(`NotFound`, `There is no team with team Id: ${teamId}`);
    }

    const todoCountsByPriority = await getTodoCountsByPriorityByTeamId(teamId as number);

    return res.json(todoCountsByPriority);
  } catch (error : any) {
    if (error instanceof UnauthorizedError || error instanceof InvalidIdError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error.message });
  }
});

router.get('/counts-by-status', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    if (!isUserUnrestricted(currentUser.userRoles)) {
      throw new UnauthorizedError("Unauthorized", "The user is not authorized to see all todos");
    }

    if(!req.query.teamId) {
      throw new Error('TeamId needs to be provided.');
    }

    const teamId = covertToNumberId(req.query.teamId as string, 'Invalid Team ID provided.' );

    if (!(await getTeamByTeamId(teamId as number))) {
      throw new NotFoundError(`NotFound`, `There is no team with team Id: ${teamId}`);
    }

    const todoCountsByStatus = await getTodoCountsByStatusByTeamId(teamId as number);

    return res.json(todoCountsByStatus);
  } catch (error : any) {
    if (error instanceof UnauthorizedError || error instanceof InvalidIdError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error.message });
  }
});

router.get('/by-priority', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    if (!isUserUnrestricted(currentUser.userRoles)) {
      throw new UnauthorizedError("Unauthorized", "The user is not authorized to see all todos");
    }

    if(!req.query.teamId) {
      throw new Error('TeamId needs to be provided.');
    }

    const teamId = covertToNumberId(req.query.teamId as string, 'Invalid Team ID provided.' );

    if (!(await getTeamByTeamId(teamId as number))) {
      throw new NotFoundError(`NotFound`, `There is no team with team Id: ${teamId}`);
    }

    const todos = await getTodosByPriority(teamId as number);

    return res.json(todos);
  } catch (error : any) {
    if (error instanceof UnauthorizedError || error instanceof InvalidIdError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error.message });
  }
});

router.get('/by-status', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    if (!isUserUnrestricted(currentUser.userRoles)) {
      throw new UnauthorizedError("Unauthorized", "The user is not authorized to see all todos");
    }

    if(!req.query.teamId) {
      throw new Error('TeamId needs to be provided.');
    }

    const teamId = covertToNumberId(req.query.teamId as string, 'Invalid Team ID provided.' );

    if (!(await getTeamByTeamId(teamId as number))) {
      throw new NotFoundError(`NotFound`, `There is no team with team Id: ${teamId}`);
    }

    const todos = await getTodosByStatus(teamId as number);

    return res.json(todos);
  } catch (error : any) {
    if (error instanceof UnauthorizedError || error instanceof InvalidIdError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id/changes', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    if (!isUserUnrestricted(currentUser.userRoles)) {
      throw new UnauthorizedError("Unauthorized", "The user is not authorized to see all todos");
    }

    if(!req.params.id) {
      throw new Error('Todo Id needs to be provided.');
    }

    const id = covertToNumberId(req.params.id as string, 'Invalid Todo ID provided.' );

    const startDate = req.query.startDate;
    let startDateString: string | null = null;
    if (startDate) {
      const startDate = new Date(req.query.startDate as string);

      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: `Invalid start date parameter. Must be a valid date string (e.g., YYYY-MM-DD).` });
      }
      startDateString = startDate.toISOString();
    }

    const endDate = req.query.endDate;
    let endDateString: string | null = null;
    if (endDate) {
      const endDate = new Date(req.query.endDate as string);

      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ error: `Invalid end date parameter. Must be a valid date string (e.g., YYYY-MM-DD).` });
      }
      endDateString = endDate.toISOString();
    }

    const changes = await trackTodoChanges(id as number, startDateString, endDateString);

    return res.json(changes);
  } catch (error : any) {
    if (error instanceof UnauthorizedError || error instanceof InvalidIdError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    isUserAuthorised(currentUser.userRoles, 'You are not authorized to retrieve todos.');

    const id = covertToNumberId(req.params.id as string, 'Invalid Todo ID provided.', true );

    let assignedToId : number | undefined | null = null;

    if (!isUserUnrestricted(currentUser.userRoles)) {
      assignedToId = currentUser.id;
    }

    const filters = {
      id,
      assignedToId,
    };

    const todo = (await getTodos(filters))[0];

    if (!todo) {
      return res.status(404).json({ message: `There is no todo with id: ${id}.` });
    }

    return res.status(200).json(todo);
  } catch (error : any) {
    if (error instanceof UnauthorizedError || error instanceof InvalidIdError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: error });
  }
});


export default router;
