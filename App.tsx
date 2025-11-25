
import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Sparkles, ChevronRight, RefreshCw, Mic, AlertCircle, ArrowRight, User, Target, BarChart3, MoveRight, MapPin, Search, Compass, ExternalLink, Globe, Star, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeCV, discoverJobs, generateInterviewFeedback } from './services/gemini';
import { AnalysisResult, AppState, DiscoveryResult, JobOpportunity, AppLanguage, InterviewFeedback } from './types';
import InterviewSession from './components/InterviewSession';
import { translations } from './translations';

const App: React.FC = () => {
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [interviewLanguage, setInterviewLanguage] = useState<AppLanguage>('en');
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [location, setLocation] = useState<string>('');
  const [careerFocus, setCareerFocus] = useState<string>('');
  
  // Data States
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [interviewFeedback, setInterviewFeedback] = useState<InterviewFeedback | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'beautiful' | 'ats'>('beautiful');

  const t = translations[language];

  // Sync interview language with app language by default when app language changes
  useEffect(() => {
    setInterviewLanguage(language);
  }, [language]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setCvFile(file);
        setError(null);
      } else {
        setError(t.error_pdf_only);
      }
    }
  };

  const startDiscovery = async () => {
    if (!cvFile) {
      setError(t.error_no_cv);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Pass the current app language to the service
      const result = await discoverJobs(cvFile, location, careerFocus, language);
      setDiscoveryResult(result);
      setAppState(AppState.DISCOVERY);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to search for jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  const startAnalysis = async (job: JobOpportunity) => {
    if (!cvFile) return;
    
    setSelectedJob(job);
    setAppState(AppState.ANALYZING);
    setIsLoading(true);
    
    // We use the snippet + title as the "JD" for the analysis
    const simulatedJD = `
      Title: ${job.title}
      Company: ${job.company}
      Location: ${job.location}
      Description: ${job.snippet}
    `;

    try {
      const result = await analyzeCV(cvFile, simulatedJD);
      setAnalysis(result);
      setAppState(AppState.RESULTS);
      setActiveTab('beautiful');
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during specific job analysis.');
      setAppState(AppState.DISCOVERY);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewEnd = async (transcript: {role: string, text: string}[]) => {
     if (transcript.length === 0) {
       setAppState(AppState.RESULTS);
       return;
     }

     setIsLoading(true);
     try {
       // We use the app language for the report so the user can read it, even if interview was in another language
       const feedback = await generateInterviewFeedback(transcript, language);
       setInterviewFeedback(feedback);
       setAppState(AppState.INTERVIEW_FEEDBACK);
     } catch (err: any) {
       console.error("Failed to generate feedback", err);
       setAppState(AppState.RESULTS); // Fallback
     } finally {
       setIsLoading(false);
     }
  };

  const resetApp = () => {
     setAppState(AppState.ONBOARDING);
     setDiscoveryResult(null);
     setAnalysis(null);
     setSelectedJob(null);
     setInterviewFeedback(null);
     setError(null);
  };

  const toggleLanguage = () => {
    if (language === 'en') setLanguage('fr');
    else if (language === 'fr') setLanguage('zh');
    else setLanguage('en');
  };

  const getLanguageLabel = (lang: AppLanguage) => {
    if (lang === 'en') return 'English';
    if (lang === 'fr') return 'Français';
    return '中文';
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Navbar - Minimalist */}
      <nav className="border-b border-zinc-100 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetApp}>
            <div className="bg-black text-white p-2 rounded-md transition-transform group-hover:scale-105">
              <Sparkles size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline">{t.nav_title}</span>
          </div>
          
          <div className="flex items-center gap-6">
             <button 
               onClick={toggleLanguage}
               className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black transition-colors"
             >
                <Globe size={16} />
                <span>{getLanguageLabel(language)}</span>
             </button>

             {appState !== AppState.ONBOARDING && (
               <button 
                onClick={resetApp}
                className="text-sm font-medium text-zinc-500 hover:text-black flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={14} /> <span className="hidden sm:inline">{t.new_session}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-white/90 z-[60] flex flex-col items-center justify-center space-y-8 animate-fade-in backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-zinc-200 border-t-black rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">AI Coach</h2>
              <p className="text-zinc-400 font-light">
                {appState === AppState.ONBOARDING ? t.loading_discovery : 
                 appState === AppState.ANALYZING ? t.loading_analysis :
                 t.loading_feedback}
              </p>
            </div>
          </div>
        )}

        {/* State: ONBOARDING */}
        {appState === AppState.ONBOARDING && !isLoading && (
          <div className="max-w-3xl mx-auto space-y-12 animate-fade-in pt-8">
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-tight whitespace-pre-line">
                {t.hero_title}
              </h1>
              <p className="text-xl text-zinc-500 font-light max-w-xl mx-auto">
                {t.hero_subtitle}
              </p>
            </div>

            <div className="space-y-12">
              {/* File Input */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-bold">1</span>
                   <label className="text-sm font-bold uppercase tracking-widest text-zinc-900">{t.step_1}</label>
                </div>
                
                <div className={`relative border border-dashed rounded-xl p-6 text-center transition-all duration-300 group ${cvFile ? 'border-black bg-zinc-50' : 'border-zinc-300 hover:border-black hover:bg-zinc-50'}`}>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="cv-upload" 
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-3">
                    {cvFile ? (
                      <>
                        <div className="bg-black text-white p-2 rounded-full">
                          <CheckCircle size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{cvFile.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{t.ready_scanning}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-zinc-100 p-3 rounded-full group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Upload className="w-5 h-5 text-zinc-400 group-hover:text-black" />
                        </div>
                        <div>
                           <p className="font-medium text-sm">{t.drop_pdf}</p>
                           <p className="text-xs text-zinc-400 mt-0.5">{t.click_browse}</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-bold">2</span>
                   <label className="text-sm font-bold uppercase tracking-widest text-zinc-900">{t.step_2}</label>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="text" 
                      placeholder={t.placeholder_location}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-zinc-200 focus:border-black focus:ring-1 focus:ring-black outline-none bg-zinc-50 focus:bg-white"
                    />
                  </div>
                   <div className="relative">
                    <Compass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="text" 
                      placeholder={t.placeholder_role}
                      value={careerFocus}
                      onChange={(e) => setCareerFocus(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-zinc-200 focus:border-black focus:ring-1 focus:ring-black outline-none bg-zinc-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {error && (
                <div className="flex items-center gap-3 text-zinc-900 bg-zinc-100 p-4 rounded-lg border border-zinc-200 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              
              <button
                onClick={startDiscovery}
                disabled={!cvFile}
                className="w-full bg-black hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-4 text-lg tracking-wide"
              >
                {t.btn_scan} <Search size={20} />
              </button>
            </div>
          </div>
        )}

        {/* State: DISCOVERY (New Feature) */}
        {appState === AppState.DISCOVERY && discoveryResult && (
           <div className="space-y-12 animate-fade-in pb-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 pb-8">
                 <div>
                    <h2 className="text-3xl font-extrabold tracking-tight mb-2">{t.market_analysis}</h2>
                    <p className="text-zinc-500">{discoveryResult.marketInsights}</p>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono border border-zinc-100 px-3 py-1 rounded bg-zinc-50">
                    <MapPin size={14} /> {location || 'Global'}
                 </div>
              </div>

              {/* Career Paths */}
              <div>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                    <Compass size={16} /> {t.suggested_paths}
                 </h3>
                 <div className="grid md:grid-cols-3 gap-6">
                    {discoveryResult.suggestedPaths.map((path, idx) => (
                       <div key={idx} className="bg-black text-white p-6 rounded-xl flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                          <div>
                             <h4 className="font-bold text-xl mb-3">{path.title}</h4>
                             <p className="text-zinc-400 text-sm leading-relaxed mb-4">{path.description}</p>
                          </div>
                          <div className="border-t border-white/20 pt-4 mt-2">
                             <p className="text-xs font-mono text-zinc-500 uppercase">{t.match_reason}</p>
                             <p className="text-xs text-zinc-300 mt-1">{path.matchReason}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Found Jobs */}
              <div>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                    <Search size={16} /> {t.live_opportunities}
                 </h3>
                 <div className="grid gap-4">
                    {discoveryResult.foundJobs.map((job, idx) => (
                       <div key={idx} className="bg-white border border-zinc-200 p-6 rounded-xl hover:border-black transition-all group flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                          <div className="flex-1 space-y-2">
                             <div className="flex flex-wrap items-center gap-3">
                                <h4 className="font-bold text-lg">{job.title}</h4>
                                <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-xs font-bold uppercase whitespace-nowrap">{job.company}</span>
                             </div>
                             <p className="text-sm text-zinc-500 flex items-center gap-4">
                                <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                             </p>
                             <p className="text-sm text-zinc-600 line-clamp-2 max-w-2xl">{job.snippet}</p>
                             {job.url ? (
                               <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 font-medium">
                                 {t.view_listing} <ExternalLink size={10} />
                               </a>
                             ) : (
                               <span className="text-xs text-zinc-400 italic">{t.source_unavailable}</span>
                             )}
                          </div>
                          <button 
                             onClick={() => startAnalysis(job)}
                             className="shrink-0 bg-white border-2 border-black text-black px-6 py-3 rounded-lg font-bold text-sm hover:bg-black hover:text-white transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                          >
                             {t.btn_improve_cv} <ArrowRight size={16} />
                          </button>
                       </div>
                    ))}
                    {discoveryResult.foundJobs.length === 0 && (
                      <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-300">
                        <p className="text-zinc-500">{t.no_jobs_found}</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* State: RESULTS */}
        {appState === AppState.RESULTS && analysis && selectedJob && (
          <div className="space-y-16 animate-fade-in pb-20">
            
            {/* Context Header */}
            <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-400 tracking-widest mb-1">
                    <Target size={12} /> {t.optimizing_for}
                  </div>
                  <h2 className="text-xl font-bold">{selectedJob.title} at {selectedJob.company}</h2>
                </div>
                <button 
                  onClick={() => setAppState(AppState.DISCOVERY)}
                  className="text-sm underline text-zinc-500 hover:text-black"
                >
                  {t.change_job}
                </button>
            </div>
            
            {/* Header / Score Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column: Score */}
              <div className="lg:col-span-4 space-y-8">
                <div className="p-8 border border-zinc-200 rounded-2xl flex flex-col items-center text-center space-y-6">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-zinc-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path className="text-black" strokeDasharray={`${analysis.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-extrabold tracking-tighter">{analysis.score}</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-1">{t.match_score}</span>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-4">
                    {analysis.scoreBreakdown.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                          <span>{item.category}</span>
                          <span className="text-black">{item.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-black rounded-full" 
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                   <h3 className="font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                     <BarChart3 size={16} /> {t.analysis_label}
                   </h3>
                   <p className="text-zinc-600 text-sm leading-relaxed">
                      {analysis.candidateAnalysis}
                   </p>
                </div>
              </div>

              {/* Right Column: Suggested Summary & Advice */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                
                {/* Profile Summary - High Contrast */}
                <div className="bg-black text-white rounded-2xl p-8 lg:p-10 shadow-xl shadow-zinc-200">
                   <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className="bg-white/20 p-2 rounded-lg"><User size={20} /></div>
                         <h3 className="font-bold text-lg tracking-tight">{t.suggested_header}</h3>
                      </div>
                      <span className="px-3 py-1 bg-white text-black text-xs font-bold uppercase rounded-full">
                        {t.top_priority}
                      </span>
                   </div>
                   <p className="text-lg lg:text-xl font-medium leading-relaxed opacity-90 italic font-serif">
                     "{analysis.suggestedProfileSummary}"
                   </p>
                </div>

                {/* Improvements Grid */}
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-2 h-2 bg-black rounded-full"></span>
                    {t.critical_improvements}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.improvements.map((item, index) => (
                      <div key={index} className="p-6 border border-zinc-200 rounded-xl hover:border-black transition-colors bg-white group">
                        <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold uppercase tracking-widest mb-3 group-hover:bg-black group-hover:text-white transition-colors">
                          {item.category}
                        </span>
                        <p className="text-zinc-800 text-sm font-medium leading-relaxed">
                          {item.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Versions Tabs */}
            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
               <div className="flex border-b border-zinc-200">
                <button
                  onClick={() => setActiveTab('beautiful')}
                  className={`flex-1 py-5 text-center font-bold text-sm uppercase tracking-widest transition-all
                    ${activeTab === 'beautiful' ? 'bg-black text-white' : 'bg-white text-zinc-400 hover:text-black'}`}
                >
                   {t.tab_beautiful}
                </button>
                <button
                  onClick={() => setActiveTab('ats')}
                  className={`flex-1 py-5 text-center font-bold text-sm uppercase tracking-widest transition-all
                    ${activeTab === 'ats' ? 'bg-black text-white' : 'bg-white text-zinc-400 hover:text-black'}`}
                >
                   {t.tab_ats}
                </button>
              </div>

              <div className="p-8 lg:p-12 min-h-[500px] bg-white">
                {activeTab === 'beautiful' ? (
                  <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 pb-6">
                       <h4 className="text-2xl font-serif font-medium italic">{analysis.beautifulVersion.title}</h4>
                       <div className="flex gap-2">
                        {analysis.beautifulVersion.designTips.slice(0,3).map((tip, i) => (
                          <span key={i} className="px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs text-zinc-600 font-medium">{tip}</span>
                        ))}
                      </div>
                     </div>
                     <div className="prose prose-zinc prose-headings:font-bold prose-headings:tracking-tight prose-a:text-black max-w-none">
                        <ReactMarkdown>{analysis.beautifulVersion.content}</ReactMarkdown>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 pb-6">
                      <h4 className="text-xl font-mono font-bold tracking-tight">{analysis.atsVersion.title}</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.atsVersion.keywordsIncluded.slice(0,5).map((kw, i) => (
                          <span key={i} className="px-2 py-1 border border-zinc-800 text-zinc-900 rounded-sm text-xs font-mono uppercase">+{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div className="font-mono text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap bg-zinc-50 p-8 rounded-lg border border-zinc-200">
                      <ReactMarkdown>{analysis.atsVersion.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Step: Interview */}
            <div className="border border-zinc-200 rounded-2xl p-10 md:p-16 text-center space-y-8 bg-zinc-50">
              <div className="inline-flex p-5 bg-white border border-zinc-200 rounded-full shadow-sm">
                <Mic className="text-black w-8 h-8" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">{t.prepare_interview}</h2>
                <p className="text-zinc-500 max-w-lg mx-auto">
                  {t.prepare_interview_desc}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t.select_interview_lang}</span>
                <div className="flex gap-2 bg-white p-1 rounded-full border border-zinc-200">
                  {(['en', 'fr', 'zh'] as AppLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setInterviewLanguage(lang)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        interviewLanguage === lang 
                          ? 'bg-black text-white shadow-md' 
                          : 'bg-transparent text-zinc-500 hover:text-black'
                      }`}
                    >
                      {getLanguageLabel(lang)}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setAppState(AppState.INTERVIEW)}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-full font-bold tracking-wide overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">{t.btn_start_sim} <MoveRight size={18} /></span>
                <div className="absolute inset-0 bg-zinc-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </button>
            </div>

          </div>
        )}

        {/* State: INTERVIEW */}
        {appState === AppState.INTERVIEW && analysis && (
          <div className="max-w-5xl mx-auto animate-fade-in pb-10">
            <button 
              onClick={() => setAppState(AppState.RESULTS)}
              className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-black transition-colors font-medium text-sm uppercase tracking-wider"
            >
              <ChevronRight size={14} className="rotate-180" /> {t.back_analysis}
            </button>
            
            <div className="h-[80vh] border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl">
               <InterviewSession 
                  contextSummary={analysis.candidateAnalysis} 
                  jobDescription={selectedJob ? `${selectedJob.title} at ${selectedJob.company}` : ''} 
                  language={interviewLanguage}
                  onEndSession={handleInterviewEnd}
               />
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-4">
                 <h3 className="font-bold text-lg border-b border-black pb-2 inline-block">{t.prep_notes}</h3>
                 <p className="text-zinc-500 leading-relaxed">
                   {t.prep_notes_desc}
                 </p>
               </div>
               <ul className="space-y-4">
                  {analysis.interviewPrepPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-4 text-zinc-800">
                      <span className="font-mono text-zinc-300 font-bold">0{i+1}</span>
                      <span>{point}</span>
                    </li>
                  ))}
               </ul>
            </div>
          </div>
        )}

        {/* State: INTERVIEW FEEDBACK */}
        {appState === AppState.INTERVIEW_FEEDBACK && interviewFeedback && (
          <div className="max-w-5xl mx-auto animate-fade-in pb-20">
             <button 
              onClick={() => setAppState(AppState.RESULTS)}
              className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-black transition-colors font-medium text-sm uppercase tracking-wider"
            >
              <ChevronRight size={14} className="rotate-180" /> {t.back_to_results}
            </button>

             <h2 className="text-3xl font-bold mb-8">{t.report_title}</h2>

             {/* Top Stats */}
             <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="p-8 bg-black text-white rounded-xl flex flex-col justify-center items-center text-center">
                   <div className="text-5xl font-bold mb-2">{interviewFeedback.overallScore}</div>
                   <div className="text-xs uppercase tracking-widest opacity-70">{t.report_score}</div>
                </div>
                <div className="p-8 border border-zinc-200 rounded-xl bg-zinc-50">
                    <h3 className="font-bold uppercase text-xs tracking-widest text-zinc-500 mb-4">{t.tone_analysis}</h3>
                    <p className="text-xl font-medium">{interviewFeedback.toneAnalysis}</p>
                </div>
                 <div className="p-8 border border-zinc-200 rounded-xl bg-white">
                    <h3 className="font-bold uppercase text-xs tracking-widest text-zinc-500 mb-4">{t.strengths}</h3>
                    <ul className="space-y-2">
                      {interviewFeedback.strengths.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                           <CheckCircle size={14} className="text-black" /> {s}
                        </li>
                      ))}
                    </ul>
                </div>
             </div>

             {/* Detailed Q&A Analysis */}
             <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
               <MessageSquare size={20} /> {t.qa_breakdown}
             </h3>
             <div className="space-y-8">
                {interviewFeedback.qaFeedback.map((item, i) => (
                  <div key={i} className="border border-zinc-200 rounded-2xl p-6 md:p-8 bg-white shadow-sm">
                     <div className="mb-6 pb-6 border-b border-zinc-100">
                        <p className="font-medium text-lg text-black mb-2">"{item.question}"</p>
                     </div>
                     
                     <div className="grid md:grid-cols-2 gap-8">
                        <div>
                           <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{t.user_said}</div>
                           <p className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-lg italic">"{item.userAnswer}"</p>
                           
                           <div className="mt-4">
                              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{t.feedback}</div>
                              <p className="text-sm text-zinc-800 font-medium">{item.critique}</p>
                           </div>
                        </div>

                        <div>
                           <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 text-black">{t.better_answer}</div>
                           <div className="p-4 bg-black text-white rounded-lg text-sm leading-relaxed">
                              {item.improvedVersion}
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Bottom Action */}
             <div className="mt-12 flex justify-center gap-4">
                 <button 
                   onClick={() => setAppState(AppState.RESULTS)}
                   className="px-8 py-4 border border-zinc-300 rounded-full font-bold hover:bg-zinc-50"
                 >
                   {t.back_to_results}
                 </button>
                 <button 
                   onClick={() => setAppState(AppState.INTERVIEW)}
                   className="px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-zinc-800"
                 >
                   {t.retry_interview}
                 </button>
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
