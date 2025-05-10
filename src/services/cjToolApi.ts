import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/cj-tool';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 定义通用的响应类型
export interface ApiResponse<T> { // 添加 export
    success: boolean;
    data?: T;
    error?: string;
}

// 具体功能的返回数据类型
export interface GenerateSignatureData { // 添加 export
    signature: string;
}
export interface RefactorVariableData { // 添加 export
    refactoredCode: string;
}
export interface GenerateDocumentData { // 添加 export
    documentedCode: string;
}
export interface FoldConstantData { // 添加 export
    foldedCode: string;
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

    generateDocument: async (code: string, path: string): Promise<ApiResponse<GenerateDocumentData>> => {
        try {
            const response = await apiClient.post<ApiResponse<GenerateDocumentData>>('/generate-document', { code, path });
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
};