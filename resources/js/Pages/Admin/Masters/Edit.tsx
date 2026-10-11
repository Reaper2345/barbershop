/*
|--------------------------------------------------------------------------
| Admin/Masters/Edit
|--------------------------------------------------------------------------
| Admin\MasterController@edit renders `Admin/Masters/Edit` and passes `master`.
| The shared Form.tsx component handles both modes; this binds edit mode.
*/

import AdminMasterForm from './Form';
import type { AdminMasterRow } from '@/types';

export default function AdminMasterEdit({ master }: { master: AdminMasterRow }) {
    return <AdminMasterForm master={master} />;
}
