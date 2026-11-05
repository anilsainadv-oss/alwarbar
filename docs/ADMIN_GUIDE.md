# Administrator Guide — Two Separate Panels

## 1. Dual-Panel Architecture

To guarantee cybersecurity and client-lawyer privilege, administrative privileges are partitioned into two strictly separated interfaces:

```text
┌─────────────────────────────────────────────────────────────┐
│                    ALWAR ADVOCATES PORTAL                   │
├──────────────────────────────┬──────────────────────────────┤
│      PUBLIC PORTAL ADMIN     │     MY CASE SERVICE ADMIN    │
│      Route: /public-admin    │      Route: /case-admin      │
├──────────────────────────────┼──────────────────────────────┤
│ • Public legal content       │ • System health & telemetry  │
│ • Advocate verification      │ • AI token & quota limits    │
│ • Rajasthan welfare schemes  │ • Tenant account status      │
│ • Forms & court notices      │ • Security & audit logs      │
│ • Community forum moderation │ • Data retention policies    │
│                              │ ❌ NO ACCESS TO PRIVATE      │
│                              │    ADVOCATE CASE FILES       │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Public Portal Admin Guide (`/public-admin`)

### Verifying Advocate Directory Profiles
1. Navigate to `/public-admin/advocates`.
2. View pending advocate enrollment verification requests.
3. Review Bar Council of Rajasthan enrollment number and chambers details.
4. Click **Verify Profile** to confer the verified golden tick badge on the public directory.

### Publishing Rajasthan Welfare Updates
1. Navigate to `/public-admin/welfare`.
2. Click **Add Welfare Scheme**.
3. Fill in mandatory fields: Scheme Name, Issuing Authority (e.g. "Bar Council of Rajasthan"), Official Source URL, Eligibility Criteria, Benefits, and Required Documents.
4. Set status to **Published**.

### Moderating Forum Content
1. Navigate to `/public-admin/forum`.
2. Review reported community discussions or replies.
3. Actions available: **Dismiss Report**, **Lock Discussion**, or **Hide Post**.

---

## 3. My Case Service Admin Guide (`/case-admin`)

### Zero-Knowledge Policy
The My Case administrator panel is engineered with zero-knowledge constraints:
- Case titles, CNR numbers, client rosters, and document contents are masked or inaccessible.
- Administrators can view aggregate storage used (e.g., "Advocate Sharma: 14 MB used across 8 cases") but cannot inspect the contents of files.

### Emergency Support Access Workflow
If a user requests account recovery assistance:
1. The user must initiate an explicit support ticket with a signed consent token.
2. The administrator performs operational tasks (e.g. sending a password reset link) through `/case-admin/support`.
3. Every administrative action generates an immutable record in `audit_logs`.
