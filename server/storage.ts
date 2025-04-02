import { 
  users, User, InsertUser, 
  categories, Category, InsertCategory,
  countries, Country, InsertCountry,
  channels, Channel, InsertChannel,
  programs, Program, InsertProgram,
  movies, Movie, InsertMovie,
  series, Series, InsertSeries,
  episodes, Episode, InsertEpisode,
  StreamSource
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Country operations
  getCountries(): Promise<Country[]>;
  getCountry(id: number): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;
  updateCountry(id: number, country: Partial<InsertCountry>): Promise<Country | undefined>;
  deleteCountry(id: number): Promise<boolean>;
  
  // Channel operations
  getChannels(): Promise<Channel[]>;
  getChannel(id: number): Promise<Channel | undefined>;
  getChannelsByCategory(categoryId: number): Promise<Channel[]>;
  getChannelsByCountry(countryId: number): Promise<Channel[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: number, channel: Partial<InsertChannel>): Promise<Channel | undefined>;
  deleteChannel(id: number): Promise<boolean>;
  
  // Program operations
  getCurrentPrograms(): Promise<Program[]>;
  getChannelPrograms(channelId: number): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;
  
  // Movie operations
  getMovies(): Promise<Movie[]>;
  getMovie(id: number): Promise<Movie | undefined>;
  getMoviesByCategory(categoryId: number): Promise<Movie[]>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: number, movie: Partial<InsertMovie>): Promise<Movie | undefined>;
  deleteMovie(id: number): Promise<boolean>;
  
  // Series operations
  getAllSeries(): Promise<Series[]>;
  getSeries(id: number): Promise<Series | undefined>;
  getSeriesByCategory(categoryId: number): Promise<Series[]>;
  createSeries(series: InsertSeries): Promise<Series>;
  updateSeries(id: number, series: Partial<InsertSeries>): Promise<Series | undefined>;
  deleteSeries(id: number): Promise<boolean>;
  
  // Episode operations
  getEpisodes(seriesId: number): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined>;
  deleteEpisode(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  // Storage for each model
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private countries: Map<number, Country>;
  private channels: Map<number, Channel>;
  private programs: Map<number, Program>;
  private movies: Map<number, Movie>;
  private series: Map<number, Series>;
  private episodes: Map<number, Episode>;
  
  // Counters for IDs
  private userCounter: number;
  private categoryCounter: number;
  private countryCounter: number;
  private channelCounter: number;
  private programCounter: number;
  private movieCounter: number;
  private seriesCounter: number;
  private episodeCounter: number;
  
  // Session store
  public sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.countries = new Map();
    this.channels = new Map();
    this.programs = new Map();
    this.movies = new Map();
    this.series = new Map();
    this.episodes = new Map();
    
    this.userCounter = 1;
    this.categoryCounter = 1;
    this.countryCounter = 1;
    this.channelCounter = 1;
    this.programCounter = 1;
    this.movieCounter = 1;
    this.seriesCounter = 1;
    this.episodeCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions once a day
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryCounter++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...categoryUpdate };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Country operations
  async getCountries(): Promise<Country[]> {
    return Array.from(this.countries.values());
  }
  
  async getCountry(id: number): Promise<Country | undefined> {
    return this.countries.get(id);
  }
  
  async createCountry(country: InsertCountry): Promise<Country> {
    const id = this.countryCounter++;
    const newCountry: Country = { ...country, id };
    this.countries.set(id, newCountry);
    return newCountry;
  }
  
  async updateCountry(id: number, countryUpdate: Partial<InsertCountry>): Promise<Country | undefined> {
    const country = this.countries.get(id);
    if (!country) return undefined;
    
    const updatedCountry: Country = { ...country, ...countryUpdate };
    this.countries.set(id, updatedCountry);
    return updatedCountry;
  }
  
  async deleteCountry(id: number): Promise<boolean> {
    return this.countries.delete(id);
  }
  
  // Channel operations
  async getChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }
  
  async getChannel(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }
  
  async getChannelsByCategory(categoryId: number): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.categoryId === categoryId
    );
  }
  
  async getChannelsByCountry(countryId: number): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.countryId === countryId
    );
  }
  
  async createChannel(channel: InsertChannel): Promise<Channel> {
    const id = this.channelCounter++;
    const newChannel: Channel = { ...channel, id };
    this.channels.set(id, newChannel);
    return newChannel;
  }
  
  async updateChannel(id: number, channelUpdate: Partial<InsertChannel>): Promise<Channel | undefined> {
    const channel = this.channels.get(id);
    if (!channel) return undefined;
    
    const updatedChannel: Channel = { ...channel, ...channelUpdate };
    this.channels.set(id, updatedChannel);
    return updatedChannel;
  }
  
  async deleteChannel(id: number): Promise<boolean> {
    return this.channels.delete(id);
  }
  
  // Program operations
  async getCurrentPrograms(): Promise<Program[]> {
    const now = new Date();
    return Array.from(this.programs.values()).filter(
      (program) => program.startTime <= now && program.endTime >= now
    );
  }
  
  async getChannelPrograms(channelId: number): Promise<Program[]> {
    return Array.from(this.programs.values()).filter(
      (program) => program.channelId === channelId
    );
  }
  
  async createProgram(program: InsertProgram): Promise<Program> {
    const id = this.programCounter++;
    const newProgram: Program = { ...program, id };
    this.programs.set(id, newProgram);
    return newProgram;
  }
  
  async updateProgram(id: number, programUpdate: Partial<InsertProgram>): Promise<Program | undefined> {
    const program = this.programs.get(id);
    if (!program) return undefined;
    
    const updatedProgram: Program = { ...program, ...programUpdate };
    this.programs.set(id, updatedProgram);
    return updatedProgram;
  }
  
  async deleteProgram(id: number): Promise<boolean> {
    return this.programs.delete(id);
  }
  
  // Movie operations
  async getMovies(): Promise<Movie[]> {
    return Array.from(this.movies.values());
  }
  
  async getMovie(id: number): Promise<Movie | undefined> {
    return this.movies.get(id);
  }
  
  async getMoviesByCategory(categoryId: number): Promise<Movie[]> {
    return Array.from(this.movies.values()).filter(
      (movie) => movie.categoryId === categoryId
    );
  }
  
  async createMovie(movie: InsertMovie): Promise<Movie> {
    const id = this.movieCounter++;
    const newMovie: Movie = { ...movie, id };
    this.movies.set(id, newMovie);
    return newMovie;
  }
  
  async updateMovie(id: number, movieUpdate: Partial<InsertMovie>): Promise<Movie | undefined> {
    const movie = this.movies.get(id);
    if (!movie) return undefined;
    
    const updatedMovie: Movie = { ...movie, ...movieUpdate };
    this.movies.set(id, updatedMovie);
    return updatedMovie;
  }
  
  async deleteMovie(id: number): Promise<boolean> {
    return this.movies.delete(id);
  }
  
  // Series operations
  async getAllSeries(): Promise<Series[]> {
    return Array.from(this.series.values());
  }
  
  async getSeries(id: number): Promise<Series | undefined> {
    return this.series.get(id);
  }
  
  async getSeriesByCategory(categoryId: number): Promise<Series[]> {
    return Array.from(this.series.values()).filter(
      (series) => series.categoryId === categoryId
    );
  }
  
  async createSeries(series: InsertSeries): Promise<Series> {
    const id = this.seriesCounter++;
    const newSeries: Series = { ...series, id };
    this.series.set(id, newSeries);
    return newSeries;
  }
  
  async updateSeries(id: number, seriesUpdate: Partial<InsertSeries>): Promise<Series | undefined> {
    const series = this.series.get(id);
    if (!series) return undefined;
    
    const updatedSeries: Series = { ...series, ...seriesUpdate };
    this.series.set(id, updatedSeries);
    return updatedSeries;
  }
  
  async deleteSeries(id: number): Promise<boolean> {
    return this.series.delete(id);
  }
  
  // Episode operations
  async getEpisodes(seriesId: number): Promise<Episode[]> {
    return Array.from(this.episodes.values()).filter(
      (episode) => episode.seriesId === seriesId
    );
  }
  
  async getEpisode(id: number): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }
  
  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const id = this.episodeCounter++;
    const newEpisode: Episode = { ...episode, id };
    this.episodes.set(id, newEpisode);
    return newEpisode;
  }
  
  async updateEpisode(id: number, episodeUpdate: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const episode = this.episodes.get(id);
    if (!episode) return undefined;
    
    const updatedEpisode: Episode = { ...episode, ...episodeUpdate };
    this.episodes.set(id, updatedEpisode);
    return updatedEpisode;
  }
  
  async deleteEpisode(id: number): Promise<boolean> {
    return this.episodes.delete(id);
  }
  
  // Initialize with sample data for testing
  private initializeSampleData() {
    // Create initial admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$iA87mzYRQFRVYzABRr7N8OwP/Oiwn0sgxCf01NaN0kAuHRXMZ8G7K", // "password"
      isAdmin: true
    });
    
    // Create categories
    const categoriesData: InsertCategory[] = [
      { 
        name: "Sports", 
        slug: "sports", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />',
        gradientFrom: "#8b5cf6",
        gradientTo: "#ec4899"
      },
      { 
        name: "News", 
        slug: "news", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />',
        gradientFrom: "#3b82f6",
        gradientTo: "#06b6d4"
      },
      { 
        name: "Movies", 
        slug: "movies", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />',
        gradientFrom: "#ef4444",
        gradientTo: "#ec4899"
      },
      { 
        name: "Series", 
        slug: "series", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />',
        gradientFrom: "#8b5cf6",
        gradientTo: "#6366f1"
      },
      { 
        name: "Kids", 
        slug: "kids", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
        gradientFrom: "#f59e0b",
        gradientTo: "#f97316"
      },
      { 
        name: "International", 
        slug: "international", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />',
        gradientFrom: "#10b981",
        gradientTo: "#84cc16" 
      }
    ];
    
    categoriesData.forEach(category => {
      this.createCategory(category);
    });
    
    // Create countries
    const countriesData: InsertCountry[] = [
      { name: "United States", code: "us" },
      { name: "United Kingdom", code: "gb" },
      { name: "Canada", code: "ca" },
      { name: "France", code: "fr" },
      { name: "Germany", code: "de" },
      { name: "India", code: "in" }
    ];
    
    countriesData.forEach(country => {
      this.createCountry(country);
    });
    
    // Create channels
    const channelsData: InsertChannel[] = [
      {
        name: "ESPN",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_logo.svg/1280px-ESPN_logo.svg.png",
        categoryId: 1, // Sports
        countryId: 1, // US
        epgId: "espn.us",
        streamSources: [
          { url: "https://example.com/espn.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/espn.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      },
      {
        name: "CNN",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/1280px-CNN.svg.png",
        categoryId: 2, // News
        countryId: 1, // US
        epgId: "cnn.us",
        streamSources: [
          { url: "https://example.com/cnn.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/cnn.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      },
      {
        name: "BBC One",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/BBC_One_logo_2021.svg/1280px-BBC_One_logo_2021.svg.png",
        categoryId: 2, // News
        countryId: 2, // UK
        epgId: "bbc1.uk",
        streamSources: [
          { url: "https://example.com/bbc1.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/bbc1.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      },
      {
        name: "Fox Sports",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/2015_Fox_Sports_1_logo.svg/1280px-2015_Fox_Sports_1_logo.svg.png",
        categoryId: 1, // Sports
        countryId: 1, // US
        epgId: "foxsports.us",
        streamSources: [
          { url: "https://example.com/foxsports.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/foxsports.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      },
      {
        name: "Disney Channel",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/2019_Disney_Channel_logo.svg/1280px-2019_Disney_Channel_logo.svg.png",
        categoryId: 5, // Kids
        countryId: 1, // US
        epgId: "disney.us",
        streamSources: [
          { url: "https://example.com/disney.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/disney.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      }
    ];
    
    channelsData.forEach(channel => {
      this.createChannel(channel);
    });
    
    // Create current programs
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() - 1);
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 1);
    
    const programsData: InsertProgram[] = [
      {
        channelId: 1,
        title: "NBA 2023: Lakers vs Warriors",
        startTime,
        endTime,
        description: "Live NBA action featuring Los Angeles Lakers vs Golden State Warriors."
      },
      {
        channelId: 2,
        title: "Breaking News: World Updates",
        startTime,
        endTime,
        description: "Get the latest updates on current events from around the world."
      },
      {
        channelId: 3,
        title: "Doctor Who: New Episode",
        startTime,
        endTime,
        description: "The Doctor faces a new enemy in this thrilling episode."
      },
      {
        channelId: 4,
        title: "NFL: Eagles vs Cowboys",
        startTime,
        endTime,
        description: "Live NFL action featuring Philadelphia Eagles vs Dallas Cowboys."
      },
      {
        channelId: 5,
        title: "Animated Movie Marathon",
        startTime,
        endTime,
        description: "A marathon of classic Disney animated movies."
      }
    ];
    
    programsData.forEach(program => {
      this.createProgram(program);
    });
    
    // Create movies
    const moviesData: InsertMovie[] = [
      {
        title: "Interstellar",
        poster: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        year: 2014,
        rating: "8.6",
        duration: 169,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/interstellar.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/interstellar.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      },
      {
        title: "The Dark Knight",
        poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg",
        year: 2008,
        rating: "9.0",
        duration: 152,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/dark-knight.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/dark-knight.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      },
      {
        title: "Inception",
        poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
        year: 2010,
        rating: "8.8",
        duration: 148,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/inception.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/inception.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      },
      {
        title: "Avengers: Endgame",
        poster: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg",
        year: 2019,
        rating: "8.4",
        duration: 181,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/avengers-endgame.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/avengers-endgame.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      },
      {
        title: "Joker",
        poster: "https://m.media-amazon.com/images/M/MV5BNGVjNWI4ZGUtNzE0MS00YTJmLWE0ZDctN2ZiYTk2YmI3NTYyXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        year: 2019,
        rating: "8.5",
        duration: 122,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/joker.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/joker.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      }
    ];
    
    moviesData.forEach(movie => {
      this.createMovie(movie);
    });
    
    // Create series
    const seriesData: InsertSeries[] = [
      {
        title: "Breaking Bad",
        poster: "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg",
        startYear: 2008,
        endYear: 2013,
        rating: "9.5",
        categoryId: 4, // Series
        seasons: 5,
        isPremium: false
      },
      {
        title: "Game of Thrones",
        poster: "https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWJjYjUtMzkwNTUzMWMxZTllXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_.jpg",
        startYear: 2011,
        endYear: 2019,
        rating: "9.3",
        categoryId: 4, // Series
        seasons: 8,
        isPremium: false
      },
      {
        title: "Stranger Things",
        poster: "https://m.media-amazon.com/images/M/MV5BMDZkYmVhNjMtNWU4MC00MDQxLWE3MjYtZGMzZWI1ZjhlOWJmXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        startYear: 2016,
        endYear: null,
        rating: "8.7",
        categoryId: 4, // Series
        seasons: 4,
        isPremium: false
      },
      {
        title: "The Mandalorian",
        poster: "https://m.media-amazon.com/images/M/MV5BYTQwYzVlODQtNzFmMC00MjYyLWFhMWUtZTZiN2Y2N2Q2NDMyXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        startYear: 2019,
        endYear: null,
        rating: "8.8",
        categoryId: 4, // Series
        seasons: 3,
        isPremium: false
      },
      {
        title: "The Office",
        poster: "https://m.media-amazon.com/images/M/MV5BMDNkOTE4NDQtMTNmYi00MWE0LWE4ZTktYTc0NzhhNWIzNzJiXkEyXkFqcGdeQXVyMzQ2MDI5NjU@._V1_.jpg",
        startYear: 2005,
        endYear: 2013,
        rating: "8.9",
        categoryId: 4, // Series
        seasons: 9,
        isPremium: false
      }
    ];
    
    seriesData.forEach(series => {
      this.createSeries(series);
    });
    
    // Create episodes for Breaking Bad (just first season)
    const breakingBadEpisodes: InsertEpisode[] = [
      {
        seriesId: 1,
        season: 1,
        episode: 1,
        title: "Pilot",
        description: "Chemistry teacher Walter White discovers he has cancer and turns to a life of crime.",
        duration: 58,
        streamSources: [
          { url: "https://example.com/breaking-bad/s01e01.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/breaking-bad/s01e01.mp4", priority: 2, format: "mp4", label: "SD" }
        ]
      },
      {
        seriesId: 1,
        season: 1,
        episode: 2,
        title: "Cat's in the Bag...",
        description: "Walter and Jesse try to dispose of the bodies of two rivals.",
        duration: 48,
        streamSources: [
          { url: "https://example.com/breaking-bad/s01e02.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/breaking-bad/s01e02.mp4", priority: 2, format: "mp4", label: "SD" }
        ]
      },
      {
        seriesId: 1,
        season: 1,
        episode: 3,
        title: "...And the Bag's in the River",
        description: "Walter faces a difficult decision regarding one of his rivals.",
        duration: 47,
        streamSources: [
          { url: "https://example.com/breaking-bad/s01e03.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/breaking-bad/s01e03.mp4", priority: 2, format: "mp4", label: "SD" }
        ]
      }
    ];
    
    breakingBadEpisodes.forEach(episode => {
      this.createEpisode(episode);
    });
  }
}

export const storage = new MemStorage();
