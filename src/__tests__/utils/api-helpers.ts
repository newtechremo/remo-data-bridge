import { NextRequest } from "next/server";

// Create a mock NextRequest
export const createMockRequest = (
  method: string,
  url: string,
  body?: object,
  headers?: Record<string, string>
): NextRequest => {
  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3015"), requestInit);
};

// Create GET request
export const createGetRequest = (url: string, params?: Record<string, string>) => {
  const urlObj = new URL(url, "http://localhost:3015");
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
  }
  return createMockRequest("GET", urlObj.toString());
};

// Create POST request
export const createPostRequest = (url: string, body: object) => {
  return createMockRequest("POST", url, body);
};

// Create PATCH request
export const createPatchRequest = (url: string, body: object) => {
  return createMockRequest("PATCH", url, body);
};

// Create DELETE request
export const createDeleteRequest = (url: string) => {
  return createMockRequest("DELETE", url);
};

// Parse JSON response
export const parseJsonResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Assert successful response
export const expectSuccessResponse = async (response: Response) => {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  return parseJsonResponse(response);
};

// Assert error response
export const expectErrorResponse = async (response: Response, statusCode: number) => {
  expect(response.status).toBe(statusCode);
  return parseJsonResponse(response);
};

// Assert unauthorized response
export const expectUnauthorizedResponse = async (response: Response) => {
  return expectErrorResponse(response, 401);
};

// Assert forbidden response
export const expectForbiddenResponse = async (response: Response) => {
  return expectErrorResponse(response, 403);
};

// Assert not found response
export const expectNotFoundResponse = async (response: Response) => {
  return expectErrorResponse(response, 404);
};

// Assert bad request response
export const expectBadRequestResponse = async (response: Response) => {
  return expectErrorResponse(response, 400);
};
