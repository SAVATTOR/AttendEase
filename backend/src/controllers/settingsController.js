const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../services/authService');
const ApiError = require('../utils/ApiError');

const getUserSettings = async (req, res, next) => {
    try {
        const userId = req.user.id;

        let settings = await prisma.userSettings.findUnique({
            where: { userId },
        });

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.userSettings.create({
                data: { userId },
            });
        }

        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

const updateUserSettings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const {
            emailNotifications,
            sessionReminders,
            defaultSessionDuration,
            defaultAllowedRadius,
            lateThresholdMinutes,
        } = req.body;

        const settings = await prisma.userSettings.upsert({
            where: { userId },
            update: {
                ...(emailNotifications !== undefined && { emailNotifications }),
                ...(sessionReminders !== undefined && { sessionReminders }),
                ...(defaultSessionDuration !== undefined && { defaultSessionDuration }),
                ...(defaultAllowedRadius !== undefined && { defaultAllowedRadius }),
                ...(lateThresholdMinutes !== undefined && { lateThresholdMinutes }),
            },
            create: {
                userId,
                emailNotifications: emailNotifications ?? true,
                sessionReminders: sessionReminders ?? true,
                defaultSessionDuration: defaultSessionDuration ?? 60,
                defaultAllowedRadius: defaultAllowedRadius ?? 50,
                lateThresholdMinutes: lateThresholdMinutes ?? 15,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, email } = req.body;

        if (email && email.toLowerCase() !== req.user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });

            if (existingUser) {
                throw ApiError.conflict('Email already in use');
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(email && { email: email.toLowerCase() }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Check if current and new passwords are the same
        if (currentPassword === newPassword) {
            throw ApiError.badRequest('Current and new password cannot be the same');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        const isValidPassword = await comparePassword(currentPassword, user.password);

        if (!isValidPassword) {
            throw ApiError.badRequest('Current password is incorrect');
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Invalidate all other sessions
        await prisma.loginSession.updateMany({
            where: {
                userId,
                token: { not: req.token },
            },
            data: { isActive: false },
        });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully. Other sessions have been logged out.',
        });
    } catch (error) {
        next(error);
    }
};

const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            throw ApiError.badRequest('Incorrect password');
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserSettings,
    updateUserSettings,
    updateProfile,
    changePassword,
    deleteAccount,
};