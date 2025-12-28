# Planned Features

All features listed below have been implemented! ✅

1. **EMI Calculator** ✅
   - A tool for customers and agents to calculate monthly installments based on amount, tenure, and interest rate.
   - Location: `/tools/emi-calculator`
   - Component: `src/components/tools/emi-calculator.tsx`

2. **Document Management for Loans** ✅
   - Upload and manage documents (e.g., Aadhaar, PAN, Property Docs) for specific loans.
   - Location: `/loans/[id]/documents`
   - Component: `src/components/documents/document-upload.tsx`

3. **CSV Export for Applications** ✅
   - Export loan application data to CSV for external analysis or reporting.
   - API: `GET /api/export/applications`
   - Also available for: Loans, Customers, Collaterals

4. **Foreclosure Simulation** ✅
   - A tool to calculate the total amount required to close a loan early, including foreclosure charges and outstanding interest.
   - Location: `/tools/foreclosure-calculator`
   - Component: `src/components/tools/foreclosure-calculator.tsx`
   - Features: Interactive sliders, detailed breakdown, savings calculation, GST computation

5. **Audit Log Viewer** ✅
   - An administrator view to see a history of all sensitive actions taken within the system (who did what and when).
   - Location: `/activity`
   - Supports filtering by action type and entity type

6. **Notification Center** ✅
   - A centralized place for users to view system alerts, approval requests, and status updates.
   - Location: `/notifications`
   - Includes unread count badge in header

7. **Approval Workflow Dashboard** ✅
   - A dedicated interface for managers to review pending loan applications and disbursement requests.
   - Location: `/approvals`
   - Component: `src/app/(dashboard)/approvals/components/approvals-list.tsx`

8. **Customer Risk Profile Card** ✅
   - A visual component displaying a customer's credit score, risk category, and key financial indicators.
   - Component: `src/components/customers/risk-profile-card.tsx`
   - Integrated into customer detail page at `/customers/[id]`
   - Shows: Credit score gauge, LTV, payment history, collateral value, KYC status
   - Risk categories: Excellent, Good, Fair, Poor, High Risk

## Navigation

All tools are accessible from the sidebar under "Tools" section:
- EMI Calculator
- Foreclosure Calculator