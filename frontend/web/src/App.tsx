import './App.css';
import { LangProvider } from './i18n';
import { DownloadProvider } from './components/DownloadModal';
import Nav from './components/Nav';
import Hero from './components/Hero';
import RouteBar from './components/RouteBar';
import StatusGrid from './components/StatusGrid';
import AboutUs from './components/AboutUs';
import Faq from './components/Faq';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';

export default function App() {
  return (
    <LangProvider>
      <DownloadProvider>
        <div className="min-h-screen bg-white font-sans" id="inici">
          <Nav />
          <main className="pt-16">
            <Hero />
            <RouteBar />
            <StatusGrid />
            <AboutUs />
            <Faq />
            <Newsletter />
          </main>
          <Footer />
        </div>
      </DownloadProvider>
    </LangProvider>
  );
}
