import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await login();
        } catch {
            setError('Failed to log in. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-900 p-4 font-sans text-white">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-white/20">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                        <span className="text-4xl">🎓</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Math Kids</h1>
                    <p className="text-indigo-200">Fun Learning Adventure</p>
                </div>

                {error && <div className="bg-red-500/80 p-3 rounded-xl mb-4 text-sm">{error}</div>}

                <div className="space-y-4">
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-white text-indigo-900 font-bold py-4 px-6 rounded-full shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                        <LogIn size={24} />
                        {loading ? 'Connecting...' : 'Parent Login'}
                    </button>
                    <p className="text-xs text-indigo-300 mt-4">
                        Sign in with Google to create profiles and save progress.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
