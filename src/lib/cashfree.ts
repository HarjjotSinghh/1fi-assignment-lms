/**
 * Cashfree Secure ID API Service
 * DigiLocker integration for Aadhaar, PAN verification
 * 
 * API Reference: https://www.cashfree.com/docs/api-reference/vrs/v2/digilocker/
 */

// Environment configuration
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID || "";
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || "";
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || "sandbox";

const BASE_URL = CASHFREE_ENVIRONMENT === "production"
    ? "https://api.cashfree.com/verification"
    : "https://sandbox.cashfree.com/verification";

// Type definitions
export type DocumentType = "AADHAAR" | "PAN" | "DRIVING_LICENSE";
export type UserFlow = "signin" | "signup";
export type VerificationStatus = "PENDING" | "AUTHENTICATED" | "EXPIRED" | "CONSENT_DENIED";

export interface CreateDigiLockerUrlRequest {
    verificationId: string; // Unique ID for this verification (max 50 chars)
    documents: DocumentType[];
    redirectUrl: string;
    userFlow?: UserFlow;
}

export interface CreateDigiLockerUrlResponse {
    verification_id: string;
    reference_id: number;
    url: string;
    status: VerificationStatus;
    document_requested: DocumentType[];
    redirect_url: string;
    user_flow: UserFlow;
}

export interface UserDetails {
    name?: string;
    dob?: string;
    gender?: string;
    eaadhaar?: string;
    mobile?: string;
}

export interface VerificationStatusResponse {
    user_details: UserDetails;
    status: VerificationStatus;
    document_requested: DocumentType[];
    document_consent: DocumentType[] | null;
    document_consent_validity: string | null;
    verification_id: string;
    reference_id: number;
}

export interface AadhaarDocument {
    reference_id: number;
    verification_id: string;
    status: "SUCCESS" | "AADHAAR_NOT_LINKED";
    uid: string;
    care_of: string;
    dob: string;
    gender: string;
    name: string;
    photo_link: string;
    split_address: {
        country: string;
        dist: string;
        house: string;
        landmark: string;
        pincode: string;
        po: string;
        state: string;
        street: string;
        subdist: string;
        vtc: string;
    };
    year_of_birth: number;
    xml_file: string;
    message: string;
}

export interface PanDocument {
    reference_id: number;
    verification_id: string;
    status: string;
    pan: string;
    name: string;
    dob: string;
    message: string;
}

export interface CashfreeError {
    message: string;
    code: string;
    type: string;
}

// Helper function for API requests
async function cashfreeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_CLIENT_ID,
        "x-client-secret": CASHFREE_CLIENT_SECRET,
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        const error = data as CashfreeError;
        throw new Error(error.message || `Cashfree API error: ${response.status}`);
    }

    return data as T;
}

/**
 * Generate a unique verification ID
 * Format: KYC-{timestamp}-{random}
 */
export function generateVerificationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `KYC-${timestamp}-${random}`;
}

/**
 * Create DigiLocker URL for document verification
 * 
 * This generates a URL that redirects the user to DigiLocker
 * for consent and document sharing.
 * The URL is valid for 10 minutes.
 */
export async function createDigiLockerUrl(
    request: CreateDigiLockerUrlRequest
): Promise<CreateDigiLockerUrlResponse> {
    return cashfreeRequest<CreateDigiLockerUrlResponse>("/digilocker", {
        method: "POST",
        body: JSON.stringify({
            verification_id: request.verificationId,
            document_requested: request.documents,
            redirect_url: request.redirectUrl,
            user_flow: request.userFlow || "signup",
        }),
    });
}

/**
 * Get verification status
 * 
 * Check the status of a DigiLocker verification request.
 * Query by either verificationId or referenceId.
 */
export async function getVerificationStatus(
    params: { verificationId?: string; referenceId?: number }
): Promise<VerificationStatusResponse> {
    const searchParams = new URLSearchParams();

    if (params.verificationId) {
        searchParams.set("verification_id", params.verificationId);
    }
    if (params.referenceId) {
        searchParams.set("reference_id", params.referenceId.toString());
    }

    return cashfreeRequest<VerificationStatusResponse>(
        `/digilocker?${searchParams.toString()}`
    );
}

/**
 * Get document from DigiLocker
 * 
 * Retrieve document details after user has given consent.
 * Document types: AADHAAR, PAN, DRIVING_LICENSE
 */
export async function getDocument(
    documentType: DocumentType,
    params: { verificationId?: string; referenceId?: number }
): Promise<AadhaarDocument | PanDocument> {
    const searchParams = new URLSearchParams();

    if (params.verificationId) {
        searchParams.set("verification_id", params.verificationId);
    }
    if (params.referenceId) {
        searchParams.set("reference_id", params.referenceId.toString());
    }

    return cashfreeRequest<AadhaarDocument | PanDocument>(
        `/digilocker/document/${documentType}?${searchParams.toString()}`
    );
}

/**
 * Webhook event types from Cashfree DigiLocker
 */
export type DigiLockerWebhookEvent =
    | "DIGILOCKER_VERIFICATION_SUCCESS"
    | "DIGILOCKER_VERIFICATION_LINK_EXPIRED"
    | "DIGILOCKER_VERIFICATION_CONSENT_DENIED"
    | "DIGILOCKER_VERIFICATION_CONSENT_EXPIRED"
    | "DIGILOCKER_VERIFICATION_FAILURE";

export interface DigiLockerWebhookPayload {
    event_type: DigiLockerWebhookEvent;
    event_time: string;
    version: string;
    data: {
        user_details: UserDetails;
        status: VerificationStatus;
        document_requested: DocumentType[];
        document_consent: DocumentType[];
        document_consent_validity: string;
        verification_id: string;
        reference_id: number;
    };
}

/**
 * Check if Cashfree credentials are configured
 */
export function isCashfreeConfigured(): boolean {
    return Boolean(CASHFREE_CLIENT_ID && CASHFREE_CLIENT_SECRET);
}

/**
 * Get Cashfree configuration status
 */
export function getCashfreeConfig() {
    return {
        isConfigured: isCashfreeConfigured(),
        environment: CASHFREE_ENVIRONMENT,
        baseUrl: BASE_URL,
    };
}
