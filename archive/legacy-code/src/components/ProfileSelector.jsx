import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, User, LogOut } from 'lucide-react';

const ProfileSelector = () => {
    const { user, profiles, selectProfile, addProfile, logout } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('grade1');

    const handleAddProfile = (e) => {
        e.preventDefault();
        if (newProfileName.trim()) {
            addProfile(newProfileName, selectedGrade);
            setNewProfileName('');
            setShowAddModal(false);
        }
    };

    return (
        <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4 font-sans text-white">
            <div className="max-w-2xl w-full">
                <div className="flex justifying-between items-center mb-8 px-4">
                    <div>
                        <h2 className="text-3xl font-bold">Who is playing?</h2>
                        <p className="text-indigo-300">Select a profile to start learning</p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        title="Logout Parent"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {profiles.map(profile => (
                        <button
                            key={profile.id}
                            onClick={() => selectProfile(profile)}
                            className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border-2 border-transparent hover:border-indigo-400 hover:bg-white/20 transition-all group flex flex-col items-center gap-4"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-xl">{profile.name}</h3>
                                <p className="text-sm text-indigo-300 capitalize">{profile.grade?.replace('grade', 'Grade ')}</p>
                            </div>
                        </button>
                    ))}

                    {/* Add Profile Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-white/5 border-2 border-dashed border-indigo-400/50 p-6 rounded-3xl hover:bg-white/10 hover:border-indigo-400 transition-all flex flex-col items-center justify-center gap-4 min-h-[200px]"
                    >
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
                            <Plus size={32} className="text-indigo-300" />
                        </div>
                        <span className="font-bold text-indigo-300">Add Kid</span>
                    </button>
                </div>
            </div>

            {/* Add Profile Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-gray-800 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6 text-indigo-900">New Learner</h3>
                        <form onSubmit={handleAddProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                                    placeholder="Enter kid's name"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">Grade</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['grade1', 'grade2'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setSelectedGrade(g)}
                                            className={`p-3 rounded-xl border-2 font-bold transition-all ${selectedGrade === g
                                                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                                                }`}
                                        >
                                            Grade {g.replace('grade', '')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newProfileName.trim()}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Start
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSelector;
