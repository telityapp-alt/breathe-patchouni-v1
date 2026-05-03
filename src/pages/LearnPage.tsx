import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { BookOpen, PlayCircle, Lightbulb, Bookmark, ArrowLeft, Share2, CheckCircle2, ThumbsUp, Heart, Share, ChevronRight, Activity, Brain } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { LEARN_CATALOG, LearnContent } from '../data/learnContent';
import { cn } from '../lib/utils';

export function LearnPage() {
  const { state, updateProfile } = useAppContext();
  const profile = state.profile;
  const [activeTab, setActiveTab] = useState<'All'|'Saved'>('All');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedContent, setSelectedContent] = useState<LearnContent | null>(null);

  if (!profile) return null;

  const currentDay = differenceInDays(new Date(), new Date(profile.quitDate));
  const bookmarkedIds = profile.bookmarkedArticles || [];
  const readIds = profile.readArticles || [];

  const handleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newBookmarks = bookmarkedIds.includes(id) 
      ? bookmarkedIds.filter(x => x !== id)
      : [...bookmarkedIds, id];
    updateProfile({ bookmarkedArticles: newBookmarks });
  };

  const handleMarkRead = (id: string) => {
    if (!readIds.includes(id)) {
      updateProfile({ readArticles: [...readIds, id] });
    }
  };

  const rankedContent = useMemo(() => {
    return [...LEARN_CATALOG].map(item => {
      let score = 0;
      if (item.methodRelevance && profile.quitMethod && item.methodRelevance.includes(profile.quitMethod)) score += 20;
      if (item.stageRelevance) {
         if (currentDay >= item.stageRelevance[0] && currentDay <= item.stageRelevance[1]) score += 30;
      }
      if (item.triggerRelevance && profile.primaryTriggers) {
         if (item.triggerRelevance.some(t => profile.primaryTriggers.includes(t))) score += 15;
      }
      if (readIds.includes(item.id)) score -= 100;
      return { ...item, score };
    }).sort((a,b) => b.score - a.score);
  }, [profile, currentDay, readIds]);

  const featuredContent = rankedContent[0];
  
  const displayContent = useMemo(() => {
    let list = activeTab === 'Saved' ? rankedContent.filter(c => bookmarkedIds.includes(c.id)) : rankedContent;
    if (activeFilter !== 'All') {
      list = list.filter(c => c.type === activeFilter);
    }
    return list;
  }, [rankedContent, activeTab, bookmarkedIds, activeFilter]);

  if (selectedContent) {
     return <ContentPage 
        content={selectedContent} 
        onBack={() => { setSelectedContent(null); handleMarkRead(selectedContent.id); }} 
        isBookmarked={bookmarkedIds.includes(selectedContent.id)}
        onToggleBookmark={(e) => handleBookmark(e, selectedContent.id)}
     />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-24 overflow-y-auto w-full relative">
      <header className="p-4 pt-6 bg-white border-b border-gray-200 sticky top-0 z-10">
         <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
               Learn <Brain className="w-5 h-5 text-brand" />
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Science-based education & stories</p>
         </div>
         <div className="flex gap-4">
            <button 
               className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'All' ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
               onClick={() => setActiveTab('All')}
            >Library</button>
            <button 
               className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'Saved' ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
               onClick={() => setActiveTab('Saved')}
            >Saved {bookmarkedIds.length > 0 && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md text-[10px]">{bookmarkedIds.length}</span>}</button>
         </div>
      </header>

      <div className="p-4 space-y-4">
         {activeTab === 'All' && featuredContent && !readIds.includes(featuredContent.id) && (
            <div className="space-y-2">
               <h3 className="font-bold text-gray-800 text-sm ml-1 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500"/> Featured Today</h3>
               <div 
                  className="bg-brand text-white rounded-2xl p-4 shadow-sm cursor-pointer border-brand-dark border-2 hover:-translate-y-1 transition-transform relative overflow-hidden"
                  style={{boxShadow: '0 4px 0 var(--color-brand-dark)'}}
                  onClick={() => setSelectedContent(featuredContent)}
               >
                  <div className="relative z-10 space-y-2">
                     <div className="flex justify-between items-start">
                        <span className="text-xs font-bold bg-black/20 px-2 py-1 rounded-md">
                           Day {currentDay} Guide
                        </span>
                        <button onClick={(e) => handleBookmark(e, featuredContent.id)} className="p-1 -mr-2 -mt-2">
                           <Bookmark className={`w-5 h-5 ${bookmarkedIds.includes(featuredContent.id) ? 'fill-white text-white' : 'text-white/70'}`} />
                        </button>
                     </div>
                     <h2 className="text-lg font-bold leading-tight">{featuredContent.title}</h2>
                     <p className="text-sm font-medium text-brand-surface opacity-90">{featuredContent.shortDesc}</p>
                     <div className="text-xs font-bold text-brand-surface/80 flex items-center gap-1">
                        {featuredContent.durationStr}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Filter Tabs */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {['All', 'Stories', 'Doctor Talks', 'Micro-Lessons', 'Science Bites', 'Reads'].map(filter => (
               <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn("shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer", 
                    activeFilter === filter 
                    ? "bg-brand/10 text-brand border-brand" 
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  )}
               >
                  {filter}
               </button>
            ))}
         </div>

         {/* Content List */}
         <div className="space-y-3">
            {displayContent.map(content => (
               <ListCard 
                  key={content.id} 
                  content={content} 
                  isBookmarked={bookmarkedIds.includes(content.id)}
                  isRead={readIds.includes(content.id)}
                  onToggleBookmark={(e) => handleBookmark(e, content.id)}
                  onClick={() => setSelectedContent(content)}
               />
            ))}
            {displayContent.length === 0 && (
               <div className="text-center py-8 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium text-sm">No items found</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}

// --- List Card ---
const ListCard: React.FC<{ content: LearnContent, isBookmarked: boolean, isRead: boolean, onToggleBookmark: (e: React.MouseEvent) => void, onClick: () => void }> = ({ content, isBookmarked, isRead, onToggleBookmark, onClick }) => {
   const getTypeConfig = (type: string) => {
      switch(type) {
         case 'Story': return { color: 'text-brand', bg: 'bg-brand/10' };
         case 'Doctor Talks': return { color: 'text-blue-500', bg: 'bg-blue-50' };
         case 'Micro-Lessons': return { color: 'text-amber-500', bg: 'bg-amber-50' };
         case 'Science Bites': return { color: 'text-purple-500', bg: 'bg-purple-50' };
         case 'Reads': return { color: 'text-gray-600', bg: 'bg-gray-100' };
         default: return { color: 'text-gray-500', bg: 'bg-gray-100' };
      }
   };
   const config = getTypeConfig(content.type);

   return (
      <div 
         onClick={onClick}
         className={`bg-white rounded-2xl p-3 cursor-pointer shadow-sm border-2 border-gray-200 flex gap-3 ${isRead ? 'opacity-75 bg-gray-50' : 'hover:border-gray-300'} transition-colors`}
         style={{boxShadow: '0 4px 0 #E5E7EB'}}
      >
         <div className="flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                  {content.type}
               </span>
               <button onClick={onToggleBookmark} className="p-1 -mr-1 -mt-1 z-10 active:scale-95">
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-gray-900 text-gray-900' : 'text-gray-300 hover:text-gray-500'}`} />
               </button>
            </div>
            
            <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{content.title}</h3>
            
            {content.type === 'Doctor Talks' ? (
               <div className="flex items-center gap-1 mb-2 text-xs font-medium text-gray-600">
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[8px]">DR</div>
                  <span>{content.doctorName} • {content.doctorSpecialty?.split(' ')[0]}</span>
               </div>
            ) : content.type === 'Story' ? (
               <div className="mb-2 text-xs font-medium text-gray-600 line-clamp-1">
                  "{content.storyContent?.hook}"
               </div>
            ) : content.type === 'Science Bites' ? (
               <div className="mb-2 text-base font-bold text-purple-600">{content.scienceStat}</div>
            ) : (
               <p className="text-xs text-gray-500 font-medium mb-3 line-clamp-2">{content.shortDesc}</p>
            )}

            <div className="flex justify-between items-center mt-2">
               <span className="text-[10px] font-bold text-gray-400">{content.durationStr}</span>
               {isRead && <span className="text-[10px] font-bold text-brand flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Done</span>}
            </div>
         </div>
      </div>
   );
}


function ContentPage({ content, onBack, isBookmarked, onToggleBookmark }: { content: LearnContent, onBack: () => void, isBookmarked: boolean, onToggleBookmark: (e: React.MouseEvent) => void }) {
   if (content.type === 'Story') return <StoryPage content={content} onBack={onBack} />;
   if (content.type === 'Doctor Talks') return <DoctorPage content={content} onBack={onBack} />;
   if (content.type === 'Micro-Lessons') return <MicroLessonPage content={content} onBack={onBack} />;
   if (content.type === 'Science Bites') return <ScienceBitePage content={content} onBack={onBack} />;
   if (content.type === 'Reads') return <ArticlePage content={content} onBack={onBack} />;
   return null;
}

function TopNav({ onBack, title }: { onBack: () => void, title?: string }) {
   return (
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
         <button onClick={onBack} className="w-8 h-8 flex flex-col justify-center items-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-900" />
         </button>
         {title && <span className="text-sm font-bold text-gray-800 truncate px-4">{title}</span>}
         <div className="w-8"></div>
      </div>
   )
}

function StoryPage({ content, onBack }: { content: LearnContent, onBack: () => void }) {
   return (
      <div className="min-h-screen bg-gray-50 pb-24 text-gray-900">
         <TopNav onBack={onBack} title="Survivor Story" />
         <div className="p-4 max-w-md mx-auto space-y-6 mt-2">
            <header className="space-y-3">
               <h1 className="text-2xl font-bold leading-tight text-gray-900">{content.title}</h1>
               <div className="flex flex-col gap-1 text-xs font-bold text-gray-500 border-l-2 border-brand pl-3">
                  <span className="text-gray-800">{content.authorName}</span>
                  <span>Smoked {content.yearsSmoking} yr • Used {content.quitMethod}</span>
               </div>
            </header>

            <article className="space-y-4">
               <p className="text-base font-bold text-gray-700 leading-relaxed">
                  {content.storyContent?.hook}
               </p>
               <p className="text-sm leading-relaxed text-gray-600 font-medium">
                  {content.storyContent?.middle}
               </p>
               <p className="text-sm leading-relaxed text-gray-600 font-medium">
                  {content.storyContent?.present}
               </p>
            </article>

            <div className="bg-white border-2 border-gray-200 p-4 rounded-2xl shadow-sm mt-8">
               <h4 className="text-xs font-bold text-brand mb-2">Core Insight</h4>
               <p className="font-medium text-gray-700 leading-relaxed text-sm">
                  {content.storyContent?.insight}
               </p>
            </div>

            <div className="flex gap-3 pt-6">
               <button className="flex-1 flex justify-center items-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold text-sm active:scale-95 border-2 border-gray-200 shadow-sm transition-all" style={{boxShadow: '0 4px 0 #E5E7EB'}}>
                  <Heart className="w-4 h-4" /> Relate
               </button>
               <button className="flex-1 flex justify-center items-center gap-2 bg-brand text-white py-3 rounded-2xl font-bold text-sm active:scale-95 border-2 border-brand-dark transition-all" style={{boxShadow: '0 4px 0 var(--color-brand-dark)'}}>
                  <Share className="w-4 h-4" /> Share
               </button>
            </div>
         </div>
      </div>
   )
}

function DoctorPage({ content, onBack }: { content: LearnContent, onBack: () => void }) {
   return (
      <div className="min-h-screen bg-gray-50 pb-24">
         <TopNav onBack={onBack} title="Clinical Insights" />
         <div className="w-full aspect-video bg-gray-900 flex items-center justify-center relative">
            <PlayCircle className="w-12 h-12 text-white/50" />
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md font-bold">{content.durationStr}</div>
         </div>

         <div className="p-4 space-y-5 max-w-md mx-auto">
            <div>
               <h1 className="text-xl font-bold text-gray-900 mb-3">{content.title}</h1>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 border-2 border-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                     DR
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-gray-900">{content.doctorName}</h3>
                     <p className="text-xs font-medium text-blue-600">{content.doctorSpecialty}</p>
                  </div>
               </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 shadow-sm">
               <h4 className="text-xs font-bold text-blue-500 mb-1">Key Takeaway</h4>
               <p className="text-sm font-bold text-blue-900 leading-relaxed">{content.keyTakeaway}</p>
            </div>

            <div>
               <h4 className="font-bold text-gray-900 mb-2 text-sm">Transcript</h4>
               <p className="text-sm font-medium text-gray-600 leading-relaxed">{content.transcript}</p>
            </div>
         </div>
      </div>
   )
}

function MicroLessonPage({ content, onBack }: { content: LearnContent, onBack: () => void }) {
   const [step, setStep] = useState(0);
   const totalSteps = (content.swipeCards?.length || 0) + 1;

   if (!content.swipeCards) return null;

   const isReflection = step === content.swipeCards.length;

   return (
      <div className="fixed inset-0 bg-white text-gray-900 flex flex-col z-50">
         <div className="flex gap-1 p-4 bg-white border-b border-gray-100">
            {Array.from({length: totalSteps}).map((_, i) => (
               <div key={i} className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
                  {i <= step && <div className="h-full bg-brand w-full rounded-full"></div>}
               </div>
            ))}
            <button onClick={onBack} className="ml-2 w-6 h-6 flex justify-center items-center bg-gray-100 rounded-full">
               <ArrowLeft className="w-3 h-3 text-gray-500" />
            </button>
         </div>

         <div className="flex-1 flex items-center justify-center p-6 relative bg-gray-50">
            {!isReflection ? (
               <div className="max-w-md w-full p-6 bg-white border-2 border-gray-200 rounded-3xl shadow-sm text-center space-y-6 slide-up-anim" key={step} style={{boxShadow: '0 6px 0 #E5E7EB'}}>
                  <div className="w-16 h-16 bg-amber-100 border-2 border-amber-200 mx-auto rounded-2xl flex items-center justify-center">
                     <Brain className="w-8 h-8 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-bold leading-tight">{content.swipeCards[step].title}</h2>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">{content.swipeCards[step].desc}</p>
               </div>
            ) : (
               <div className="max-w-md w-full p-6 bg-white border-2 border-gray-200 rounded-3xl shadow-sm text-center space-y-4 slide-up-anim" style={{boxShadow: '0 6px 0 #E5E7EB'}}>
                  <h2 className="text-lg font-bold">Reflection</h2>
                  <p className="text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">{content.reflectionQuestion}</p>
                  <textarea 
                     className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-400 text-center min-h-[120px] focus:outline-none focus:border-brand font-medium text-sm transition-colors"
                     placeholder="Tap to type your answer..."
                  ></textarea>
               </div>
            )}
         </div>

         <div className="p-4 bg-white border-t border-gray-200">
            <button 
               onClick={() => {
                  if (isReflection) onBack(); else setStep(s => s + 1);
               }}
               className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl text-base active:scale-95 transition-all outline-none border-2 border-brand-dark"
               style={{boxShadow: '0 4px 0 var(--color-brand-dark)'}}
            >
               {isReflection ? 'Finish Lesson' : 'Next'}
            </button>
         </div>
      </div>
   )
}

function ScienceBitePage({ content, onBack }: { content: LearnContent, onBack: () => void }) {
   return (
      <div className="min-h-screen bg-purple-50 pb-24 flex flex-col">
         <TopNav onBack={onBack} title="Science Bite" />
         <div className="flex flex-col items-center justify-center p-6 flex-1 w-full max-w-md mx-auto text-center space-y-4 mt-8">
            <div className="bg-white border-2 border-purple-200 p-8 rounded-3xl w-full shadow-sm" style={{boxShadow: '0 6px 0 #e9d5ff'}}>
               <h4 className="text-purple-600 font-bold text-xs mb-4 bg-purple-100 inline-block px-3 py-1 rounded-md">Fact</h4>
               <div className="text-6xl font-bold text-purple-600 leading-none tracking-tight mb-6">
                  {content.scienceStat}
               </div>
               <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                  {content.title}
               </h2>
               <p className="text-gray-600 font-medium leading-relaxed text-sm">
                  {content.scienceContext}
               </p>
            </div>
         </div>
         
         <div className="p-4 space-y-3 max-w-md w-full mx-auto">
            <button className="w-full bg-purple-600 text-white py-3.5 rounded-2xl border-2 border-purple-800 font-bold flex justify-center items-center gap-2 active:scale-95 transition-all" style={{boxShadow: '0 4px 0 #6b21a8'}}>
               <Share2 className="w-4 h-4"/> Share
            </button>
         </div>
      </div>
   )
}

function ArticlePage({ content, onBack }: { content: LearnContent, onBack: () => void }) {
   const [readProgress, setReadProgress] = useState(0);
   const scrollRef = useRef<HTMLDivElement>(null);

   const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadProgress(progress);
   };

   return (
      <div className="fixed inset-0 flex flex-col z-40 bg-white text-gray-900">
         <div className="relative sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <button onClick={onBack} className="w-8 h-8 flex justify-center items-center bg-gray-100 rounded-full hover:bg-gray-200">
               <ArrowLeft className="w-4 h-4 text-gray-900"/>
            </button>
            <span className="text-xs font-bold text-gray-500">{content.durationStr}</span>
            <div className="w-8"></div>
            <div className="absolute bottom-0 left-0 h-0.5 bg-brand transition-all" style={{ width: `${readProgress}%`}}></div>
         </div>
         
         <div className="flex-1 overflow-y-auto px-4 py-6" onScroll={handleScroll} ref={scrollRef}>
            <div className="max-w-md mx-auto pb-24">
               <h1 className="text-2xl font-bold leading-tight mb-6 text-gray-900">{content.title}</h1>
               <div className="space-y-6">
                  {content.readContent?.map((section, idx) => (
                     <div key={idx}>
                        <h2 className="text-lg font-bold mb-2 text-gray-800">{section.sectionTitle}</h2>
                        <div className="space-y-3">
                           {section.paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="text-sm font-medium text-gray-600 leading-relaxed">{p}</p>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   )
}

