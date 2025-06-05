import { createTeam, getTeamsForUser } from "../queries/teams";
import { Router } from "express";
import { getUserIdByUUID } from "../queries/users";

const router = Router();

router.get("/mine", async (req, res, next) => {
  try {
    //Need way to get logged in user's uuid
    // const userId = await getUserIdByUUID(uuid)
    const teams = await getTeamsForUser(1);
    res.status(200).json({
      status: "success",
      data: { teams: teams || [] },
    });
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
