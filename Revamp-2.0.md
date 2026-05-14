# Revamp ATS with solid based and fix bugs

This document outlines the plan to revamp the ATS application, addressing critical bugs and improving the overall architecture.

### Critical Bugs and Implementation Plan

1.  **Customer should not see admin selection option upon sign up**
    *   **File:** `app/register/page.js`
    *   **What:** Remove the role selection dropdown from the registration form.
    *   **How:**
        1.  Remove the `<select>` element for the "role".
        2.  Update the `formData` state to remove the `role` property.
        3.  Update the `handleSubmit` function to no longer send the `role` to the API.

2.  **Admin route should be hidden**
    *   **File:** `middleware.js` (new file)
    *   **What:** Create a middleware to protect the `/admin` route.
    *   **How:**
        1.  Create a `middleware.js` file in the root of the `app` directory.
        2.  The middleware will check the user's session and role.
        3.  If a non-admin user tries to access `/admin`, they will be redirected to the login page or a "not authorized" page.

3.  **There should be a toast implementation for conveying the success or error at signin/signup or over all app functions**
    *   **Files:** `app/layout.tsx`, `app/login/page.js`, `app/register/page.js`
    *   **What:** Implement toast notifications using `react-hot-toast`.
    *   **How:**
        1.  Install `react-hot-toast`: `npm install react-hot-toast`.
        2.  Add the `<Toaster />` component to `app/layout.tsx`.
        3.  Use `toast.success()` and `toast.error()` in the `handleSubmit` functions of the login and register pages to provide feedback to the user.

4.  **State conflicts with supabase, when edit or delete is performed, the state persists, which causes data differences in local version of app and supabase**
    *   **What:** Refactor data fetching to ensure data is re-fetched after mutations.
    *   **How:**
        1.  We will use the `revalidatePath` function from `next/cache` to revalidate the data on the server after a mutation.
        2.  On the client side, we can use the `useRouter` hook to refresh the page or re-fetch the data.

5.  **RLS conflict, upon signing in new account we are seeing old data from other admin/user**
    *   **What:** Implement correct RLS policies in the Supabase dashboard.
    *   **How (To be done in Supabase Dashboard):**
        *   **Users Table:**
            *   Enable RLS on the `users` table.
            *   Create a policy: `Enable read access for users based on their user ID` with the expression `(auth.uid() = id)`.
            *   Create a policy for admins: `Enable full access for admin users` with the role `admin` and the expression `true`.
        *   **Other Data Tables:**
            *   For each table containing user data, add a `user_id` column.
            *   Enable RLS and create a policy: `Enable access to own data` with the expression `(auth.uid() = user_id)`.

6.  **We have to make sure when a user is deleted all it's data should be in queue for deletion of there should be some kind of mechanism for data sync.**
    *   **What:** Implement a user deletion flow.
    *   **How:**
        1.  Create a new API route (e.g., `api/delete-user`).
        2.  This API route will need to run with `service_role` privileges to delete a user from `auth.users`.
        3.  Use a Supabase Edge Function (`on_user_deleted`) triggered by a webhook on user deletion to delete all associated data. This is more robust than handling it in the API route.

7.  **Admin should have complete RLS rights of customer/client/applicant data (in case of abandoned account etc).**
    *   **What:** Grant admins full access to data.
    *   **How (To be done in Supabase Dashboard):**
        *   For each table, create a policy for the `admin` role that allows full access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) with the expression `true`.

### Developer Salt

The planned changes will significantly improve the security and reliability of the application by fixing critical authorization flaws and data integrity issues.
Implementing a proper data fetching strategy and server-side logic will create a more robust and scalable foundation for future development.