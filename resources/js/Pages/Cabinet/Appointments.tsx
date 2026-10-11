/*
|--------------------------------------------------------------------------
| Cabinet/Appointments
|--------------------------------------------------------------------------
| ClientCabinetController@appointments renders `Cabinet/Appointments`, while
| the brief names the page `Cabinet/Appointments/Index.tsx`. The
| implementation lives in the nested file and is re-exported here so both paths
| resolve to the same component — no duplication, no controller change.
*/

export { default, reloadAppointments, type CabinetAppointmentsProps } from './Appointments/Index';
