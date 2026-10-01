import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/layout/Layout'
import { StateMessage } from './components/ui'
import { clinic } from './config/clinic'
import { env } from './config/env'
import { I18nProvider } from './i18n/I18nProvider'
import { useI18n } from './i18n/useI18n'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

// Home loads with the app; every other page is fetched when first opened (smaller first download on slow mobile data).
const AboutPage = lazy(() => import('./pages/AboutPage'))
const AppointmentPage = lazy(() => import('./pages/AppointmentPage'))
const BeforeVisitPage = lazy(() => import('./pages/BeforeVisitPage'))
const BookPage = lazy(() => import('./pages/BookPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const DoctorPage = lazy(() => import('./pages/DoctorPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const EducationPeriodsPage = lazy(() => import('./pages/EducationPeriodsPage'))
const EducationPregnancyPage = lazy(() => import('./pages/EducationPregnancyPage'))
const MyAppointmentsPage = lazy(() => import('./pages/MyAppointmentsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))

// Internal pages — split into their own chunks so patients never download them.
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage'))
const StaffApp = lazy(() => import('./pages/staff/StaffApp'))

function PageLoading() {
  const { t } = useI18n()
  return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />
}

const router = createBrowserRouter([
  {
    // Clinic staff area: own layout, no public header/footer.
    path: '/staff/*',
    element: (
      <Suspense fallback={<PageLoading />}>
        <StaffApp />
      </Suspense>
    ),
  },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/doctor', element: <DoctorPage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/services/:slug', element: <ServiceDetailPage /> },
      { path: '/before-your-visit', element: <BeforeVisitPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/book', element: <BookPage /> },
      { path: '/login', element: <LoginPage /> },
      // Health-education pages: off until the doctor approves the text (config/clinic.js → features).
      ...(clinic.features.healthEducation
        ? [
            { path: '/education/periods', element: <EducationPeriodsPage /> },
            { path: '/education/pregnancy', element: <EducationPregnancyPage /> },
          ]
        : []),
      {
        path: '/my-appointments',
        element: (
          <RequireAuth>
            <MyAppointmentsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/notifications',
        element: (
          <RequireAuth>
            <NotificationsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/appointments/:requestId',
        element: (
          <RequireAuth>
            <AppointmentPage />
          </RequireAuth>
        ),
      },
      ...(env.demoMode
        ? [
            {
              path: '/design-system',
              element: (
                <Suspense fallback={<PageLoading />}>
                  <DesignSystemPage />
                </Suspense>
              ),
            },
          ]
        : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App({ i18n }) {
  return (
    <I18nProvider initial={i18n}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </I18nProvider>
  )
}
