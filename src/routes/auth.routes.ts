import { Router } from "express";

const router = Router();

router.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ message: "OK" });
})
export default router;