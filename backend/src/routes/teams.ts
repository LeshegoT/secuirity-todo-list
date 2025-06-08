import { createTeam, getTeamsForUser } from "../queries/teams.js";
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

router.post("/", async (req, res, next) => {
  try {
    const newTeam = req.body;
    //Need to validate the person creating the team
    const result = await createTeam(newTeam);
    res.status(200).json({
      status: "success",
      data: { newTeam: result },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
