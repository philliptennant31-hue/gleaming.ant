import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LoadingState } from './components/ui/states'

// Phase 1 pages — eagerly loaded.
import Home from './pages/Home'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Pricing from './pages/Pricing'
import Areas from './pages/Areas'
import About from './pages/About'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'

// Later-phase route modules — lazy-loaded (Phase 2 booking, Phase 3 admin).
const BookingPage = lazy(() => import('./pages/booking/BookingPage'))
const BookingConfirmedPage = lazy(() => import('./pages/booking/BookingConfirmedPage'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState message="Loading…" className="min-h-screen" />}>
        <Routes>
          {/* Public site — inside the shared Layout (header, footer, chat widget) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/confirmed" element={<BookingConfirmedPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin — its own shell, outside the public Layout */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
