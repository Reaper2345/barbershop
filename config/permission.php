<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Permission models
    |--------------------------------------------------------------------------
    */

    'models' => [
        'permission' => Spatie\Permission\Models\Permission::class,
        'role' => Spatie\Permission\Models\Role::class,
    ],

    'table_names' => [
        'roles' => 'roles',
        'permissions' => 'permissions',
        'model_has_permissions' => 'model_has_permissions',
        'model_has_roles' => 'model_has_roles',
        'role_has_permissions' => 'role_has_permissions',
    ],

    'column_names' => [
        'role_pivot_key' => null,
        'permission_pivot_key' => null,
        'model_morph_key' => 'model_id',
        'team_foreign_key' => 'team_id',
    ],

    /*
    |--------------------------------------------------------------------------
    | Teams
    |--------------------------------------------------------------------------
    |
    | A single barbershop does not need per-team roles, so teams stay disabled.
    | If this is ever switched on, the permission tables must be re-migrated.
    |
    */

    'teams' => false,

    /*
    |--------------------------------------------------------------------------
    | Permission checks
    |--------------------------------------------------------------------------
    */

    'display_permission_in_exception' => false,
    'display_role_in_exception' => false,
    'enable_wildcard_permission' => false,

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | Role/permission lookups are cached. Any write through the package flushes
    | this key automatically, and RoleSeeder flushes it explicitly.
    |
    */

    'cache' => [
        'expiration_time' => \DateInterval::createFromDateString('24 hours'),
        'key' => 'spatie.permission.cache',
        'store' => 'default',
    ],
];
