# YMI Business Directory - Lead CRM & Inquiry System

> **Historical feature document:** Its `region_admin` and older access descriptions are obsolete. Use [`docs/YMBD_SOURCE_OF_TRUTH.md`](docs/YMBD_SOURCE_OF_TRUTH.md) for current lead security, service-role boundaries, BCC behavior, and Turnstile status.

This document outlines the architecture, database schema, RLS policies, and email rendering pipeline of the customer inquiry and Lead CRM systems in the YMI South West India Region (SWIR) Business Directory.

---

## 1. High-Level Inquiry Flow

When a user visits a business listing detail page, they can submit an inquiry through the interactive sidebar or modal:

```
[ Visitor fills Enquiry Form ]
             │
             ▼
    [ sendLead Server Action ]
             │
   ┌─────────┴─────────┐
   ▼                   ▼
[ Save to Leads Table ] [ Render HTML Email via React Email ]
                       │
                       ▼
                 [ Resend API ]
                       │
                       ▼
           [ Business Owner Inbox ]
```

1.  **Form Submission**: The visitor fills out the name, email, phone, and message fields on the business listing spotlight page (`/directory/[id]`).
2.  **Server Action (`sendLead.ts`)**: Initiates validation, database entry, and email delivery.
3.  **Database Storage**: Stores the enquiry details securely inside the PostgreSQL `leads` table.
4.  **React Email Rendering**: Generates a responsive, type-safe HTML template (`LeadEmail.tsx`) using `@react-email/render`.
5.  **Resend Dispatch**: Dispatches the rendered HTML template via the Resend API to the business owner's contact email.

---

## 2. The `leads` Table Schema

The database tracks inquiries locally inside the `leads` table for CRM listing capabilities on the owner's dashboard:

| Column Name | PostgreSQL Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` (PK) | NO | Unique identifier for each lead. |
| `business_id` | `uuid` (FK) | NO | References `public.businesses(id)` (ON DELETE CASCADE). |
| `sender_name` | `text` | NO | The name of the client submitting the inquiry. |
| `sender_email` | `text` | NO | Email address of the sender. |
| `sender_phone` | `text` | YES | Optional phone number of the sender. |
| `message` | `text` | NO | Detail query submitted by the client. |
| `created_at` | `timestamptz` | NO | Creation timestamp (defaults to UTC now). |

---

## 3. Row-Level Security & CRM Queries

### RLS Policies
To prevent unauthorized users from harvesting leads and user PII, RLS rules are strictly enforced:

```sql
-- Allow anonymous visitors or logged-in members to submit contact inquiries (insert leads)
CREATE POLICY insert_leads ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow admins or the respective business owner to read leads
CREATE POLICY select_leads ON public.leads FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('super_admin'::app_role, 'region_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);
```

### Dashboard CRM Inbox
The Lead CRM page (`/dashboard/leads`) renders all leads for the business owner.
*   **Access Privilege**: Scoped strictly to users with the role of `business_owner`, `region_admin`, or `super_admin`.
*   **Security Gate**: Uses the admin client `createAdminClient` to query the list of leads matching the user's business IDs, circumventing potential SELECT RLS blocks on deep relations and enabling a fast, secure CRM interface.

---

## 4. Email Pipeline Rendering (React 19 Compatibility)

Because of rendering package updates, standard email render methods can trigger compatibility issues under React 19. The project avoids this by using direct rendering via `React.createElement` and the `@react-email/render` library:

```typescript
const htmlContent = await render(React.createElement(LeadEmail, {
  senderName: validatedData.name,
  senderEmail: validatedData.email,
  senderPhone: validatedData.phone,
  message: validatedData.message,
  businessName: business.brand_name || "your business",
}));
```

This HTML output is then passed directly as the `html` payload within the Resend SDK `emails.send` client.
