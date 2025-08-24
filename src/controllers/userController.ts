import { Request, Response } from 'express';
import User from '../models/User'; // Import the Mongoose User model
import Vehicle from '../models/Vehicle'; // Import the Mongoose Vehicle model

export const updateUserProfile = async (req: Request, res: Response) => {
    const { username, email } = req.body;
    const userId = (req as any).user.id; // user._id is attached by authenticateUser middleware

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { username, email } },
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password from the returned user object

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User profile updated successfully', user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @api {delete} /user/delete Delete user account
 * @apiGroup User
 * @apiHeader {String} Authorization Users unique access token
 * @apiSuccess {String} message Success message
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "User account deleted successfully"
 *     }
 * @apiError {String} message Error message
 * @apiErrorExample {json} User Not Found Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "User not found"
 *     }
 * @apiErrorExample {json} Unauthorized Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Unauthorized"
 *     }
 * @apiErrorExample {json} Server Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": "Server error"
 *     }
 */
export const deleteUserAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.id; // user._id is attached by authenticateUser middleware

    try {
        // Delete all vehicles associated with the user
        await Vehicle.deleteMany({ owner_id: userId });

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};