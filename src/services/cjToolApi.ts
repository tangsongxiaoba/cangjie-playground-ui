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
    data?: T;
    error?: string;
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

export const cjToolService = {
    generateSignature: async (code: string): Promise<ApiResponse<GenerateSignatureData>> => {
        try {
            const response = await apiClient.post<ApiResponse<GenerateSignatureData>>('/generate-signature', { code });
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred while generating signature.';
            return { success: false, error: errorMessage };
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
            const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred while refactoring variable.';
            return { success: false, error: errorMessage };
        }
    },

    generateDocument: async (code: string, path: string, apiKey: string, apiUrl: string, modelName: string): Promise<ApiResponse<GenerateDocumentData>> => {
        try {
            const response = await apiClient.post<ApiResponse<GenerateDocumentData>>('/generate-document', { code, path, apiKey, apiUrl, modelName});
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred while generating document.';
            return { success: false, error: errorMessage };
        }
    },

    foldConstant: async (code: string): Promise<ApiResponse<FoldConstantData>> => {
        try {
            const response = await apiClient.post<ApiResponse<FoldConstantData>>('/fold-constant', { code });
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred while folding constants.';
            return { success: false, error: errorMessage };
        }
    },

    findUnusedVariables: async (code: string): Promise<ApiResponse<FindUnusedVariablesData>> => {
        try {
            const response = await apiClient.post<ApiResponse<FindUnusedVariablesData>>('/find-unused-variables', { code });
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred while finding unused variables.';
            return { success: false, error: errorMessage };
        }
    },
};