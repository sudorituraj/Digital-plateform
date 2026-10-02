import { Route, Routes } from 'react-router-dom'
import { RequireStaff } from '../../auth/RequireStaff'
import { useStaffAuth } from '../../auth/staffContext'
import { StaffLayout } from '../../components/staff/StaffLayout'
import NotFoundPage from '../NotFoundPage'
import AnalyticsPage from './AnalyticsPage'
import DoctorTodayPage from './DoctorTodayPage'
import DoctorVisitPage from './DoctorVisitPage'
import MessagesPage from './MessagesPage'
import PatientProfilePage from './PatientProfilePage'
import PatientsPage from './PatientsPage'
import ReceptionPage from './ReceptionPage'
import StaffLoginPage from './StaffLoginPage'

/** Reception/admin see the reception dashboard; the doctor sees today's queue. */
function StaffHome() {
  const { staff } = useStaffAuth()
  return staff.role === 'doctor' ? <DoctorTodayPage /> : <ReceptionPage />
}

const FRONT_DESK = ['reception', 'admin']

/** Everything under /staff — loaded as a separate bundle, so patients never download staff code. */
export default function StaffApp() {
  return (
    <Routes>
      <Route element={<StaffLayout />}>
        <Route path="login" element={<StaffLoginPage />} />
        <Route
          index
          element={
            <RequireStaff>
              <StaffHome />
            </RequireStaff>
          }
        />
        <Route
          path="patients"
          element={
            <RequireStaff roles={FRONT_DESK}>
              <PatientsPage />
            </RequireStaff>
          }
        />
        <Route
          path="patients/:code"
          element={
            <RequireStaff>
              <PatientProfilePage />
            </RequireStaff>
          }
        />
        <Route
          path="queue"
          element={
            <RequireStaff roles={FRONT_DESK}>
              <DoctorTodayPage />
            </RequireStaff>
          }
        />
        <Route
          path="visit/:requestId"
          element={
            <RequireStaff>
              <DoctorVisitPage />
            </RequireStaff>
          }
        />
        <Route
          path="messages"
          element={
            <RequireStaff roles={FRONT_DESK}>
              <MessagesPage />
            </RequireStaff>
          }
        />
        <Route
          path="analytics"
          element={
            <RequireStaff>
              <AnalyticsPage />
            </RequireStaff>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
