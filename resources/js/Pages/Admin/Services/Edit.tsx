/*
|--------------------------------------------------------------------------
| Admin/Services/Edit
|--------------------------------------------------------------------------
| Admin\ServiceController@edit renders `Admin/Services/Edit` and passes
| `service`, `categories` and (from PROMPT 5) `masters` + `assignedMasterIds`.
*/

import AdminServiceForm from './Form';
import type { AdminServiceRow, CategorySummary } from '@/types';

export default function AdminServiceEdit({
    service,
    categories = [],
    masters = [],
    assignedMasterIds = [],
}: {
    service: AdminServiceRow;
    categories?: CategorySummary[];
    masters?: Array<{ id: number; name: string }>;
    assignedMasterIds?: number[];
}) {
    return (
        <AdminServiceForm
            service={service}
            categories={categories}
            masters={masters}
            assignedMasterIds={assignedMasterIds}
        />
    );
}
