import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { getAnonymousUserId } from './browser-fingerprint';

export interface TokenUsage {
    userId: string;
    isAnonymous: boolean;
    tokensUsed: number;
    maxTokens: number;
    firstPromptTime: Timestamp | null;
    lastPromptTime: Timestamp | null;
    resetAfter: Timestamp | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    email?: string;
}

// Calculate the next midnight (local time) to align daily resets at 12 a.m.
function getNextMidnightTimestamp(): Timestamp {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Timestamp.fromDate(midnight);
}

// Convenience helper for computing hours until the next reset timestamp
function getHoursUntilReset(resetAfter: Timestamp | null): number {
    if (!resetAfter) return 24;
    const diffMs = resetAfter.toMillis() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
}

/**
 * Get token usage from Firestore
 * Returns current usage or creates new document if doesn't exist
 */
export async function getTokenUsage(
    userId: string,
    isAnonymous: boolean
): Promise<TokenUsage | null> {
    if (!db) {
        console.error('❌ Firestore not initialized');
        return null;
    }

    try {
        const docId = isAnonymous ? `anon_${userId}` : `user_${userId}`;
        const docRef = doc(db, 'tokenUsage', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as TokenUsage;
            const expectedMax = isAnonymous ? 5 : 15;
            // Migrate old limits to new: anonymous 5/day, authenticated 15/day
            if (data.maxTokens !== expectedMax) {
                await updateDoc(docRef, { maxTokens: expectedMax, updatedAt: serverTimestamp() });
                data.maxTokens = expectedMax;
            }

            // Ensure resetAfter is set to midnight for daily resets
            const resetAfter = data.resetAfter;
            const now = Timestamp.now();

            if (!resetAfter || now.toMillis() >= resetAfter.toMillis()) {
                console.log('🔄 Daily reset window reached, resetting tokens to midnight schedule');
                await resetTokens(userId, isAnonymous);
                return await getTokenUsage(userId, isAnonymous);
            }

            return {
                ...data,
                resetAfter
            };
        } else {
            // Create new document with initial state
            const maxTokens = isAnonymous ? 5 : 15;
            const initialData: Partial<TokenUsage> = {
                userId,
                isAnonymous,
                tokensUsed: 0,
                maxTokens,
                firstPromptTime: null,
                lastPromptTime: null,
                resetAfter: getNextMidnightTimestamp(),
                createdAt: serverTimestamp() as Timestamp,
                updatedAt: serverTimestamp() as Timestamp
            };

            await setDoc(docRef, initialData);
            console.log(`✅ Created new token usage document for ${isAnonymous ? 'anonymous' : 'authenticated'} user`);

            return await getTokenUsage(userId, isAnonymous);
        }
    } catch (error) {
        console.error('❌ Error getting token usage:', error);
        return null;
    }
}

/**
 * Use a token - increment the count
 * Returns success status and remaining tokens
 */
export async function useToken(
    userId: string,
    isAnonymous: boolean,
    email?: string
): Promise<{ success: boolean; tokensRemaining: number; hoursUntilReset?: number }> {
    if (!db) {
        console.error('❌ Firestore not initialized');
        return { success: false, tokensRemaining: 0 };
    }

    try {
        const usage = await getTokenUsage(userId, isAnonymous);

        if (!usage) {
            return { success: false, tokensRemaining: 0 };
        }

        // If the reset time has passed (or was missing), ensure fresh usage before proceeding
        if (!usage.resetAfter || Timestamp.now().toMillis() >= usage.resetAfter.toMillis()) {
            await resetTokens(userId, isAnonymous);
            const refreshed = await getTokenUsage(userId, isAnonymous);
            if (!refreshed) {
                return { success: false, tokensRemaining: 0 };
            }
            return await useToken(userId, isAnonymous, email);
        }

        // Check if user has tokens remaining
        if (usage.tokensUsed >= usage.maxTokens) {
            const hoursUntilReset = getHoursUntilReset(usage.resetAfter);

            console.log(`⚠️ No tokens remaining. Reset in ${hoursUntilReset} hours`);
            return {
                success: false,
                tokensRemaining: 0,
                hoursUntilReset
            };
        }

        const docId = isAnonymous ? `anon_${userId}` : `user_${userId}`;
        const docRef = doc(db, 'tokenUsage', docId);

        const now = Timestamp.now();
        const newTokensUsed = usage.tokensUsed + 1;

        // If this is the first token, set the timer
        const updateData: any = {
            tokensUsed: newTokensUsed,
            lastPromptTime: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Always carry a resetAfter aligned to midnight
            resetAfter: usage.resetAfter ?? getNextMidnightTimestamp()
        };

        if (!usage.firstPromptTime) {
            // First token - start daily schedule anchored to midnight
            updateData.firstPromptTime = serverTimestamp();
            updateData.resetAfter = getNextMidnightTimestamp();
            console.log('🕐 First token used - daily countdown to midnight started');
        }

        if (email && !isAnonymous) {
            updateData.email = email;
        }

        await updateDoc(docRef, updateData);

        const tokensRemaining = usage.maxTokens - newTokensUsed;
        console.log(`✅ Token used: ${newTokensUsed}/${usage.maxTokens} (${tokensRemaining} remaining)`);

        const hoursUntilReset = getHoursUntilReset(updateData.resetAfter || usage.resetAfter);

        return {
            success: true,
            tokensRemaining,
            hoursUntilReset
        };
    } catch (error) {
        console.error('❌ Error using token:', error);
        return { success: false, tokensRemaining: 0 };
    }
}

/**
 * Reset tokens to 0 (called after 24 hours)
 */
