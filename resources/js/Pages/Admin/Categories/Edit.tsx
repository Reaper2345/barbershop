/*
|--------------------------------------------------------------------------
| Admin/Categories/Edit
|--------------------------------------------------------------------------
| Admin\CategoryController@edit renders `Admin/Categories/Edit` and passes
| `category`. The shared Form.tsx component handles both modes; this file binds
| the edit mode so the controller's page name resolves.
*/

import AdminCategoryForm from './Form';
import type { AdminCategoryRow } from '@/types';

export default function AdminCategoryEdit({ category }: { category: AdminCategoryRow }) {
    return <AdminCategoryForm category={category} />;
}
