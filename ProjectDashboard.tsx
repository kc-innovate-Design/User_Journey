
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signOut, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { ProjectMeta } from './types';
import { Plus, LogOut, Trash2, Clock, FolderOpen } from 'lucide-react';

interface ProjectDashboardProps {
    user: User;
    onSelectProject: (projectId: string) => void;
    onSignOut: () => void;
}

export default function ProjectDashboard({ user, onSelectProject, onSignOut }: ProjectDashboardProps) {
    const [projects, setProjects] = useState<ProjectMeta[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const projectsColRef = collection(db, 'users', user.uid, 'projects');

    useEffect(() => {
        const unsubscribe = onSnapshot(projectsColRef, (snapshot) => {
            const items: ProjectMeta[] = [];
            snapshot.forEach(doc => {
                items.push({ id: doc.id, ...doc.data() } as ProjectMeta);
            });
            items.sort((a, b) => b.updatedAt - a.updatedAt);
            setProjects(items);
            setLoading(false);
        }, (err) => {
            console.error('Firestore snapshot error:', err);
            setError('Unable to load projects. Check Firestore rules.');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);

    const createProject = async () => {
        setError('');
        try {
            const id = Math.random().toString(36).substr(2, 9);
            const now = Date.now();
            const project: ProjectMeta = {
                id,
                title: 'Untitled Journey',
                createdAt: now,
                updatedAt: now,
            };
            await setDoc(doc(projectsColRef, id), project);
            // Also create the default map data
            await setDoc(doc(db, 'users', user.uid, 'projects', id, 'data', 'map'), {
                title: 'New User Journey',
                current: { id: 'current', title: 'Current State', items: [] },
                future: { id: 'future', title: 'Future State', items: [] }
            });
            onSelectProject(id);
        } catch (err: any) {
            console.error('Create project error:', err);
            setError(`Failed to create project: ${err.message}`);
        }
    };

    const deleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!confirm('Delete this project? This cannot be undone.')) return;
        await deleteDoc(doc(projectsColRef, projectId));
        // Also delete map data
        await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId, 'data', 'map'));
    };

    const handleSignOut = async () => {
        await signOut(auth);
        onSignOut();
    };

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                                <path d="M18 20V10M12 20V4M6 20v-6" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-primary tracking-tight">Innovate System</h1>
                            <p className="text-xs text-slate-400 -mt-0.5">Journey Mapping</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            {user.photoURL && (
                                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                            )}
                            <span className="text-sm font-medium text-slate-600 hidden sm:block">{user.displayName}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:block">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
                        ⚠️ {error}
                    </div>
                )}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Your Projects</h2>
                        <p className="text-sm text-slate-400 mt-1">{projects.length} journey map{projects.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={createProject}
                        className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-semibold shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={20} />
                        New Project
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-accent rounded-full animate-spin"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-3xl mb-6">
                            <FolderOpen size={36} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-400 mb-2">No projects yet</h3>
                        <p className="text-slate-400 text-sm mb-6">Create your first user journey map to get started.</p>
                        <button
                            onClick={createProject}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-semibold shadow-lg shadow-accent/20 hover:shadow-xl transition-all"
                        >
                            <Plus size={20} />
                            Create First Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => onSelectProject(project.id)}
                                className="group relative bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-accent/20 hover:scale-[1.02] cursor-pointer transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                                            <path d="M18 20V10M12 20V4M6 20v-6" />
                                        </svg>
                                    </div>
                                    <button
                                        onClick={(e) => deleteProject(e, project.id)}
                                        className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete project"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-primary text-lg mb-2 truncate">{project.title}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <Clock size={12} />
                                    <span>Edited {formatDate(project.updatedAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
