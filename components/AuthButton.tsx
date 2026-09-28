"use client"
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, GoogleAuthProvider } from '../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AuthButton() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    const handleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            toast.success('Signed in successfully!');
            router.push('/dashboard');
        } catch (error) {
            toast.error('Sign-in failed. Please try again.');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success('Signed out successfully!');
            router.push('/');
        } catch (error) {
            toast.error('Sign-out failed. Please try again.');
        }
    };

    return (
        <div className="flex justify-end">
            {loading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#5a6d80] text-sm flex items-center px-4 py-2 rounded-xl bg-white border border-[#dde5ec]"
                >
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0f766e] mr-2"></div>
                    Loading...
                </motion.div>
            ) : user ? (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSignOut}
                    className="bg-white text-[#0f1e2e] py-2.5 px-5 text-[13px] font-bold rounded-xl border border-[#dde5ec] shadow-[0_6px_18px_rgba(15,30,46,0.08)] hover:border-[#ffb59d] hover:bg-[#fff1e8] transition-all flex items-center gap-2"
                >
                    Sign Out
                </motion.button>
            ) : (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSignIn}
                    className="bg-[#0f1e2e] text-white py-2.5 px-5 text-[13px] font-bold rounded-xl shadow-[0_10px_24px_rgba(15,30,46,0.24)] hover:bg-[#172b43] transition-all flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
                    </svg>
                    Sign In with Google
                </motion.button>
            )}
        </div>

    );
}
