import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import LiveTvPage from "@/pages/live-tv-page";
import ChannelDetailPage from "@/pages/channel-detail-page";
import MoviesPage from "@/pages/movies-page";
import SeriesPage from "@/pages/series-page";
import AuthPage from "@/pages/auth-page";
import PremiumPage from "@/pages/premium-page";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminChannels from "@/pages/admin/channels";
import AdminMovies from "@/pages/admin/movies";
import AdminSeries from "@/pages/admin/series";
import AdminCategories from "@/pages/admin/categories";
import AdminEpisodes from "@/pages/admin/episodes";
import AdminUsers from "@/pages/admin/users";
import AdminEPG from "@/pages/admin/epg";
import AdminCountries from "@/pages/admin/countries";
import AdminSettings from "@/pages/admin/settings";
import AdminDatabaseBackup from "@/pages/admin/database-backup";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PremiumBanner } from "@/components/PremiumBanner";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <PremiumBanner />
      <Navbar />
      <main className="flex-grow bg-gray-100 dark:bg-gray-900">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/live-tv" component={LiveTvPage} />
          <Route path="/live-tv/:id" component={ChannelDetailPage} />
          <Route path="/movies" component={MoviesPage} />
          <Route path="/series" component={SeriesPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/premium" component={PremiumPage} />

          <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
          <ProtectedRoute path="/admin/channels" component={AdminChannels} adminOnly />
          <ProtectedRoute path="/admin/movies" component={AdminMovies} adminOnly />
          <ProtectedRoute path="/admin/series" component={AdminSeries} adminOnly />
          <ProtectedRoute path="/admin/categories" component={AdminCategories} adminOnly />
          <ProtectedRoute path="/admin/episodes" component={AdminEpisodes} adminOnly />
          <ProtectedRoute path="/admin/users" component={AdminUsers} adminOnly />
          <ProtectedRoute path="/admin/epg" component={AdminEPG} adminOnly />
          <ProtectedRoute path="/admin/countries" component={AdminCountries} adminOnly />
          <ProtectedRoute path="/admin/settings" component={AdminSettings} adminOnly />
          <ProtectedRoute path="/admin/database-backup" component={AdminDatabaseBackup} adminOnly />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
