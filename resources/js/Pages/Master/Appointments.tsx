/*
|--------------------------------------------------------------------------
| Master/Appointments
|--------------------------------------------------------------------------
| MasterAppointmentController@index renders `Master/Appointments`, while the
| implementation lives in Master/Appointments/Index.tsx. Inertia resolves the
| exact page name the controller passes, so without this file the bundle throws
| "Page not found: ./Pages/Master/Appointments.tsx".
|
| The controller's render() string stays untouched; this re-export reconciles
| the two paths. Same pattern as Master/Schedule and Master/Services.
*/

export { default, type MasterAppointmentsProps } from './Appointments/Index';
