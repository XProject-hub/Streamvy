--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: crypto_currency; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.crypto_currency AS ENUM (
    'BTC',
    'USDT',
    'LTC'
);


ALTER TYPE public.crypto_currency OWNER TO neondb_owner;

--
-- Name: crypto_payment_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.crypto_payment_status AS ENUM (
    'pending',
    'completed',
    'expired',
    'failed'
);


ALTER TYPE public.crypto_payment_status OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_stream_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.active_stream_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    content_type text NOT NULL,
    content_id integer NOT NULL,
    token_id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    last_rotated_at timestamp without time zone,
    is_revoked boolean DEFAULT false NOT NULL,
    ip_address text,
    user_agent text
);


ALTER TABLE public.active_stream_tokens OWNER TO neondb_owner;

--
-- Name: active_stream_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.active_stream_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.active_stream_tokens_id_seq OWNER TO neondb_owner;

--
-- Name: active_stream_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.active_stream_tokens_id_seq OWNED BY public.active_stream_tokens.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon_svg text,
    gradient_from text,
    gradient_to text
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO neondb_owner;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: channels; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.channels (
    id integer NOT NULL,
    name text NOT NULL,
    logo text,
    category_id integer,
    country_id integer,
    epg_id text,
    stream_sources jsonb NOT NULL,
    status text DEFAULT 'unknown'::text NOT NULL,
    last_checked timestamp without time zone,
    is_premium boolean DEFAULT false NOT NULL
);


ALTER TABLE public.channels OWNER TO neondb_owner;

--
-- Name: channels_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.channels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channels_id_seq OWNER TO neondb_owner;

--
-- Name: channels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.channels_id_seq OWNED BY public.channels.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    flag text
);


ALTER TABLE public.countries OWNER TO neondb_owner;

--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.countries_id_seq OWNER TO neondb_owner;

--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: crypto_payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.crypto_payments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    plan_name text NOT NULL,
    amount double precision NOT NULL,
    currency public.crypto_currency NOT NULL,
    wallet_address text NOT NULL,
    reference_id text NOT NULL,
    status public.crypto_payment_status DEFAULT 'pending'::public.crypto_payment_status NOT NULL,
    transaction_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    expires_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.crypto_payments OWNER TO neondb_owner;

--
-- Name: crypto_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.crypto_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crypto_payments_id_seq OWNER TO neondb_owner;

--
-- Name: crypto_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.crypto_payments_id_seq OWNED BY public.crypto_payments.id;


