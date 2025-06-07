import { getPriorities } from "../queries/priorities.js";
import { Router } from "express";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const priorities= await getPriorities()
    res.status(200).json({
      status: "success",
      data: priorities,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
