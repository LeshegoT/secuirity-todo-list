import { Router } from "express";
import { searchUsersByName } from "../queries/users.js";
import { RequestWithUser } from "../types/types.js";

const router = Router();

router.get("/users", async (req: RequestWithUser, res, next) => {
  try {
    const user = req.user;
      const searchText = req.query.searchText as string;
      const result = await searchUsersByName(searchText);
      res.status(200).json({
        status: "success",
        data: result,
      });

  } catch (error) {
    next(error);
  }
});
export default router;