export async function resetTokens(
    userId: string,
    isAnonymous: boolean
): Promise<boolean> {
    if (!db) {
        console.error('❌ Firestore not initialized');
        return false;
    }

    try {
        const docId = isAnonymous ? `anon_${userId}` : `user_${userId}`;
        const docRef = doc(db, 'tokenUsage', docId);

        await updateDoc(docRef, {
            tokensUsed: 0,
            firstPromptTime: null,
            lastPromptTime: null,
            // Always schedule the next reset for the upcoming midnight
            resetAfter: getNextMidnightTimestamp(),
            updatedAt: serverTimestamp()
        });

        console.log('✅ Tokens reset successfully');
        return true;
    } catch (error) {
        console.error('❌ Error resetting tokens:', error);
        return false;
    }
}

/**
 * Get hours until token reset
 */
export async function getTimeUntilReset(
    userId: string,
    isAnonymous: boolean
): Promise<number> {
    const usage = await getTokenUsage(userId, isAnonymous);

    if (!usage || !usage.resetAfter) {
        return 24; // Default 24 hours if no reset time set
    }

    const now = Timestamp.now();
    const hoursLeft = (usage.resetAfter.toMillis() - now.toMillis()) / (1000 * 60 * 60);

    return Math.max(0, Math.ceil(hoursLeft));
}

/**
 * Check if user can use a token
 */
export async function canUseToken(
    userId: string,
    isAnonymous: boolean
): Promise<boolean> {
    const usage = await getTokenUsage(userId, isAnonymous);

    if (!usage) return false;

    return usage.tokensUsed < usage.maxTokens;
}

/**
 * Use multiple tokens at once (e.g., for court simulator sessions)
 * @param count - Number of tokens to deduct (e.g., session duration in minutes)
 * Returns success status and remaining tokens
 */
export async function useMultipleTokens(
    userId: string,
    isAnonymous: boolean,
    count: number,
    email?: string
): Promise<{ success: boolean; tokensRemaining: number; hoursUntilReset?: number }> {
    if (!db) {
        console.error('❌ Firestore not initialized');
        return { success: false, tokensRemaining: 0 };
    }

    try {
        const usage = await getTokenUsage(userId, isAnonymous);

        if (!usage) {
            return { success: false, tokensRemaining: 0 };
        }

        // If the reset time has passed, reset first
        if (!usage.resetAfter || Timestamp.now().toMillis() >= usage.resetAfter.toMillis()) {
            await resetTokens(userId, isAnonymous);
            const refreshed = await getTokenUsage(userId, isAnonymous);
            if (!refreshed) {
                return { success: false, tokensRemaining: 0 };
            }
            return await useMultipleTokens(userId, isAnonymous, count, email);
        }

        // Check if user has enough tokens remaining
        const tokensNeeded = count;
        const tokensAvailable = usage.maxTokens - usage.tokensUsed;
        
        if (tokensAvailable < tokensNeeded) {
            const hoursUntilReset = getHoursUntilReset(usage.resetAfter);
            console.log(`⚠️ Not enough tokens. Need ${tokensNeeded}, have ${tokensAvailable}. Reset in ${hoursUntilReset} hours`);
            return {
                success: false,
                tokensRemaining: tokensAvailable,
                hoursUntilReset
            };
        }

        const docId = isAnonymous ? `anon_${userId}` : `user_${userId}`;
        const docRef = doc(db, 'tokenUsage', docId);

        const newTokensUsed = usage.tokensUsed + tokensNeeded;

        const updateData: any = {
            tokensUsed: newTokensUsed,
            lastPromptTime: serverTimestamp(),
            updatedAt: serverTimestamp(),
            resetAfter: usage.resetAfter ?? getNextMidnightTimestamp()
        };

        if (!usage.firstPromptTime) {
            updateData.firstPromptTime = serverTimestamp();
            updateData.resetAfter = getNextMidnightTimestamp();
            console.log('🕐 First token usage - daily countdown to midnight started');
        }

        if (email && !isAnonymous) {
            updateData.email = email;
        }

        await updateDoc(docRef, updateData);

        const tokensRemaining = usage.maxTokens - newTokensUsed;
        console.log(`✅ ${tokensNeeded} tokens used: ${newTokensUsed}/${usage.maxTokens} (${tokensRemaining} remaining)`);

        const hoursUntilReset = getHoursUntilReset(updateData.resetAfter || usage.resetAfter);

        return {
            success: true,
            tokensRemaining,
            hoursUntilReset
        };
    } catch (error) {
        console.error('❌ Error using multiple tokens:', error);
        return { success: false, tokensRemaining: 0 };
    }
}

/**
 * Check if user has enough tokens for a court session
 * @param durationMinutes - Session duration in minutes
 */
export async function canStartCourtSession(
    userId: string,
    isAnonymous: boolean,
    durationMinutes: number
): Promise<{ canStart: boolean; tokensNeeded: number; tokensAvailable: number; hoursUntilReset?: number }> {
    const usage = await getTokenUsage(userId, isAnonymous);

    if (!usage) {
        return { canStart: false, tokensNeeded: durationMinutes, tokensAvailable: 0 };
    }

    const tokensNeeded = durationMinutes;
    const tokensAvailable = usage.maxTokens - usage.tokensUsed;
    const canStart = tokensAvailable >= tokensNeeded;

    if (!canStart) {
        const hoursUntilReset = getHoursUntilReset(usage.resetAfter);
        return { canStart: false, tokensNeeded, tokensAvailable, hoursUntilReset };
    }

    return { canStart: true, tokensNeeded, tokensAvailable };
}
