import { Request, Response } from 'express';
import User from '../models/User'; // Import the Mongoose User model

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
