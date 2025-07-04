import {
  createTeam,
  getTeamLeadUuid,
  getTeamsForUser,
  updateTeam,
} from "../queries/teams.js";
import { Router } from "express";
import { getUserId } from "../queries/users.js";
import { RequestWithUser } from "../types/types.js";

const router = Router();

router.get("/mine", async (req: RequestWithUser, res, next) => {
  try {
    const user = req.user;
    if (!user || !user.uuid) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
    } else {
      const userId = await getUserId(user.uuid);
      if (!userId) {
        res.status(401).json({ status: "error", message: "Unauthorized" });
      } else {
        const teams = await getTeamsForUser(userId);

        res.status(200).json({
          status: "success",
          data: teams,
        });
      }
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: RequestWithUser, res, next) => {
  try {
    const user = req.user;
    if (!user || !user.uuid) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
    } else {
      const teamLeadUUid = user.uuid;
      const result = await createTeam(teamLeadUUid, req.body);
      res.status(200).json({
        status: "success",
        data: { newTeam: result },
      });
    }
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req: RequestWithUser & { params: { id: string } }, res, next) => {
  try {
    const user = req.user;
    if (!user || !user.uuid) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
    } else {
      const teamLeadUUid = await getTeamLeadUuid(Number(req.params.id));
      if (teamLeadUUid != req.user?.uuid) {
        res.status(403).json({ status: "error", message: "Unauthorized" });
      } else {
          const result = await updateTeam(Number(req.params.id), {
            membersToAdd: req.body.membersToAdd,
            membersToRemove: req.body.membersToRemove,
          });
          res.status(200).json({
            status: "success",
            data: { newTeam: result },
          });
        }
      }
  } catch (error) {
    next(error);
  }
});

export default router;
