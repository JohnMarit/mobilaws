import { collection, doc, setDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { ExamAttempt, Certificate } from './examContent';

/**
 * Save exam attempt to Firestore
 */
export async function saveExamAttempt(attempt: ExamAttempt): Promise<void> {
    try {
        const attemptRef = doc(db, 'examAttempts', attempt.id);
        await setDoc(attemptRef, {
            ...attempt,
            startedAt: Timestamp.fromDate(new Date(attempt.startedAt)),
            completedAt: attempt.completedAt ? Timestamp.fromDate(new Date(attempt.completedAt)) : null,
            createdAt: Timestamp.now()
        });
        console.log('✅ Exam attempt saved:', attempt.id);
    } catch (error) {
        console.error('❌ Error saving exam attempt:', error);
        throw error;
    }
}

/**
 * Save certificate to Firestore
 */
export async function saveCertificate(certificate: Certificate): Promise<void> {
    try {
        const certRef = doc(db, 'certificates', certificate.id);
        await setDoc(certRef, {
            ...certificate,
            issuedAt: Timestamp.fromDate(new Date(certificate.issuedAt)),
            createdAt: Timestamp.now()
        });
        console.log('✅ Certificate saved:', certificate.certificateNumber);
    } catch (error) {
        console.error('❌ Error saving certificate:', error);
        throw error;
    }
}

/**
 * Get user's exam attempts
 */
export async function getUserExamAttempts(userId: string): Promise<ExamAttempt[]> {
    try {
        const attemptsRef = collection(db, 'examAttempts');
        const q = query(
            attemptsRef,
            where('userId', '==', userId),
            orderBy('startedAt', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                startedAt: data.startedAt?.toDate().toISOString(),
                completedAt: data.completedAt?.toDate().toISOString()
            } as ExamAttempt;
        });
    } catch (error) {
        console.error('❌ Error fetching exam attempts:', error);
        return [];
    }
}

/**
 * Check if user has passed a specific exam
 */
export async function hasUserPassedExam(userId: string, examId: string): Promise<boolean> {
    try {
        const attemptsRef = collection(db, 'examAttempts');
        const q = query(
            attemptsRef,
            where('userId', '==', userId),
            where('examId', '==', examId),
            where('passed', '==', true)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('❌ Error checking exam completion:', error);
        return false;
    }
}

/**
 * Get user's certificates
 */
export async function getUserCertificates(userId: string): Promise<Certificate[]> {
    try {
        const certsRef = collection(db, 'certificates');
        const q = query(
            certsRef,
            where('userId', '==', userId),
            orderBy('issuedAt', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                issuedAt: data.issuedAt?.toDate().toISOString()
            } as Certificate;
        });
    } catch (error) {
        console.error('❌ Error fetching certificates:', error);
        return [];
    }
}

/**
 * Get all exam attempts (admin only)
 */
export async function getAllExamAttempts(): Promise<ExamAttempt[]> {
    try {
        const attemptsRef = collection(db, 'examAttempts');
        const q = query(attemptsRef, orderBy('startedAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                startedAt: data.startedAt?.toDate().toISOString(),
                completedAt: data.completedAt?.toDate().toISOString()
            } as ExamAttempt;
        });
    } catch (error) {
        console.error('❌ Error fetching all exam attempts:', error);
        return [];
    }
}

/**
 * Get all certificates (admin only)
 */
export async function getAllCertificates(): Promise<Certificate[]> {
    try {
        const certsRef = collection(db, 'certificates');
        const q = query(certsRef, orderBy('issuedAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                issuedAt: data.issuedAt?.toDate().toISOString()
            } as Certificate;
        });
    } catch (error) {
        console.error('❌ Error fetching all certificates:', error);
        return [];
    }
}

/**
 * Get exam statistics (admin only)
 */
export async function getExamStats() {
    try {
        const [attempts, certificates] = await Promise.all([
            getAllExamAttempts(),
            getAllCertificates()
        ]);

        const totalAttempts = attempts.length;
        const completedAttempts = attempts.filter(a => a.completedAt).length;
        const passedAttempts = attempts.filter(a => a.passed).length;
        const totalCertificates = certificates.length;

        const passRate = completedAttempts > 0
            ? Math.round((passedAttempts / completedAttempts) * 100)
            : 0;

        const averageScore = completedAttempts > 0
            ? Math.round(attempts.filter(a => a.score !== undefined).reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts)
            : 0;

        return {
            totalAttempts,
            completedAttempts,
            passedAttempts,
            totalCertificates,
            passRate,
            averageScore,
            recentAttempts: attempts.slice(0, 10),
            recentCertificates: certificates.slice(0, 10)
        };
    } catch (error) {
        console.error('❌ Error fetching exam stats:', error);
        return {
            totalAttempts: 0,
            completedAttempts: 0,
            passedAttempts: 0,
            totalCertificates: 0,
            passRate: 0,
            averageScore: 0,
            recentAttempts: [],
            recentCertificates: []
        };
    }
}
