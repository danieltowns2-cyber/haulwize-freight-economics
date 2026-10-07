import { Router, type IRouter } from "express";
import authConfigRouter from "./auth-config";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(authConfigRouter);
router.use(healthRouter);

export default router;
