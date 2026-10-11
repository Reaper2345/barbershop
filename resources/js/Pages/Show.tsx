/*
|--------------------------------------------------------------------------
| Pages/Show
|--------------------------------------------------------------------------
| PageController@show renders `Pages/Show`, which is where the implementation
| lives (Pages/Pages/Show.tsx). This re-export matches the public URL segment
| so both `Pages/Show` and `Pages/Pages/Show` resolve; Inertia resolves the
| page name produced by the controller, so this file exists purely to keep the
| path symmetrical with /masters and /services.
*/

export { default, type PageShowProps } from './Pages/Show';
