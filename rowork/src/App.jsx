import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import LZString from 'lz-string';
import { 
  Home, Dumbbell, History as HistoryIcon, Plus, Play, 
  Settings, Search, Trash2, Download, Upload, X, ArrowRight,
  Sun, Moon, Users, Share2, Trophy
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // App Data
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([
    { id: '1', name: 'Bench Press', muscle: 'Chest' },
    { id: '2', name: 'Squat', muscle: 'Legs' },
    { id: '3', name: 'Deadlift', muscle: 'Back' },
    { id: '4', name: 'Overhead Press', muscle: 'Shoulders' },
    { id: '5', name: 'Barbell Row', muscle: 'Back' },
    { id: '6', name: 'Pull Up', muscle: 'Back' },
    { id: '7', name: 'Dumbbell Curl', muscle: 'Biceps' },
    { id: '8', name: 'Tricep Extension', muscle: 'Triceps' }
  ]);
  
  // Friends & Leaderboard State
  const [friends, setFriends] = useState([]);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Active states
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newExercise, setNewExercise] = useState({ name: '', muscle: 'Chest' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTheme = await localforage.getItem('rowork-theme');
        if (savedTheme !== null) setIsDarkMode(savedTheme);
        
        const savedWorkouts = await localforage.getItem('rowork-workouts');
        const savedExercises = await localforage.getItem('rowork-exercises');
        const savedFriends = await localforage.getItem('rowork-friends');
        
        if (savedWorkouts) setWorkouts(savedWorkouts);
        if (savedExercises) setExercises(savedExercises);
        if (savedFriends) setFriends(savedFriends);

        // Check if user opened someone's invite link
        const params = new URLSearchParams(window.location.search);
        const sharedPayload = params.get('rival');
        if (sharedPayload) {
          try {
            const decompressed = LZString.decompressFromEncodedURIComponent(sharedPayload);
            const friendData = JSON.parse(decompressed);
            if (friendData && friendData.name) {
              // Add or update friend in list
              const updatedFriends = [...friends.filter(f => f.name !== friendData.name), friendData];
              setFriends(updatedFriends);
              localforage.setItem('rowork-friends', updatedFriends);
              window.history.replaceState({}, document.title, window.location.pathname);
              alert(`Successfully linked rivalry with ${friendData.name}! Check the Leaderboard tab.`);
            }
          } catch (e) {
            console.error("Failed to parse invite link", e);
          }
        }
      } catch (err) {
        console.error("Failed to load data", err);
      }
      setIsDataLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      localforage.setItem('rowork-workouts', workouts);
      localforage.setItem('rowork-exercises', exercises);
      localforage.setItem('rowork-theme', isDarkMode);
    }
  }, [workouts, exercises, isDarkMode, isDataLoaded]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const theme = {
    bgMain: isDarkMode ? 'bg-black' : 'bg-[#f2f2f2]',
    bgSidebar: isDarkMode ? 'bg-black' : 'bg-[#ececec]',
    bgCard: isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-black',
    textMuted: isDarkMode ? 'text-white/40' : 'text-black/40',
    border: isDarkMode ? 'border-[#1a1a1a]' : 'border-[#d9d9d9]',
    borderFocus: isDarkMode ? 'focus:border-white' : 'focus:border-black',
    btnPrimary: isDarkMode ? 'bg-white text-black hover:bg-[#e0e0e0]' : 'bg-black text-white hover:bg-[#333]',
    navIcon: isDarkMode ? 'text-white/30 hover:text-white' : 'text-black/30 hover:text-black',
    navIconActive: isDarkMode ? 'text-white' : 'text-black',
    chartLine: isDarkMode ? '#ffffff' : '#000000',
    chartBg: isDarkMode ? '#000000' : '#f2f2f2',
    chartGrid: isDarkMode ? '#1a1a1a' : '#d9d9d9',
    chartAxis: isDarkMode ? '#666666' : '#999999',
    inputPlaceholder: isDarkMode ? 'placeholder:text-white/20' : 'placeholder:text-black/30',
    selection: isDarkMode ? 'selection:bg-white selection:text-black' : 'selection:bg-black selection:text-white'
  };

  const calculateTotalVolume = (wList) => {
    return wList.reduce((total, w) => total + w.loggedExercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, set) => sAcc + (Number(set.weight || 0) * Number(set.reps || 0)), 0), 0), 0);
  };

  const generateInviteLink = () => {
    const myName = prompt("Enter your name for the leaderboard:", "Lifter");
    if (!myName) return;

    const myProfile = {
      name: myName,
      totalWorkouts: workouts.length,
      totalVolume: calculateTotalVolume(workouts),
      lastActive: workouts.length > 0 ? workouts[0].date : new Date().toISOString()
    };

    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(myProfile));
    const inviteUrl = `${window.location.origin}${window.location.pathname}?rival=${compressed}`;
    
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 4000);
  };

  const startWorkout = () => {
    setActiveWorkout({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      name: 'SESSION // ' + new Date().toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
      loggedExercises: []
    });
    setActiveTab('log');
  };

  const addExerciseToWorkout = (exercise) => {
    setActiveWorkout(prev => ({
      ...prev,
      loggedExercises: [...prev.loggedExercises, { 
        exerciseId: exercise.id, 
        name: exercise.name, 
        sets: [{ weight: '', reps: '' }] 
      }]
    }));
    setSearchQuery('');
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = { ...activeWorkout };
    updated.loggedExercises[exerciseIndex].sets[setIndex][field] = value;
    setActiveWorkout(updated);
  };

  const addSet = (exerciseIndex) => {
    const updated = { ...activeWorkout };
    const lastSet = updated.loggedExercises[exerciseIndex].sets.slice(-1)[0];
    updated.loggedExercises[exerciseIndex].sets.push({ 
      weight: lastSet ? lastSet.weight : '', 
      reps: lastSet ? lastSet.reps : '' 
    });
    setActiveWorkout(updated);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const updated = { ...activeWorkout };
    updated.loggedExercises[exerciseIndex].sets.splice(setIndex, 1);
    setActiveWorkout(updated);
  };

  const finishWorkout = () => {
    if (!activeWorkout || activeWorkout.loggedExercises.length === 0) {
      setActiveWorkout(null);
      setActiveTab('dashboard');
      return;
    }
    const cleanedWorkout = {
      ...activeWorkout,
      loggedExercises: activeWorkout.loggedExercises.map(ex => ({
        ...ex,
        sets: ex.sets.filter(s => s.weight !== '' && s.reps !== '')
      })).filter(ex => ex.sets.length > 0)
    };

    if (cleanedWorkout.loggedExercises.length > 0) {
      setWorkouts([cleanedWorkout, ...workouts]);
    }
    setActiveWorkout(null);
    setActiveTab('dashboard');
  };

  const handleCreateExercise = (e) => {
    e.preventDefault();
    if (!newExercise.name.trim()) return;
    const added = { id: Date.now().toString(), name: newExercise.name, muscle: newExercise.muscle };
    setExercises([...exercises, added]);
    setNewExercise({ name: '', muscle: 'Chest' });
  };

  const handleDeleteExercise = (id) => setExercises(exercises.filter(ex => ex.id !== id));

  const exportData = () => {
    const data = JSON.stringify({ workouts, exercises });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rowork-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.workouts && parsed.exercises) {
          setWorkouts(parsed.workouts);
          setExercises(parsed.exercises);
          alert("Data restored.");
        }
      } catch (err) { alert("Error reading file."); }
    };
    reader.readAsText(file);
  };

  if (!isDataLoaded) {
    return <div className={`min-h-screen ${theme.bgMain} flex items-center justify-center ${theme.text} text-xs tracking-widest uppercase`}>Initializing...</div>;
  }

  const filteredExercises = exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const recentWorkouts = [...workouts].reverse().slice(-14);
  const chartData = recentWorkouts.map((w) => ({ 
    name: new Date(w.date).toLocaleDateString([], { month: 'short', day: 'numeric' }), 
    volume: w.loggedExercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, set) => sAcc + (Number(set.weight || 0) * Number(set.reps || 0)), 0), 0)
  }));

  // Leaderboard items compilation
  const myTotalVolume = calculateTotalVolume(workouts);
  const leaderboardEntries = [
    { name: 'You (Local)', workouts: workouts.length, volume: myTotalVolume, isUser: true },
    ...friends
  ].sort((a, b) => b.volume - a.volume);

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Overview' },
    { id: 'log', icon: Dumbbell, label: 'Train' },
    { id: 'leaderboard', icon: Trophy, label: 'Rivals' },
    { id: 'history', icon: HistoryIcon, label: 'History' },
    { id: 'exercises', icon: Search, label: 'Library' },
    { id: 'settings', icon: Settings, label: 'System' }
  ];

  return (
    <div className={`min-h-screen ${theme.bgMain} ${theme.text} font-sans ${theme.selection} flex flex-col md:flex-row transition-colors duration-500`}>
      
      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-72 ${theme.bgSidebar} border-r ${theme.border} h-screen sticky top-0 p-8 transition-colors duration-500`}>
        <h1 className="text-3xl font-light tracking-tighter mb-16">
          ROWORK<span className={theme.textMuted}>.</span>
        </h1>
        <nav className="space-y-4 flex-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'log' && !activeWorkout) startWorkout();
                  else setActiveTab(item.id);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 group transition-all duration-500 ${
                  isActive ? theme.text : `${theme.textMuted} hover:${theme.text} hover:translate-x-2`
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-xs uppercase tracking-widest font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* MOBILE HEADER */}
      <header className={`md:hidden px-6 pt-12 pb-6 ${theme.bgSidebar} sticky top-0 z-40 flex justify-between items-end border-b ${theme.border} transition-colors duration-500`}>
        <h1 className="text-2xl font-light tracking-tighter">ROWORK.</h1>
        <div className="flex items-center gap-4">
          <span className={`text-[10px] uppercase tracking-widest ${theme.textMuted}`}>{navItems.find(n => n.id === activeTab)?.label}</span>
          <button onClick={toggleTheme} className={`p-2 ${theme.textMuted} hover:${theme.text} transition-colors`}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 md:py-16 pb-32 md:pb-16 overflow-y-auto relative">
        
        {/* DESKTOP THEME TOGGLE */}
        <div className="hidden md:flex absolute top-8 right-8 z-50">
          <button onClick={toggleTheme} className={`p-3 rounded-full border ${theme.border} ${theme.textMuted} hover:${theme.text} hover:${theme.bgCard} transition-all duration-300`}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-700 zoom-in-[0.98]">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mb-2`}>Welcome Back</p>
                <h2 className="text-4xl md:text-5xl font-light tracking-tighter">Performance.</h2>
              </div>
              <button onClick={startWorkout} className={`group ${theme.btnPrimary} px-8 py-4 flex items-center justify-between gap-4 transition-all duration-300`}>
                <span className="text-xs uppercase tracking-widest font-bold">Start Session</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${theme.bgCard} p-8 border ${theme.border} flex flex-col justify-between aspect-square md:aspect-auto transition-colors duration-500`}>
                <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted}`}>Total Sessions</p>
                <p className="text-7xl md:text-8xl font-light tracking-tighter mt-8">{workouts.length}</p>
              </div>
              <div className={`${theme.bgCard} p-8 border ${theme.border} flex flex-col justify-between aspect-square md:aspect-auto transition-colors duration-500`}>
                <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted}`}>This Week</p>
                <p className="text-7xl md:text-8xl font-light tracking-tighter mt-8">
                  {workouts.filter(w => new Date(w.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <div className={`${theme.bgCard} p-8 border ${theme.border} flex flex-col justify-between md:col-span-3 transition-colors duration-500`}>
                <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted}`}>Lifetime Volume (KG)</p>
                <p className="text-5xl md:text-7xl font-light tracking-tighter mt-4">
                  {myTotalVolume.toLocaleString()}
                </p>
              </div>
            </div>

            {workouts.length > 0 && (
              <div className="pt-8">
                <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mb-6`}>Volume Trajectory</p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.chartLine} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={theme.chartLine} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
                      <XAxis dataKey="name" stroke={theme.chartAxis} fontSize={9} tickLine={false} axisLine={false} dy={10} tick={{ fill: theme.chartAxis }} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                      <YAxis stroke={theme.chartAxis} fontSize={9} tickLine={false} axisLine={false} dx={-10} tick={{ fill: theme.chartAxis }} tickFormatter={(val) => val > 0 ? `${(val/1000).toFixed(1)}k` : '0'} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#000' : '#fff', border: `1px solid ${isDarkMode ? '#333' : '#ccc'}`, borderRadius: '0', color: isDarkMode ? '#fff' : '#000', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} itemStyle={{ color: theme.chartLine, fontWeight: 'bold' }} cursor={{ stroke: theme.chartGrid, strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="volume" stroke={theme.chartLine} strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" activeDot={{ r: 5, fill: theme.chartLine, stroke: theme.chartBg, strokeWidth: 2 }} dot={{ r: 3, fill: theme.chartBg, stroke: theme.chartLine, strokeWidth: 1.5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD / RIVALS TAB */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mb-2`}>Peer Comparison</p>
                <h2 className="text-4xl md:text-5xl font-light tracking-tighter">Leaderboard.</h2>
              </div>
              <button onClick={generateInviteLink} className={`group ${theme.btnPrimary} px-8 py-4 flex items-center justify-between gap-4 transition-all duration-300`}>
                <span className="text-xs uppercase tracking-widest font-bold">Share Invite Link</span>
                <Share2 className="w-4 h-4" />
              </button>
            </header>

            {inviteCopied && (
              <div className="p-4 border border-white/20 bg-white/5 text-xs uppercase tracking-widest text-center animate-pulse">
                Invite link copied to clipboard! Send it to a friend.
              </div>
            )}

            <div className={`border ${theme.border} divide-y ${theme.border}`}>
              {leaderboardEntries.map((entry, index) => (
                <div key={index} className={`p-6 flex items-center justify-between ${entry.isUser ? 'bg-white/5' : ''}`}>
                  <div className="flex items-center gap-6">
                    <span className={`text-xl font-mono ${theme.textMuted}`}>#{index + 1}</span>
                    <div>
                      <h4 className={`text-lg font-light ${theme.text}`}>{entry.name}</h4>
                      <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mt-1`}>
                        {entry.workouts} Sessions Logged
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-mono ${theme.text}`}>{entry.volume.toLocaleString()}</p>
                    <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted}`}>Total KG Volume</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOG WORKOUT TAB */}
        {activeTab === 'log' && activeWorkout && (
          <div className="space-y-12 animate-in fade-in duration-700 max-w-3xl">
            <div className={`flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b ${theme.border} pb-6`}>
              <input type="text" value={activeWorkout.name} onChange={(e) => setActiveWorkout({...activeWorkout, name: e.target.value})} className={`bg-transparent border-none text-3xl md:text-5xl font-light tracking-tighter ${theme.text} outline-none w-full ${theme.inputPlaceholder}`} placeholder="Session Name" />
              <button onClick={finishWorkout} className={`px-8 py-4 ${theme.btnPrimary} text-xs uppercase tracking-widest font-bold transition-colors whitespace-nowrap`}>End Session</button>
            </div>

            <div className="space-y-16">
              {activeWorkout.loggedExercises.map((ex, exIndex) => (
                <div key={exIndex} className="space-y-6">
                  <div className={`flex justify-between items-end border-b ${theme.border} pb-2`}>
                    <h3 className={`text-xl font-light tracking-tight ${theme.text}`}>{ex.name}</h3>
                    <button onClick={() => { const updated = {...activeWorkout}; updated.loggedExercises.splice(exIndex, 1); setActiveWorkout(updated); }} className={`${theme.textMuted} hover:${theme.text} transition-colors pb-1`}><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className={`grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest ${theme.textMuted} px-2`}>
                      <div className="col-span-2">Set</div>
                      <div className="col-span-4">Weight</div>
                      <div className="col-span-4">Reps</div>
                    </div>
                    
                    {ex.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-12 gap-4 items-center group">
                        <div className={`col-span-2 text-xs font-mono ${theme.textMuted} pl-2`}>{String(setIndex + 1).padStart(2, '0')}</div>
                        <input type="number" value={set.weight} onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)} className={`col-span-4 bg-transparent border-b ${theme.border} ${theme.borderFocus} ${theme.text} py-2 outline-none font-mono text-lg transition-colors ${theme.inputPlaceholder}`} placeholder="00.0" />
                        <input type="number" value={set.reps} onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)} className={`col-span-4 bg-transparent border-b ${theme.border} ${theme.borderFocus} ${theme.text} py-2 outline-none font-mono text-lg transition-colors ${theme.inputPlaceholder}`} placeholder="0" />
                        <button onClick={() => removeSet(exIndex, setIndex)} className={`col-span-2 flex justify-end pr-2 opacity-0 group-hover:opacity-100 ${theme.textMuted} hover:${theme.text} transition-all`}><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => addSet(exIndex)} className={`text-[10px] uppercase tracking-widest font-bold ${theme.textMuted} hover:${theme.text} flex items-center gap-2 pt-4 transition-colors`}><Plus className="w-3 h-3" /> Add Set</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={`pt-16 border-t ${theme.border}`}>
              <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mb-6`}>Append Movement</p>
              <div className="relative mb-8">
                <Search className={`w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
                <input type="text" placeholder="Search library..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-transparent border-b ${theme.border} ${theme.borderFocus} py-4 pl-8 ${theme.text} outline-none font-light transition-colors`} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {filteredExercises.map(ex => (
                  <button key={ex.id} onClick={() => addExerciseToWorkout(ex)} className={`p-4 border ${theme.border} hover:${theme.borderFocus} text-left transition-colors flex justify-between items-center group`}>
                    <div>
                      <div className={`font-light ${theme.text}`}>{ex.name}</div>
                      <div className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mt-1`}>{ex.muscle}</div>
                    </div>
                    <Plus className={`w-4 h-4 ${theme.textMuted} group-hover:${theme.text} transition-colors`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header><h2 className="text-4xl md:text-5xl font-light tracking-tighter">Archive.</h2></header>
            {workouts.length === 0 ? <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted}`}>No entries found.</p> : (
              <div className="space-y-8">
                {workouts.map(workout => (
                  <div key={workout.id} className={`border-b ${theme.border} pb-8 group`}>
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mb-2`}>{new Date(workout.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <h3 className={`text-2xl font-light ${theme.text}`}>{workout.name}</h3>
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest ${theme.textMuted}`}>{workout.loggedExercises.length} Movements</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      {workout.loggedExercises.map((ex, idx) => {
                        const topWeight = Math.max(...ex.sets.map(s => Number(s.weight) || 0));
                        return (
                          <div key={idx} className={`flex justify-between items-end text-sm border-b ${theme.border} pb-2`}>
                            <span className={`font-light ${theme.text}`}><span className={`${theme.textMuted} mr-3`}>{ex.sets.length}x</span>{ex.name}</span>
                            <span className={`font-mono ${theme.text} text-xs`}>{topWeight} <span className={`${theme.textMuted} text-[10px]`}>KG</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXERCISES TAB */}
        {activeTab === 'exercises' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header><h2 className="text-4xl md:text-5xl font-light tracking-tighter">Directory.</h2></header>
            <form onSubmit={handleCreateExercise} className={`flex flex-col md:flex-row gap-6 items-end pb-12 border-b ${theme.border}`}>
              <div className="flex-1 w-full">
                <label className={`block text-[10px] uppercase tracking-widest ${theme.textMuted} mb-2`}>Nomenclature</label>
                <input type="text" required value={newExercise.name} onChange={(e) => setNewExercise({...newExercise, name: e.target.value})} className={`w-full bg-transparent border-b ${theme.border} ${theme.borderFocus} py-2 ${theme.text} outline-none font-light transition-colors`} placeholder="Movement Name" />
              </div>
              <div className="w-full md:w-64">
                <label className={`block text-[10px] uppercase tracking-widest ${theme.textMuted} mb-2`}>Primary Target</label>
                <select value={newExercise.muscle} onChange={(e) => setNewExercise({...newExercise, muscle: e.target.value})} className={`w-full ${theme.bgSidebar} border-b ${theme.border} ${theme.borderFocus} py-2 ${theme.text} outline-none font-light transition-colors appearance-none rounded-none`}>
                  {['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Cardio'].map(m => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              <button type="submit" className={`w-full md:w-auto ${theme.btnPrimary} px-8 py-3 text-xs uppercase tracking-widest font-bold transition-colors`}>Define</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercises.map(ex => (
                <div key={ex.id} className={`p-6 border ${theme.border} flex justify-between items-start group`}>
                  <div>
                    <div className={`font-light ${theme.text} text-lg`}>{ex.name}</div>
                    <div className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mt-2`}>{ex.muscle}</div>
                  </div>
                  <button onClick={() => handleDeleteExercise(ex.id)} className={`${theme.textMuted} hover:${theme.text} transition-colors`}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-12 animate-in fade-in duration-700 max-w-xl">
            <header><h2 className="text-4xl md:text-5xl font-light tracking-tighter">System.</h2></header>
            <div className="space-y-8">
              <div className={`border ${theme.border} p-8`}>
                <h3 className={`text-lg font-light ${theme.text} mb-2`}>Export Protocol</h3>
                <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mb-8 leading-relaxed`}>Download a structured JSON manifest of your entire physical trajectory.</p>
                <button onClick={exportData} className={`flex items-center gap-4 text-xs uppercase tracking-widest font-bold ${theme.text} opacity-70 hover:opacity-100 transition-opacity`}><Download className="w-4 h-4" /> Execute Export</button>
              </div>
              <div className={`border ${theme.border} p-8`}>
                <h3 className={`text-lg font-light ${theme.text} mb-2`}>Import Protocol</h3>
                <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} mb-8 leading-relaxed`}>Overwrite current system memory with a verified JSON manifest.</p>
                <label className={`flex items-center gap-4 text-xs uppercase tracking-widest font-bold ${theme.text} opacity-70 hover:opacity-100 transition-opacity cursor-pointer w-fit`}><Upload className="w-4 h-4" /> Select Payload<input type="file" accept=".json" onChange={importData} className="hidden" /></label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className={`md:hidden fixed bottom-0 w-full ${theme.bgSidebar} border-t ${theme.border} px-6 py-4 flex justify-between items-center z-50 pb-safe transition-colors duration-500`}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => { if (item.id === 'log' && !activeWorkout) startWorkout(); else setActiveTab(item.id); }} className={`p-2 transition-transform duration-300 ${isActive ? `${theme.navIconActive} scale-110` : theme.navIcon}`}>
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2 : 1.5} />
            </button>
          )
        })}
      </nav>
    </div>
  );
}