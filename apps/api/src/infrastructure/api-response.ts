/**
 * Standardized API Response Interfaces for a Professional SaaS Backend
 */

export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
  metadata?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Generates a standardized success response.
 * @param data The main payload
 * @param message Optional success message
 * @param metadata Pagination or other context
 * @param requestId Optional request correlation ID
 */
export function successResponse<T>(
  data: T,
  message?: string,
  metadata?: Record<string, any>,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    metadata,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Generates a standardized error response.
 * @param code High-level error code (e.g., 'VALIDATION_ERROR', 'UNAUTHORIZED')
 * @param message Human-readable error message
 * @param details Detailed error payload (e.g., Zod issues)
 * @param requestId Optional request correlation ID
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
}
