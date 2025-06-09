import { Router } from "express";
import {createTodo, getTodos, updateTodo} from "../queries/todo";
import {CreateTodoPayload, UpdateTodoPayload, UserResponse} from "../queries/models/todo";
import {NotFoundError, UnauthorizedError} from "./errors/customError";
import {InvalidIdError} from "./errors/customError";
import {getUser} from "../queries/users";

const router = Router();

const authorisedTodoRoles = ["Team Lead", "Todo User"];
const unrestrictedTodoRoles = ["Team Lead"];

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

    if (!isUserUnrestricted(currentUser.userRoles)) {
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

    if (currentToDo.assignedToId !== currentUser.id && currentToDo.createdBy !== currentUser.id) {
      return res.status(401).json({ message: `You are not authorized to update todo with id: ${id}.` });
    }

    const payload: UpdateTodoPayload = req.body;

    const updatedTodo = await updateTodo(<number>id, payload);

    return res.status(200).json(updatedTodo);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    if (error instanceof InvalidIdError) {
      return res.status(error.statusCode).json({ message: `${error.message}: ${error.details}` });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id/deactivate', async (req, res) => {
  try {
    const currentUser = await getUserFromUuid(req.user?.uuid)

    isUserAuthorised(currentUser.userRoles, 'You are not authorized to deactivate todos.');

    const id = covertToNumberId(req.params.id as string, 'Invalid Todo ID provided.', true);

    let assignedToId : number | undefined | null = null;
    if (!isUserUnrestricted(currentUser.userRoles)) {
      assignedToId = currentUser.id;
    }

    const filters = {
      id,
      assignedToId,
    };

    const currentToDo = (await getTodos(filters))[0]

    if (!currentToDo) {
      return res.status(404).json({ message: `There is no todo with id: ${id}.` });
    } else if (currentToDo.assignedToId !== currentUser.id && currentToDo.createdBy !== currentUser.id) {
      return res.status(401).json({ message: `You are not authorized to update todo with id: ${id}.` });
    }

    const payload: UpdateTodoPayload = {
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

    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
