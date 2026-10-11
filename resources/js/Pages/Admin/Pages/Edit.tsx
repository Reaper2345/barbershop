/*
|--------------------------------------------------------------------------
| Admin/Pages/Edit
|--------------------------------------------------------------------------
| Admin\PageController@edit renders `Admin/Pages/Edit` and passes `page`. The
| shared Form.tsx component handles both modes; this file binds edit mode so
| the controller's page name resolves.
*/

import AdminPageForm from './Form';
import type { AdminPageRow } from '@/types';

export default function AdminPageEdit({ page }: { page: AdminPageRow }) {
    return <AdminPageForm page={page} />;
}
