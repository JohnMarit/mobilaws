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

            // Check if 24 hours have elapsed since first prompt
            if (data.firstPromptTime && data.resetAfter) {
                const now = Timestamp.now();

                if (now.toMillis() >= data.resetAfter.toMillis()) {
                    // 24 hours elapsed - reset tokens
                    console.log('🔄 24 hours elapsed, resetting tokens');
                    await resetTokens(userId, isAnonymous);
                    return await getTokenUsage(userId, isAnonymous);
                }
            }

            return data;
        } else {
            // Create new document with initial state
            const maxTokens = isAnonymous ? 3 : 5;
            const initialData: Partial<TokenUsage> = {
                userId,
                isAnonymous,
                tokensUsed: 0,
                maxTokens,
                firstPromptTime: null,
                lastPromptTime: null,
                resetAfter: null,
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

        // Check if user has tokens remaining
        if (usage.tokensUsed >= usage.maxTokens) {
            const hoursUntilReset = usage.resetAfter
                ? Math.ceil((usage.resetAfter.toMillis() - Timestamp.now().toMillis()) / (1000 * 60 * 60))
                : 0;

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
            updatedAt: serverTimestamp()
        };

        if (!usage.firstPromptTime) {
            // First token - start 24-hour countdown
            updateData.firstPromptTime = serverTimestamp();

            // Calculate reset time (24 hours from now)
            const resetTime = new Timestamp(
                now.seconds + (24 * 60 * 60), // Add 24 hours in seconds
                now.nanoseconds
            );
            updateData.resetAfter = resetTime;

            console.log('🕐 First token used - 24-hour countdown started');
        }

        if (email && !isAnonymous) {
            updateData.email = email;
        }

        await updateDoc(docRef, updateData);

        const tokensRemaining = usage.maxTokens - newTokensUsed;
        console.log(`✅ Token used: ${newTokensUsed}/${usage.maxTokens} (${tokensRemaining} remaining)`);

        const hoursUntilReset = usage.resetAfter
            ? Math.ceil((usage.resetAfter.toMillis() - now.toMillis()) / (1000 * 60 * 60))
            : 24;

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
            resetAfter: null,
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
