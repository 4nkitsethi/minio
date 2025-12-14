import React, { useState, useEffect } from 'react';
import { SelectWithCreate } from './components/SelectWithCreate';
import { ImageUpload } from './components/ImageUpload';
import { Button } from './components/Button';
import { generateSuggestions, generateUUID } from './services/geminiService';
import { SelectionState, LevelKey } from './types';
import { LEVEL_CONFIGS, INITIAL_CATALOGS } from './constants';

const VALID_TOKEN = "A7K9Q2M8";

const App: React.FC = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');

  // --- App Logic State ---
  const [selections, setSelections] = useState<SelectionState>({
    catalog: null,
    category: null,
    subCategory: null,
    brand: null,
    model: null,
    year: null,
    color: null,
    uuid: null,
  });

  const [options, setOptions] = useState<Record<LevelKey, string[]>>({
    catalog: INITIAL_CATALOGS,
    category: [],
    subCategory: [],
    brand: [],
    model: [],
    year: [],
    color: [],
    uuid: [],
  });

  const [images, setImages] = useState<File[]>([]);
  const [loadingLevel, setLoadingLevel] = useState<LevelKey | null>(null);

  // --- Effects ---

  // Check for persisted session
  useEffect(() => {
    const storedToken = localStorage.getItem('inventory_auth_token');
    if (storedToken === VALID_TOKEN) {
      setIsAuthenticated(true);
    }
  }, []);

  // Initial Data Load (Only triggers if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadCatalogs = async () => {
        setLoadingLevel('catalog');
        try {
            const catalogs = await generateSuggestions('catalog', {
                catalog: null, category: null, subCategory: null, 
                brand: null, model: null, year: null, color: null, uuid: null
            });
            setOptions(prev => ({ ...prev, catalog: catalogs }));
        } catch (error) {
            console.error("Failed to load catalogs:", error);
        } finally {
            setLoadingLevel(null);
        }
    };

    loadCatalogs();
  }, [isAuthenticated]);

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim() === VALID_TOKEN) {
      setIsAuthenticated(true);
      localStorage.setItem('inventory_auth_token', tokenInput.trim());
      setAuthError('');
    } else {
      setAuthError('Invalid Access Token. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('inventory_auth_token');
    setTokenInput('');
    setAuthError('');
    // Optional: Reset form state
    setSelections({
        catalog: null, category: null, subCategory: null, brand: null, 
        model: null, year: null, color: null, uuid: null,
    });
    setImages([]);
  };

  const handleSelectionChange = async (level: LevelKey, value: string | null) => {
    setSelections(prev => {
      const newState = { ...prev };
      newState[level] = value;
      let clear = false;
      LEVEL_CONFIGS.forEach(cfg => {
        if (clear) newState[cfg.key] = null;
        if (cfg.key === level) clear = true;
      });
      return newState;
    });

    const currentIndex = LEVEL_CONFIGS.findIndex(c => c.key === level);
    const nextConfig = LEVEL_CONFIGS[currentIndex + 1];

    if (value === null) {
        if (nextConfig) {
             setOptions(prev => {
                const nextOpts = { ...prev };
                for(let i = currentIndex + 1; i < LEVEL_CONFIGS.length; i++) {
                    nextOpts[LEVEL_CONFIGS[i].key] = [];
                }
                return nextOpts;
             });
        }
        return;
    }

    if (nextConfig) {
        setLoadingLevel(nextConfig.key);
        setOptions(prev => {
            const nextOpts = { ...prev };
            for(let i = currentIndex + 1; i < LEVEL_CONFIGS.length; i++) {
                nextOpts[LEVEL_CONFIGS[i].key] = [];
            }
            return nextOpts;
        });

        const currentContext = { ...selections, [level]: value };

        try {
            let nextLevelOptions: string[] = [];
            if (nextConfig.key === 'uuid') {
                const generated = await generateUUID(selections.model || value);
                nextLevelOptions = [generated];
            } else {
                nextLevelOptions = await generateSuggestions(nextConfig.key, currentContext);
            }

            setOptions(prev => ({
                ...prev,
                [nextConfig.key]: nextLevelOptions
            }));
        } catch (error) {
            console.error("Error fetching options:", error);
        } finally {
            setLoadingLevel(null);
        }
    }
  };

  const handleCreate = (level: LevelKey, newValue: string) => {
    setOptions(prev => ({
      ...prev,
      [level]: [...prev[level], newValue]
    }));
    handleSelectionChange(level, newValue);
  };

  const handleSave = () => {
    const payload = {
        hierarchy: selections,
        imageCount: images.length,
        imageNames: images.map(f => f.name)
    };
    alert(`Submission Complete:\n\n${JSON.stringify(payload, null, 2)}`);
  };

  // --- Render Login Screen ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
           <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md text-white">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
             </div>
           </div>
           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
             Inventory Manager
           </h2>
           <p className="mt-2 text-center text-sm text-gray-600">
             Please enter your access token to continue
           </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                  Access Token
                </label>
                <div className="mt-1">
                  <input
                    id="token"
                    name="token"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="Enter token..."
                  />
                </div>
              </div>

              {authError && (
                 <div className="rounded-md bg-red-50 p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{authError}</h3>
                        </div>
                    </div>
                </div>
              )}

              <div>
                <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full justify-center py-2.5"
                >
                  Verify Token
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Render App ---
  const isAllSelected = LEVEL_CONFIGS.every(cfg => selections[cfg.key] !== null);
  const totalSteps = LEVEL_CONFIGS.length;
  const currentStepCount = Object.values(selections).filter(Boolean).length;
  const progressPercent = Math.round((currentStepCount / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
             <div>
               <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inventory Manager</h1>
               <p className="text-xs text-gray-500 font-medium">New Item Entry</p>
             </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 pb-32">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel: Form */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                        Classification Details
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {LEVEL_CONFIGS.map((config, index) => {
                        const isDisabled = config.dependsOn 
                            ? !selections[config.dependsOn] 
                            : false;
                        
                        return (
                            <div key={config.key} className={isDisabled ? 'opacity-60' : ''}>
                                <SelectWithCreate
                                    label={config.label}
                                    options={options[config.key]}
                                    value={selections[config.key]}
                                    placeholder={config.placeholder}
                                    disabled={isDisabled}
                                    isLoading={loadingLevel === config.key}
                                    onChange={(val) => handleSelectionChange(config.key, val)}
                                    onCreate={(val) => handleCreate(config.key, val)}
                                />
                            </div>
                        );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                     <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                        Media Assets
                    </h2>
                    <ImageUpload onImagesChange={setImages} />
                </div>
            </div>

            {/* Right Panel: Summary & Status */}
            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Entry Status</h3>
                    
                    {/* Progress */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-500">Completion</span>
                            <span className="font-semibold text-gray-900">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        {LEVEL_CONFIGS.map(cfg => (
                            <div key={cfg.key} className="flex items-center gap-3 text-sm">
                                <div className={`w-2 h-2 rounded-full ${selections[cfg.key] ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                <span className={selections[cfg.key] ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                                    {cfg.label}
                                </span>
                                {selections[cfg.key] && (
                                    <span className="ml-auto text-xs text-gray-500 truncate max-w-[100px]">{selections[cfg.key]}</span>
                                )}
                            </div>
                        ))}
                         <div className="flex items-center gap-3 text-sm mt-2 pt-2 border-t border-gray-50">
                                <div className={`w-2 h-2 rounded-full ${images.length > 0 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                <span className={images.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                                    Images
                                </span>
                                {images.length > 0 && (
                                    <span className="ml-auto text-xs text-gray-500">{images.length} files</span>
                                )}
                         </div>
                    </div>

                    <div className="space-y-3">
                         <Button 
                            variant="primary" 
                            disabled={!isAllSelected}
                            onClick={handleSave}
                            className="w-full justify-center"
                         >
                            Complete Entry
                         </Button>
                         <Button variant="secondary" onClick={() => window.location.reload()} className="w-full justify-center">
                            Reset Form
                         </Button>
                    </div>
                 </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;