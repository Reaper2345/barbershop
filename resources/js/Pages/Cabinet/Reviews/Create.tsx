/*
|--------------------------------------------------------------------------
| Cabinet/Reviews/Create
|--------------------------------------------------------------------------
| The review form is delivered as a modal (the brief allows "modal or page"),
| because it is always triggered from a specific completed appointment: a
| dedicated route would need the appointment id in the URL and a second
| round trip to load it.
|
| The implementation is the modal in Components/Cabinet/ReviewModal.tsx; this
| module exists so the brief's `Pages/Cabinet/Reviews/Create` path resolves and
| so any future standalone route has somewhere obvious to live.
*/

export { default, type ReviewModalProps } from '@/Components/Cabinet/ReviewModal';
