import { doc, getDoc } from 'firebase/firestore';

/**
 * Verifies if the provided code matches the one stored in Firestore for the given database.
 *
 * @param {string} code - The code to verify.
 * @param {string} database - The Firestore document ID under `database_users/`.
 * @param {object} fbFirestore - The Firestore instance.
 * @returns {Promise<boolean>} - Resolves to true if code is valid, false otherwise.
 */
export async function verifyDatabaseCode(code, database, fbFirestore) {
	if (!code || !database || !fbFirestore) return false;

	try {
		const userDocRef = doc(fbFirestore, 'database_users', database);
		const userDocSnap = await getDoc(userDocRef);

		if (!userDocSnap.exists()) {
			console.warn('Database user not found');
			return false;
		}

		const userData = userDocSnap.data();
		return userData.code === code;
	} catch (err) {
		console.error('Code verification failed:', err);
		return false;
	}
}