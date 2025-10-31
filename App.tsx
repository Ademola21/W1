import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FeaturedMovie } from './components/FeaturedMovie';
import { MovieCard } from './components/MovieCard';
import { SearchOverlay } from './components/SearchOverlay';
import { GenreFilter } from './components/GenreFilter';
import { MovieDetails } from './components/MovieDetails';
import { mockMovies, genreList, newReleasesMovies } from './constants';
import type { Movie, UserProfile } from './types';
import { api } from './services/api';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ProfilePage } from './pages/ProfilePage';
import { Pagination } from './components/Pagination';
import { DownloaderPage } from './pages/DownloaderPage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { HowToDownloadPage } from './pages/HowToDownloadPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { FAQPage } from './pages/FAQPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { DMCAPage } from './pages/DMCAPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { ToastProvider } from './components/ToastNotifications';

export type Page = 'home' | 'movieDetails' | 'login' | 'signup' | 'profile' | 'downloader' | 'help' | 'howToDownload' | 'contact' | 'faq' | 'terms' | 'privacy' | 'dmca' | 'cookiePolicy';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMainGenre, setActiveMainGenre] = useState('All Popular');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [featuredMovieIndex, setFeaturedMovieIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [previousPage, setPreviousPage] = useState<Page>('home');
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('userProfile');
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('userProfile');
    return stored ? JSON.parse(stored) : null;
  });

  const [allMoviesPage, setAllMoviesPage] = useState(1);
  const MOVIES_PER_PAGE = 10;
  
  const [movies, setMovies] = useState<Movie[]>(mockMovies);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  
  const newReleasesSectionRef = useRef<HTMLElement>(null);
  const genreFilterSectionRef = useRef<HTMLElement>(null);
  const allMoviesSectionRef = useRef<HTMLElement>(null);
  const isMoviesSectionMounted = useRef(false);
  const homeScrollPositionRef = useRef(0);
  const isInitialMount = useRef(true);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoadingMovies(true);
        const response = await api.getMovies({ limit: 100 });
        if (response.movies && response.movies.length > 0) {
          setMovies(response.movies);
        }
      } catch (error) {
        console.error('Failed to fetch movies from API, using mock data:', error);
      } finally {
        setIsLoadingMovies(false);
      }
    };
    
    fetchMovies();
  }, []);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedMovieIndex(prevIndex => (prevIndex + 1) % movies.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [movies.length]);

  useEffect(() => {
    const isReturningHomeFromDetails = currentPage === 'home' && previousPage === 'movieDetails';

    if (isReturningHomeFromDetails && currentPage !== 'movieDetails') {
      // Use requestAnimationFrame to scroll before paint
      requestAnimationFrame(() => {
        window.scrollTo({ top: homeScrollPositionRef.current, behavior: 'auto' });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentPage, previousPage]);
  
  useEffect(() => {
    if (isMoviesSectionMounted.current && !isInitialMount.current) {
      allMoviesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      isMoviesSectionMounted.current = true;
    }
  }, [allMoviesPage]);

  useEffect(() => {
    setAllMoviesPage(1);
    if(activeMainGenre !== 'All Popular' && currentPage === 'home' && !isInitialMount.current) {
       genreFilterSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeMainGenre, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const navigate = useCallback((page: Page) => {
    setPreviousPage(currentPage);
    setCurrentPage(page);
    if (page !== 'movieDetails') {
        setSelectedMovie(null);
    }
  }, [currentPage]);

  const handleLogin = useCallback((credentials: { name: string; email: string }) => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const user = JSON.parse(stored);
      setUserProfile(user);
    } else {
      setUserProfile({
        name: credentials.name,
        email: credentials.email,
        avatarUrl: 'https://i.pravatar.cc/150?u=default',
      });
    }
    setIsAuthenticated(true);
    navigate('home');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setUserProfile(null);
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userId');
    navigate('home');
  }, [navigate]);

  const handleScrollToSection = useCallback((section: 'newReleases' | 'genres' | 'allMovies') => {
      const scroll = () => {
        let targetRef;
        if (section === 'newReleases') targetRef = newReleasesSectionRef;
        else if (section === 'genres') targetRef = genreFilterSectionRef;
        else if (section === 'allMovies') targetRef = allMoviesSectionRef;
        
        targetRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      
      if (currentPage !== 'home') {
        navigate('home');
        setTimeout(scroll, 300); // Delay to allow home page to render
      } else {
        scroll();
      }
  }, [currentPage, navigate]);
  
  const handleSelectMovie = useCallback((movie: Movie) => {
    if (currentPage === 'home') {
        homeScrollPositionRef.current = window.scrollY;
    }
    setSelectedMovie(movie);
    navigate('movieDetails');
  }, [navigate, currentPage]);
  
  const handleBack = useCallback(() => {
    const isStaticPage = ['help', 'howToDownload', 'contact', 'faq', 'terms', 'privacy', 'dmca', 'cookiePolicy'].includes(currentPage);
    if (isStaticPage) {
        navigate('home');
        return;
    }
    if (currentPage === 'downloader' || (currentPage === 'profile' && !isAuthenticated)) {
        navigate(previousPage === currentPage ? 'home' : previousPage);
    } else {
        navigate('home');
    }
  }, [currentPage, navigate, previousPage, isAuthenticated]);
  
  const handleDownloadClick = useCallback(() => {
      navigate('downloader');
  }, [navigate]);

  const featuredMovie = useMemo(() => movies[featuredMovieIndex % movies.length], [featuredMovieIndex, movies]);
  const trendingMovies = useMemo(() => movies, [movies]);

  const filteredMovies = useMemo(() => {
    if (!searchTerm) {
      return [];
    }
    return movies.filter(movie =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, movies]);

  const filteredByGenreMovies = useMemo(() => {
    if (activeMainGenre === 'All Popular') {
      return movies;
    }
    return movies.filter(movie => movie.genres.includes(activeMainGenre));
  }, [activeMainGenre, movies]);
  
  const isAuthPage = currentPage === 'login' || currentPage === 'signup';

  const paginatedMovies = useMemo(() => {
    const startIndex = (allMoviesPage - 1) * MOVIES_PER_PAGE;
    const endIndex = startIndex + MOVIES_PER_PAGE;
    return filteredByGenreMovies.slice(startIndex, endIndex);
  }, [allMoviesPage, filteredByGenreMovies]);

  const totalPages = Math.ceil(filteredByGenreMovies.length / MOVIES_PER_PAGE);

  const renderContent = () => {
    switch (currentPage) {
        case 'login': return <LoginPage onNavigate={navigate} onBack={handleBack} onLogin={handleLogin} />;
        case 'signup': return <SignUpPage onNavigate={navigate} onBack={handleBack} onLogin={handleLogin} />;
        case 'profile': 
            if (!isAuthenticated || !userProfile) {
                navigate('login');
                return null;
            }
            return <ProfilePage userProfile={userProfile} setUserProfile={setUserProfile} onNavigate={navigate} onBack={handleBack} theme={theme as 'light' | 'dark'} onThemeToggle={toggleTheme} onLogout={handleLogout} />;
        case 'downloader': return <DownloaderPage onBack={handleBack} />;
        case 'help': return <HelpCenterPage onBack={handleBack} />;
        case 'howToDownload': return <HowToDownloadPage onBack={handleBack} />;
        case 'contact': return <ContactUsPage onBack={handleBack} />;
        case 'faq': return <FAQPage onBack={handleBack} />;
        case 'terms': return <TermsOfServicePage onBack={handleBack} />;
        case 'privacy': return <PrivacyPolicyPage onBack={handleBack} />;
        case 'dmca': return <DMCAPage onBack={handleBack} />;
        case 'cookiePolicy': return <CookiePolicyPage onBack={handleBack} />;
        case 'movieDetails':
            if (selectedMovie) {
                return <MovieDetails movie={selectedMovie} userProfile={userProfile} onBack={handleBack} onDownloadClick={handleDownloadClick} onSelectMovie={handleSelectMovie} />;
            }
            navigate('home');
            return null;
        case 'home':
        default:
          return (
            <>
              <FeaturedMovie movie={featuredMovie} key={featuredMovie.id} onDownloadClick={handleDownloadClick} onDetailsClick={() => handleSelectMovie(featuredMovie)} />
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

                <section ref={newReleasesSectionRef}>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-text-primary mb-5">New Releases</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                    {newReleasesMovies.slice(0, 6).map((movie) => (
                      <MovieCard key={`${movie.id}-new`} movie={movie} onSelectMovie={handleSelectMovie} />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-text-primary mb-5">Trending Movies</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                    {trendingMovies.slice(0, 12).map((movie) => (
                      <MovieCard key={`${movie.id}-trending`} movie={movie} onSelectMovie={handleSelectMovie} />
                    ))}
                  </div>
                </section>
                
                <section ref={genreFilterSectionRef}>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-text-primary mb-5">Browse by Genre</h2>
                  <GenreFilter
                    genres={genreList}
                    activeGenre={activeMainGenre}
                    onGenreChange={setActiveMainGenre}
                  />
                </section>

                <section ref={allMoviesSectionRef}>
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-text-primary">All movies</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                    {paginatedMovies.map((movie) => (
                      <MovieCard key={`${movie.id}-all`} movie={movie} onSelectMovie={handleSelectMovie} />
                    ))}
                  </div>
                   {totalPages > 1 && (
                    <Pagination
                      currentPage={allMoviesPage}
                      totalPages={totalPages}
                      onPageChange={setAllMoviesPage}
                    />
                  )}
                </section>

              </div>
            </>
          );
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-transparent text-gray-900 dark:text-text-primary font-sans transition-colors duration-300">
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          movies={filteredMovies}
          onSelectMovie={handleSelectMovie}
        />
        {!isAuthPage && (
          <Header
            isAuthenticated={isAuthenticated}
            userProfile={userProfile}
            onSearchClick={() => setIsSearchOpen(true)}
            theme={theme as 'light' | 'dark'}
            onThemeToggle={toggleTheme}
            isDetailsPage={currentPage !== 'home'}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        )}
        <main>
          {renderContent()}
        </main>
        {!isAuthPage && <Footer onNavigate={navigate} onScrollToSection={handleScrollToSection} isAuthenticated={isAuthenticated} />}
      </div>
    </ToastProvider>
  );
};

export default App;