--
-- Name: crypto_wallet_addresses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.crypto_wallet_addresses (
    id integer NOT NULL,
    address text NOT NULL,
    currency public.crypto_currency NOT NULL,
    label text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.crypto_wallet_addresses OWNER TO neondb_owner;

--
-- Name: crypto_wallet_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.crypto_wallet_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crypto_wallet_addresses_id_seq OWNER TO neondb_owner;

--
-- Name: crypto_wallet_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.crypto_wallet_addresses_id_seq OWNED BY public.crypto_wallet_addresses.id;


--
-- Name: epg_channel_mappings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.epg_channel_mappings (
    id integer NOT NULL,
    channel_id integer NOT NULL,
    epg_source_id integer NOT NULL,
    external_channel_id text NOT NULL,
    external_channel_name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.epg_channel_mappings OWNER TO neondb_owner;

--
-- Name: epg_channel_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.epg_channel_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.epg_channel_mappings_id_seq OWNER TO neondb_owner;

--
-- Name: epg_channel_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.epg_channel_mappings_id_seq OWNED BY public.epg_channel_mappings.id;


--
-- Name: epg_import_jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.epg_import_jobs (
    id integer NOT NULL,
    epg_source_id integer NOT NULL,
    start_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_time timestamp without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    programs_imported integer DEFAULT 0,
    channels_imported integer DEFAULT 0,
    errors jsonb DEFAULT '[]'::jsonb,
    log_details text
);


ALTER TABLE public.epg_import_jobs OWNER TO neondb_owner;

--
-- Name: epg_import_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.epg_import_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.epg_import_jobs_id_seq OWNER TO neondb_owner;

--
-- Name: epg_import_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.epg_import_jobs_id_seq OWNED BY public.epg_import_jobs.id;


--
-- Name: epg_sources; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.epg_sources (
    id integer NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    description text,
    last_update timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    channel_count integer DEFAULT 0
);


ALTER TABLE public.epg_sources OWNER TO neondb_owner;

--
-- Name: epg_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.epg_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.epg_sources_id_seq OWNER TO neondb_owner;

--
-- Name: epg_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.epg_sources_id_seq OWNED BY public.epg_sources.id;


--
-- Name: episodes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.episodes (
    id integer NOT NULL,
    series_id integer NOT NULL,
    season integer NOT NULL,
    episode integer NOT NULL,
    title text NOT NULL,
    description text,
    duration integer,
    stream_sources jsonb NOT NULL
);


ALTER TABLE public.episodes OWNER TO neondb_owner;

--
-- Name: episodes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.episodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.episodes_id_seq OWNER TO neondb_owner;

--
-- Name: episodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.episodes_id_seq OWNED BY public.episodes.id;


--
-- Name: movies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.movies (
    id integer NOT NULL,
    title text NOT NULL,
    poster text,
    year integer,
    rating text,
    duration integer,
    category_id integer,
    stream_sources jsonb NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    country_id integer
);


ALTER TABLE public.movies OWNER TO neondb_owner;

--
-- Name: movies_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.movies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movies_id_seq OWNER TO neondb_owner;

--
-- Name: movies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.movies_id_seq OWNED BY public.movies.id;


--
-- Name: programs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.programs (
    id integer NOT NULL,
    channel_id integer NOT NULL,
    title text NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    description text,
    category text,
    poster_url text,
    episode_title text,
    season integer,
    episode integer,
    year integer,
    directors jsonb DEFAULT '[]'::jsonb,
    cast_members jsonb DEFAULT '[]'::jsonb,
    rating text,
    is_featured boolean DEFAULT false,
    external_id text
);


ALTER TABLE public.programs OWNER TO neondb_owner;

--
-- Name: programs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.programs_id_seq OWNER TO neondb_owner;

--
-- Name: programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.programs_id_seq OWNED BY public.programs.id;


--
-- Name: series; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.series (
    id integer NOT NULL,
    title text NOT NULL,
    poster text,
    start_year integer,
    end_year integer,
    rating text,
    category_id integer,
    seasons integer DEFAULT 1 NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    country_id integer
);


ALTER TABLE public.series OWNER TO neondb_owner;

--
-- Name: series_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.series_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.series_id_seq OWNER TO neondb_owner;

--
-- Name: series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.series_id_seq OWNED BY public.series.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.site_settings (
    id integer NOT NULL,
    "siteName" text DEFAULT 'StreamHive'::text NOT NULL,
    "logoUrl" text,
    "primaryColor" text DEFAULT '#3b82f6'::text NOT NULL,
    "enableSubscriptions" boolean DEFAULT true NOT NULL,
    "enablePPV" boolean DEFAULT false NOT NULL,
    "enableRegistration" boolean DEFAULT true NOT NULL,
    "defaultUserQuota" integer DEFAULT 5 NOT NULL,
    "defaultUserConcurrentStreams" integer DEFAULT 2 NOT NULL,
    "lastUpdated" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.site_settings OWNER TO neondb_owner;

--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_settings_id_seq OWNER TO neondb_owner;

--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: stream_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stream_analytics (
    id integer NOT NULL,
    user_id integer NOT NULL,
    content_type text NOT NULL,
    content_id integer NOT NULL,
    event text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    duration integer,
    quality text,
    bandwidth integer,
    location text,
    ip_address text,
    user_agent text,
    error text,
    buffering_duration integer,
    custom_data jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.stream_analytics OWNER TO neondb_owner;

--
-- Name: stream_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stream_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stream_analytics_id_seq OWNER TO neondb_owner;

--
-- Name: stream_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stream_analytics_id_seq OWNED BY public.stream_analytics.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    favorites jsonb DEFAULT '{"movies": [], "series": [], "channels": []}'::jsonb,
    preferred_categories jsonb DEFAULT '[]'::jsonb,
    content_filters jsonb DEFAULT '{}'::jsonb,
    ui_settings jsonb DEFAULT '{}'::jsonb,
    last_updated timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_preferences OWNER TO neondb_owner;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_preferences_id_seq OWNER TO neondb_owner;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_premium boolean DEFAULT false,
    premium_plan text,
    premium_expiry timestamp without time zone,
    stripe_customer_id text,
    stripe_subscription_id text
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: watch_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.watch_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    content_type text NOT NULL,
    content_id integer NOT NULL,
    start_time timestamp without time zone DEFAULT now() NOT NULL,
    end_time timestamp without time zone,
    duration integer,
    progress integer,
    completed boolean DEFAULT false
);


ALTER TABLE public.watch_history OWNER TO neondb_owner;

--
-- Name: watch_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.watch_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.watch_history_id_seq OWNER TO neondb_owner;

--
-- Name: watch_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.watch_history_id_seq OWNED BY public.watch_history.id;


--
-- Name: active_stream_tokens id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.active_stream_tokens ALTER COLUMN id SET DEFAULT nextval('public.active_stream_tokens_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: channels id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.channels ALTER COLUMN id SET DEFAULT nextval('public.channels_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: crypto_payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crypto_payments ALTER COLUMN id SET DEFAULT nextval('public.crypto_payments_id_seq'::regclass);


--
-- Name: crypto_wallet_addresses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crypto_wallet_addresses ALTER COLUMN id SET DEFAULT nextval('public.crypto_wallet_addresses_id_seq'::regclass);


--
-- Name: epg_channel_mappings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_channel_mappings ALTER COLUMN id SET DEFAULT nextval('public.epg_channel_mappings_id_seq'::regclass);


--
-- Name: epg_import_jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_import_jobs ALTER COLUMN id SET DEFAULT nextval('public.epg_import_jobs_id_seq'::regclass);


--
-- Name: epg_sources id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_sources ALTER COLUMN id SET DEFAULT nextval('public.epg_sources_id_seq'::regclass);


--
-- Name: episodes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.episodes ALTER COLUMN id SET DEFAULT nextval('public.episodes_id_seq'::regclass);


--
-- Name: movies id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movies ALTER COLUMN id SET DEFAULT nextval('public.movies_id_seq'::regclass);


--
-- Name: programs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.programs ALTER COLUMN id SET DEFAULT nextval('public.programs_id_seq'::regclass);


--
-- Name: series id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.series ALTER COLUMN id SET DEFAULT nextval('public.series_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Name: stream_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stream_analytics ALTER COLUMN id SET DEFAULT nextval('public.stream_analytics_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: watch_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.watch_history ALTER COLUMN id SET DEFAULT nextval('public.watch_history_id_seq'::regclass);


--
-- Data for Name: active_stream_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.active_stream_tokens (id, user_id, content_type, content_id, token_id, created_at, expires_at, last_rotated_at, is_revoked, ip_address, user_agent) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, name, slug, icon_svg, gradient_from, gradient_to) FROM stdin;
1	Movies	movies	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />	#ef4444	#ec4899
2	Series	series	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />	#8b5cf6	#6366f1
3	Sports	sports	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />	#8b5cf6	#ec4899
4	News	news	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />	#3b82f6	#06b6d4
5	Kids	kids	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />	#f59e0b	#f97316
6	Documentary	documentary	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />	#10b981	#3b82f6
7	PPV	ppv	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />	#8b5cf6	#ec4899
\.


--
-- Data for Name: channels; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.channels (id, name, logo, category_id, country_id, epg_id, stream_sources, status, last_checked, is_premium) FROM stdin;
10	BeIN Sports 1	https://static.wikia.nocookie.net/logopedia/images/e/ee/BeIN_Sports_1_2014.png	3	9	beinsports1	[{"url": "http://superiptv.xyz:8080/live/Afy8634/SmTSQpYRYs/334642.m3u8", "label": "Main", "format": "hls", "priority": 1}, {"url": "http://superiptv.xyz:8080/live/Afy8634/SmTSQpYRYs/351541.m3u8", "label": "Backup 1", "format": "hls", "priority": 2}]	online	2025-04-05 15:44:26.176	f
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.countries (id, name, code, flag) FROM stdin;
1	United States	us	\N
2	United Kingdom	gb	\N
3	Canada	ca	\N
4	France	fr	\N
5	Germany	de	\N
6	India	in	\N
7	Japan	jp	\N
8	Australia	au	\N
9	Turkey	tr	https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Flag_of_Turkey.svg/800px-Flag_of_Turkey.svg.png
\.


--
-- Data for Name: crypto_payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.crypto_payments (id, user_id, plan_name, amount, currency, wallet_address, reference_id, status, transaction_id, created_at, completed_at, expires_at) FROM stdin;
1	1	Monthly	10	BTC	bc1qmk3rumwu0h30ryz5ezg6d0nalflq6lfpw0y6me	PAY-BNZH43WMF7	pending	\N	2025-04-03 12:31:00.066368	\N	2025-04-04 12:31:00.053
\.


--
-- Data for Name: crypto_wallet_addresses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.crypto_wallet_addresses (id, address, currency, label, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: epg_channel_mappings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.epg_channel_mappings (id, channel_id, epg_source_id, external_channel_id, external_channel_name, is_active, last_updated) FROM stdin;
\.


--
-- Data for Name: epg_import_jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.epg_import_jobs (id, epg_source_id, start_time, end_time, status, programs_imported, channels_imported, errors, log_details) FROM stdin;
\.


--
-- Data for Name: epg_sources; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.epg_sources (id, name, url, description, last_update, channel_count) FROM stdin;
1	Turkey	https://epgshare01.online/epgshare01/epg_ripper_TR1.xml	\N	2025-04-02 12:33:46.885+00	0
\.


--
-- Data for Name: episodes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.episodes (id, series_id, season, episode, title, description, duration, stream_sources) FROM stdin;
1	1	1	1	Pilot	Chemistry teacher Walter White is diagnosed with cancer and turns to a life of crime.	58	[{"url": "https://example.com/series/breaking-bad/s01e01.m3u8", "label": "HD", "format": "hls", "priority": 1}, {"url": "https://backup-server.com/series/breaking-bad/s01e01.mp4", "label": "SD", "format": "mp4", "priority": 2}]
2	1	1	2	Cat's in the Bag...	Walt and Jesse attempt to dispose of the bodies of two rivals.	48	[{"url": "https://example.com/series/breaking-bad/s01e02.m3u8", "label": "HD", "format": "hls", "priority": 1}, {"url": "https://backup-server.com/series/breaking-bad/s01e02.mp4", "label": "SD", "format": "mp4", "priority": 2}]
3	2	1	1	The Vanishing of Will Byers	A young boy mysteriously disappears, and his friends, family, and police are drawn into a mystery.	49	[{"url": "https://example.com/series/stranger-things/s01e01.m3u8", "label": "HD", "format": "hls", "priority": 1}, {"url": "https://backup-server.com/series/stranger-things/s01e01.mp4", "label": "SD", "format": "mp4", "priority": 2}]
4	2	1	2	The Weirdo on Maple Street	Lucas, Mike and Dustin try to talk to the girl they found in the woods.	46	[{"url": "https://example.com/series/stranger-things/s01e02.m3u8", "label": "HD", "format": "hls", "priority": 1}, {"url": "https://backup-server.com/series/stranger-things/s01e02.mp4", "label": "SD", "format": "mp4", "priority": 2}]
5	3	1	1	Winter Is Coming	Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon.	62	[{"url": "https://example.com/series/game-of-thrones/s01e01.m3u8", "label": "HD", "format": "hls", "priority": 1}, {"url": "https://backup-server.com/series/game-of-thrones/s01e01.mp4", "label": "SD", "format": "mp4", "priority": 2}]
\.


--
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.movies (id, title, poster, year, rating, duration, category_id, stream_sources, is_premium, country_id) FROM stdin;
6	The Avengers	https://example.com/avengers.jpg	2012	PG-13	143	1	[{"url": "https://example.com/avengers.m3u8", "label": "HD", "format": "hls", "priority": 1}]	f	1
7	Inception	https://example.com/inception.jpg	2010	PG-13	148	1	[{"url": "https://example.com/inception.m3u8", "label": "HD", "format": "hls", "priority": 1}]	f	1
8	Sherlock Holmes	https://example.com/sherlock.jpg	2009	PG-13	128	1	[{"url": "https://example.com/sherlock.m3u8", "label": "HD", "format": "hls", "priority": 1}]	f	2
9	The Kings Speech	https://example.com/kings_speech.jpg	2010	R	118	1	[{"url": "https://example.com/kings_speech.m3u8", "label": "HD", "format": "hls", "priority": 1}]	f	2
\.


--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.programs (id, channel_id, title, start_time, end_time, description, category, poster_url, episode_title, season, episode, year, directors, cast_members, rating, is_featured, external_id) FROM stdin;
\.


--
-- Data for Name: series; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.series (id, title, poster, start_year, end_year, rating, category_id, seasons, is_premium, country_id) FROM stdin;
1	Breaking Bad	https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg	2008	2013	TV-MA	2	5	f	\N
2	Stranger Things	https://m.media-amazon.com/images/M/MV5BN2ZmYjg1YmItNWQ4OC00YWM0LWE0ZDktYThjOTZiZjhhN2Q2XkEyXkFqcGdeQXVyNjgxNTQ3Mjk@._V1_.jpg	2016	\N	TV-14	2	4	f	\N
3	Game of Thrones	https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWJjYjUtMzkwNTUzMWMxZTllXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_.jpg	2011	2019	TV-MA	2	8	t	\N
4	The Crown	https://m.media-amazon.com/images/M/MV5BZmY0MzBlNjctNTRmNy00Njk3LWFjMzctMWQwZDAwMGJmY2MyXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg	2016	\N	TV-MA	2	5	f	\N
5	The Mandalorian	https://m.media-amazon.com/images/M/MV5BZjJlOWM5YzEtMjIyYy00ZjcxLTkzZmYtZjZkOWJlOWYyMmMyXkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_.jpg	2019	\N	TV-14	2	3	t	\N
6	Stranger Things	https://example.com/stranger_things.jpg	2016	\N	TV-14	2	4	f	1
7	Breaking Bad	https://example.com/breaking_bad.jpg	2008	2013	TV-MA	2	5	f	1
8	Downton Abbey	https://example.com/downton_abbey.jpg	2010	2015	TV-PG	2	6	f	2
9	Sherlock	https://example.com/sherlock_series.jpg	2010	2017	TV-14	2	4	f	2
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
Yy2vdZshCNyAtuXe3J_oeCiYp8vGWyW3	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-02T20:11:16.278Z","httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-02 20:11:17
1DnkKIb_cyFzUfxjGngF6JGz7-wUqZuM	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-02T11:20:38.283Z","httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-02 11:28:15
MECp2f-Bl-ULIqx3XMa4Gf2A9HYeJmit	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-05T08:54:18.823Z","httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-05 08:55:34
mc7p6y95h1p_qaXklZojAG2thyKf5z_V	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-02T20:09:49.301Z","httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-02 20:09:50
4zj6FfRuc_Undho96TEmgTu4DFRmH3Rn	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-02T11:24:15.487Z","httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-05 15:44:41
uQYNz_70zJjoSSj2vholnoOIRZkNsXDD	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-02T20:03:39.473Z","httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-02 20:03:49
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.site_settings (id, "siteName", "logoUrl", "primaryColor", "enableSubscriptions", "enablePPV", "enableRegistration", "defaultUserQuota", "defaultUserConcurrentStreams", "lastUpdated") FROM stdin;
1	StreamHive Pro	\N	#10b981	t	f	t	5	2	2025-04-02 20:11:16.407
\.


--
-- Data for Name: stream_analytics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stream_analytics (id, user_id, content_type, content_id, event, "timestamp", duration, quality, bandwidth, location, ip_address, user_agent, error, buffering_duration, custom_data) FROM stdin;
1	1	channel	10	start	2025-04-05 10:56:50.253	\N	720p	2800000	\N	127.0.0.1	Test User Agent	\N	\N	{}
2	1	channel	10	bandwidth_change	2025-04-05 11:01:50.253	\N	\N	3200000	\N	127.0.0.1	Test User Agent	\N	\N	{}
3	1	channel	10	buffering	2025-04-05 11:06:50.253	\N	\N	\N	\N	127.0.0.1	Test User Agent	\N	2800	{}
4	1	channel	10	quality_change	2025-04-05 11:11:50.253	\N	480p	1500000	\N	127.0.0.1	Test User Agent	\N	\N	{}
5	1	channel	10	bandwidth_change	2025-04-05 11:16:50.253	\N	\N	1800000	\N	127.0.0.1	Test User Agent	\N	\N	{}
6	1	channel	10	bandwidth_change	2025-04-05 11:26:50.253	\N	\N	4500000	\N	127.0.0.1	Test User Agent	\N	\N	{}
7	1	channel	10	quality_change	2025-04-05 11:31:50.253	\N	1080p	4200000	\N	127.0.0.1	Test User Agent	\N	\N	{}
8	1	channel	10	error	2025-04-05 11:36:50.253	\N	\N	\N	\N	127.0.0.1	Test User Agent	Failed to load segment: HTTP 404	\N	{}
9	1	channel	10	quality_change	2025-04-05 11:41:50.253	\N	720p	3000000	\N	127.0.0.1	Test User Agent	\N	\N	{}
10	1	channel	10	stop	2025-04-05 11:46:50.253	450	\N	\N	\N	127.0.0.1	Test User Agent	\N	\N	{}
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_preferences (id, user_id, favorites, preferred_categories, content_filters, ui_settings, last_updated) FROM stdin;
1	1	{"movies": [1, 6], "series": [], "channels": []}	[]	{}	{}	2025-04-05 08:54:44.983
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, is_admin, created_at, is_premium, premium_plan, premium_expiry, stripe_customer_id, stripe_subscription_id) FROM stdin;
1	admin	$2a$10$dWkfTw/Uam/cptSNJkusDewxlGVNQjAL5ZtZLHXJvxLn9aFEojBei	t	2025-04-02 10:49:41.043944	f	\N	\N	\N	\N
\.


--
-- Data for Name: watch_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.watch_history (id, user_id, content_type, content_id, start_time, end_time, duration, progress, completed) FROM stdin;
\.


--
-- Name: active_stream_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.active_stream_tokens_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.categories_id_seq', 7, true);


--
-- Name: channels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.channels_id_seq', 10, true);


--
-- Name: countries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.countries_id_seq', 9, true);


--
-- Name: crypto_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.crypto_payments_id_seq', 1, true);


--
-- Name: crypto_wallet_addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.crypto_wallet_addresses_id_seq', 1, false);


--
-- Name: epg_channel_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.epg_channel_mappings_id_seq', 1, false);


--
-- Name: epg_import_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.epg_import_jobs_id_seq', 2, true);


--
-- Name: epg_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.epg_sources_id_seq', 6, true);


--
-- Name: episodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.episodes_id_seq', 5, true);


--
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.movies_id_seq', 9, true);


--
-- Name: programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.programs_id_seq', 6, true);


--
-- Name: series_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.series_id_seq', 9, true);


--
-- Name: site_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.site_settings_id_seq', 1, true);


--
-- Name: stream_analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stream_analytics_id_seq', 10, true);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: watch_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.watch_history_id_seq', 1, false);


--
-- Name: active_stream_tokens active_stream_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.active_stream_tokens
    ADD CONSTRAINT active_stream_tokens_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: channels channels_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);


--
-- Name: countries countries_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_code_unique UNIQUE (code);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: crypto_payments crypto_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crypto_payments
    ADD CONSTRAINT crypto_payments_pkey PRIMARY KEY (id);


--
-- Name: crypto_payments crypto_payments_reference_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crypto_payments
    ADD CONSTRAINT crypto_payments_reference_id_key UNIQUE (reference_id);


--
-- Name: crypto_wallet_addresses crypto_wallet_addresses_address_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crypto_wallet_addresses
    ADD CONSTRAINT crypto_wallet_addresses_address_key UNIQUE (address);


--
-- Name: crypto_wallet_addresses crypto_wallet_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crypto_wallet_addresses
    ADD CONSTRAINT crypto_wallet_addresses_pkey PRIMARY KEY (id);


--
-- Name: epg_channel_mappings epg_channel_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_channel_mappings
    ADD CONSTRAINT epg_channel_mappings_pkey PRIMARY KEY (id);


--
-- Name: epg_import_jobs epg_import_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_import_jobs
    ADD CONSTRAINT epg_import_jobs_pkey PRIMARY KEY (id);


--
-- Name: epg_sources epg_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_sources
    ADD CONSTRAINT epg_sources_pkey PRIMARY KEY (id);


--
-- Name: episodes episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_pkey PRIMARY KEY (id);


--
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- Name: series series_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: stream_analytics stream_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stream_analytics
    ADD CONSTRAINT stream_analytics_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: watch_history watch_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.watch_history
    ADD CONSTRAINT watch_history_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: active_stream_tokens active_stream_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.active_stream_tokens
    ADD CONSTRAINT active_stream_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: channels channels_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: channels channels_country_id_countries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_country_id_countries_id_fk FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: crypto_payments crypto_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crypto_payments
    ADD CONSTRAINT crypto_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: epg_channel_mappings epg_channel_mappings_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_channel_mappings
    ADD CONSTRAINT epg_channel_mappings_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id);


--
-- Name: epg_channel_mappings epg_channel_mappings_epg_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_channel_mappings
    ADD CONSTRAINT epg_channel_mappings_epg_source_id_fkey FOREIGN KEY (epg_source_id) REFERENCES public.epg_sources(id);


--
-- Name: epg_import_jobs epg_import_jobs_epg_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.epg_import_jobs
    ADD CONSTRAINT epg_import_jobs_epg_source_id_fkey FOREIGN KEY (epg_source_id) REFERENCES public.epg_sources(id);


--
-- Name: episodes episodes_series_id_series_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_series_id_series_id_fk FOREIGN KEY (series_id) REFERENCES public.series(id);


--
-- Name: movies movies_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: movies movies_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: programs programs_channel_id_channels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);


--
-- Name: series series_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: series series_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: stream_analytics stream_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stream_analytics
    ADD CONSTRAINT stream_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: watch_history watch_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.watch_history
    ADD CONSTRAINT watch_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

