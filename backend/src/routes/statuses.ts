import { Router } from "express";
import { getStatuses } from "../queries/statuses.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const priorities= await getStatuses()
    res.status(200).json({
      status: "success",
      data: priorities,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
