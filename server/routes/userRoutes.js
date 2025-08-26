import express from 'express'
import userAuth from '../middleware/userAuth.js';
import { getUserData } from '../controllers/userController.js';

const userRouter = express.Router();
 userRouter.get('/is-auth', userAuth, (req, res) => {
  res.json({ success: true, message: "User is authenticated" });
});
userRouter.get('/data' , userAuth, getUserData);



export default userRouter;