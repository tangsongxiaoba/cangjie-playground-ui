import axios, { type AxiosInstance } from 'axios';

const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/cj-tool';

let apiClient: AxiosInstance;

export function updateApiBaseUrl(baseUrl: string) {
    const effectiveBaseUrl = baseUrl || DEFAULT_API_BASE_URL;
    apiClient = axios.create({
        baseURL: effectiveBaseUrl,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

updateApiBaseUrl(localStorage.getItem('cangjie-backend-api-url') || DEFAULT_API_BASE_URL);

export interface ApiResponse<T> {
    success: boolean;
    data?: T | ApiErrorData;
    error?: string;
}

export interface ApiErrorDataDetails {
    nodeInfo?: string;
}

export interface ApiErrorData {
    details?: ApiErrorDataDetails;
}

export interface GenerateSignatureData {
    signature: string;
}
export interface RefactorVariableData {
    refactoredCode: string;
}
export interface GenerateDocumentData {
    documentedCode: string;
}
export interface FoldConstantData {
    foldedCode: string;
}
export interface FindUnusedVariablesData {
    modifiedCode: string;
}

function handleErrorResponse(error: any): ApiResponse<never> {
    const errorResponseData = error.response?.data;
    const errorMessage = errorResponseData?.error || error.message || 'An unknown error occurred.';

    let response: ApiResponse<never> = { success: false, error: errorMessage };

    if (errorResponseData && typeof errorResponseData === 'object' && 'data' in errorResponseData) {
        const nestedData = errorResponseData.data as ApiErrorData;
        if (nestedData && nestedData.details) {
            response.data = { details: nestedData.details };
        }
    }
    return response;
}

export const cjToolService = {
    generateSignature: async (code: string): Promise<ApiResponse<GenerateSignatureData>> => {
        try {
            const response = await apiClient.post<ApiResponse<GenerateSignatureData>>('/generate-signature', { code });
            return response.data;
        } catch (error: any) {
            return handleErrorResponse(error);
        }
    },

    refactorVariable: async (
        code: string,
        path: string,
        oldName: string,
        newName: string
    ): Promise<ApiResponse<RefactorVariableData>> => {
        try {
            const response = await apiClient.post<ApiResponse<RefactorVariableData>>('/refactor-variable', {
                code,
                path,
                oldName,
                newName,
            });
            return response.data;
        } catch (error: any) {
            return handleErrorResponse(error);
        }
    },

    generateDocument: async (code: string, path: string, apiKey: string, apiUrl: string, modelName: string): Promise<ApiResponse<GenerateDocumentData>> => {
        try {
            const response = await apiClient.post<ApiResponse<GenerateDocumentData>>('/generate-document', { code, path, apiKey, apiUrl, modelName });
            return response.data;
        } catch (error: any) {
            return handleErrorResponse(error);
        }
    },

    foldConstant: async (code: string): Promise<ApiResponse<FoldConstantData>> => {
        try {
            const response = await apiClient.post<ApiResponse<FoldConstantData>>('/fold-constant', { code });
            return response.data;
        } catch (error: any) {
            return handleErrorResponse(error);
        }
    },

    findUnusedVariables: async (code: string): Promise<ApiResponse<FindUnusedVariablesData>> => {
        try {
            const response = await apiClient.post<ApiResponse<FindUnusedVariablesData>>('/find-unused-variables', { code });
            return response.data;
        } catch (error: any) {
            return handleErrorResponse(error);
        }
    },
};