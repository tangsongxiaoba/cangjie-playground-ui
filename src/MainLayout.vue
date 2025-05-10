<template>
    <n-layout embedded style="height: 100vh;" content-style="display: flex; flex-direction: column;">
        <n-layout-header style="padding: 12px 24px; display: flex; align-items: center; justify-content: space-between;"
            bordered>
            <n-h1 style="margin: 0; font-weight: bold;">
                <n-text type="primary">仓颉 Playground</n-text>
            </n-h1>
            <n-flex :wrap="false">
                <div class="compact-input-number-form-item">
                    <n-input-number v-model:value="editorFontSize" :min="8" :max="36">
                        <template #suffix>px</template>
                    </n-input-number>
                </div>
                <n-select v-model:value="selectedOperation" :options="operationOptions" />
                <n-button @click="showControlsModal = true" type="default">
                    配置
                </n-button>
                <n-button type="primary" @click="processCode" :loading="isLoading">
                    处理
                </n-button>
            </n-flex>
        </n-layout-header>

        <n-layout-content>
            <n-split direction="horizontal" :default-size="0.6" :min=0.2 :max=0.8 resizable>
                <template #1>
                    <n-card title="输入" style="height: 100%; display: flex; flex-direction: column;"
                        :content-style="{ display: 'flex' }">
                        <n-input type="textarea" v-model:value="inputCode" placeholder="Enter Cangjie code here..."
                            :resizable="false" style="height: 100%;"
                            :input-props="{ style: { fontSize: editorFontSize + 'px' } }" />
                    </n-card>
                </template>

                <template #2>
                    <n-card title="输出" style="height: 100%; display: flex; flex-direction: column"
                        :content-style="{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }">
                        <div v-if="isLoading"
                            style="display: flex; justify-content: center; align-items: center; flex-grow: 1;">
                            <n-spin size="large" />
                        </div>
                        <n-alert v-else-if="errorMessage" title="处理失败" type="error" closable
                            @close="errorMessage = null" style="margin: 0px 24px">
                            {{ errorMessage }}
                        </n-alert>
                        <div v-else-if="outputResult" style="overflow: auto; height: 100%; flex-grow: 1;
                        border: 1px solid var(--n-border-color); border-radius: var(--n-border-radius); 
                        padding: 6px; box-sizing: border-box;">
                            <n-code :code="outputResult" language="cangjie" show-line-numbers
                                :style="{ padding: '0px', paddingBottom: '12px', fontSize: editorFontSize + 'px' }" />
                        </div>
                        <div v-else
                            style="display: flex; justify-content: center; align-items: center; height: 100%; color: #aaa; flex-grow: 1;">
                            处理结果将显示在此处
                        </div>
                    </n-card>
                </template>

            </n-split>
        </n-layout-content>

        <n-modal v-model:show="showControlsModal" preset="card" title="配置" style="width: 40%;"
            content-style="gap: 12px; display: flex; flex-direction: column;" draggable>
            <n-card :title="getSelectedOperationLabel()"
                content-style="gap: 8px; display: flex; flex-direction: column;"
                v-if="selectedOperation === 'refactorVariable' || selectedOperation === 'generateDocument'"
                style="--n-padding-top: 8px; --n-padding-bottom: 8px; --n-padding-left: 12px; --n-padding-right: 12px;">

                <template v-if="selectedOperation === 'refactorVariable'">
                    <n-form label-width="auto" label-placement="left">
                        <n-form-item label="作用域：" :show-feedback="false" :style="{ marginBottom: '8px' }">
                            <n-input v-model:value="path" placeholder="形如“函数名”、“类名”、“类名.函数名”的格式" />
                        </n-form-item>
                        <n-form-item label="标识符：" :show-feedback="false" :style="{ marginBottom: '8px' }">
                            <n-input v-model:value="oldName" placeholder="需要重命名的标识符" />
                        </n-form-item>
                        <n-form-item label="新名称：" :show-feedback="false">
                            <n-input v-model:value="newName" placeholder="新标识符名称" />
                        </n-form-item>
                    </n-form>
                </template>

                <template v-if="selectedOperation === 'generateDocument'">
                    <n-form label-width="auto" label-placement="left">
                        <n-form-item label="作用域：" :show-feedback="false" :style="{ marginBottom: '8px' }">
                            <n-input v-model:value="path" placeholder="形如“函数名”、“类名”、“类名.函数名”的格式" />
                        </n-form-item>
                        <n-form-item label="API 密钥：" :show-feedback="false" :style="{ marginBottom: '8px' }">
                            <n-input v-model:value="apiKey" />
                        </n-form-item>
                        <n-form-item label="API 地址：" :show-feedback="false" :style="{ marginBottom: '8px' }">
                            <n-input v-model:value="apiUrl" />
                        </n-form-item>
                        <n-form-item label="模型名称：" :show-feedback="false">
                            <n-input v-model:value="modelName" />
                        </n-form-item>
                    </n-form>
                </template>
            </n-card>

            <n-form-item label="后端地址" label-placement="top" :show-feedback="false">
                <n-input v-model:value="backendApiUrl" />
            </n-form-item>
            <n-space align="center">
                <n-switch v-model:value="injectedIsDarkMode" />
                <span>{{ injectedIsDarkMode ? '暗黑模式' : '亮色模式' }}</span>
            </n-space>
        </n-modal>
    </n-layout>
</template>

<script setup lang="ts">
import { ref, watch, inject, onMounted, computed, type Ref } from 'vue';
import { useMessage } from 'naive-ui';
import { cjToolService, updateApiBaseUrl, type ApiResponse, type GenerateSignatureData, type RefactorVariableData, type GenerateDocumentData, type FoldConstantData } from './services/cjToolApi';

const message = useMessage();

const injectedIsDarkMode = inject<Ref<boolean>>('isDarkMode', ref(false));

type Operation = 'generateSignature' | 'refactorVariable' | 'generateDocument' | 'foldConstant';

const selectedOperation = ref<Operation>('generateSignature');
const operationOptions = [
    { label: '生成代码签名', value: 'generateSignature' },
    { label: '重命名标识符', value: 'refactorVariable' },
    { label: '生成注释文档', value: 'generateDocument' },
    { label: '折叠代码常量', value: 'foldConstant' },
];

const getSelectedOperationLabel = () => {
    const option = operationOptions.find(option => option.value === selectedOperation.value);
    return option ? option.label : selectedOperation.value;
};

const inputCode = ref<string>(`class C <: I1 {
    private var mySize = 1*2

    func myfunc(a: Float64, n: Int64) : Float64 {
        for(i in mySize..=n) {
            a *= (i + 2 * 42) + mySize
        }
        return a
    }

    func myfunc2(n: Int64) : Float64 {
        var a = 1 + 2
        for(i in 0..=n) {
            a *= (i + 3 * 4)
        }
        let b = ((3 * 4) + 5) + (a + 4) * (5 * 3 + 9)
        var c = 31 / 4
        var d = 114.514 + 111111000
        return a / ((2.5 * 100) + 4 * a + 4)
    }

    func testRange() {
        let r5 = 0..10   
        let r6 = 0..10 : 1 + 2

        let r7 = 10..3*4+2 : 1 
        let r8 = 0..10 : 1 + 2 - 3
        let r9 = 10..=0 : (1 + 2) * 3
        let r10 = (1+2-3+4-5+6)..=10 : -1
    }
}`);
const path = ref<string>('');
const oldName = ref<string>('');
const newName = ref<string>('');
const apiKey = ref<string>('');
const apiUrl = ref<string>('');
const modelName = ref<string>('');

const editorFontSize = ref<number>(13);
const EDITOR_FONT_SIZE_STORAGE_KEY = 'cangjie-editor-font-size';

const backendApiUrl = ref<string>('');
const DEFAULT_BACKEND_API_URL = 'http://localhost:8080/api/cj-tool';
const BACKEND_API_URL_STORAGE_KEY = 'cangjie-backend-api-url';

const outputResult = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const showControlsModal = ref<boolean>(false);

onMounted(() => {
    const storedApiUrl = localStorage.getItem(BACKEND_API_URL_STORAGE_KEY);
    backendApiUrl.value = storedApiUrl || DEFAULT_BACKEND_API_URL;
    updateApiBaseUrl(backendApiUrl.value);

    apiKey.value = localStorage.getItem('cangjie-api-key') || '';
    apiUrl.value = localStorage.getItem('cangjie-api-url-docgen') || '';
    modelName.value = localStorage.getItem('cangjie-model-name') || '';

    const storedFontSize = localStorage.getItem(EDITOR_FONT_SIZE_STORAGE_KEY);
    if (storedFontSize) {
        const parsedSize = parseInt(storedFontSize, 10);
        if (!isNaN(parsedSize) && parsedSize >= 8 && parsedSize <= 36) { // 简单校验
            editorFontSize.value = parsedSize;
        }
    }
});

watch(backendApiUrl, (newUrl) => {
    localStorage.setItem(BACKEND_API_URL_STORAGE_KEY, newUrl);
    updateApiBaseUrl(newUrl);
});

watch(apiKey, (val) => localStorage.setItem('cangjie-api-key', val));
watch(apiUrl, (val) => localStorage.setItem('cangjie-api-url-docgen', val));
watch(modelName, (val) => localStorage.setItem('cangjie-model-name', val));

watch(editorFontSize, (newSize) => {
    if (newSize !== null && newSize >= 8 && newSize <= 36) {
        localStorage.setItem(EDITOR_FONT_SIZE_STORAGE_KEY, newSize.toString());
    }
});

const processCode = async () => {
    if (showControlsModal.value) {
        showControlsModal.value = false;
    }
    if (!inputCode.value.trim()) {
        message.error('Input code cannot be empty.');
        return;
    }

    isLoading.value = true;
    outputResult.value = null;
    errorMessage.value = null;

    try {
        let response: ApiResponse<any>;
        switch (selectedOperation.value) {
            case 'generateSignature':
                response = await cjToolService.generateSignature(inputCode.value);
                if (response.success && response.data) {
                    outputResult.value = (response.data as GenerateSignatureData).signature;
                    message.success('代码签名已生成！');
                } else {
                    errorMessage.value = response.error || '生成签名失败。';
                }
                break;
            case 'refactorVariable':
                if (!path.value.trim() || !oldName.value.trim() || !newName.value.trim()) {
                    message.warning("请在配置中填写作用域、旧标识符和新名称。");
                    isLoading.value = false;
                    return;
                }
                response = await cjToolService.refactorVariable(inputCode.value, path.value, oldName.value, newName.value);
                if (response.success && response.data) {
                    const newCode = (response.data as RefactorVariableData).refactoredCode;
                    outputResult.value = newCode;
                    message.success('标识符已重命名！');
                } else {
                    errorMessage.value = response.error || '重命名标识符失败。';
                }
                break;
            case 'generateDocument':
                if (!path.value.trim()) {
                    message.warning("请在配置中填写作用域。");
                    isLoading.value = false;
                    return;
                }
                if (!apiKey.value.trim() || !apiUrl.value.trim() || !modelName.value.trim()) {
                    message.warning("请在配置中填写API密钥、API地址和模型名称以生成文档。");
                    isLoading.value = false;
                    return;
                }
                response = await cjToolService.generateDocument(inputCode.value, path.value, apiKey.value, apiUrl.value, modelName.value);
                if (response.success && response.data) {
                    const newCode = (response.data as GenerateDocumentData).documentedCode;
                    outputResult.value = newCode;
                    message.success('注释文档已生成！');
                } else {
                    errorMessage.value = response.error || '生成注释文档失败。';
                }
                break;
            case 'foldConstant':
                response = await cjToolService.foldConstant(inputCode.value);
                if (response.success && response.data) {
                    const newCode = (response.data as FoldConstantData).foldedCode;
                    outputResult.value = newCode;
                    message.success('代码常量已折叠！');
                } else {
                    errorMessage.value = response.error || '折叠代码常量失败。';
                }
                break;
            default:
                errorMessage.value = '无效的操作类型。';
                message.error('无效的操作类型。');
        }
        if (errorMessage.value && !outputResult.value) {
            message.error(`错误: ${errorMessage.value}`);
        }
    } catch (error: any) {
        errorMessage.value = `客户端请求错误: ${error.message || '未知错误'}`;
        message.error(errorMessage.value);
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
:deep(.n-input__textarea-el) {
    font-family: monospace !important;
    line-height: 1.5 !important;
}

:deep(.n-card__content) {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.compact-input-number-form-item :deep(.n-input__input) {
    width: 2ch;
    text-align: end;
}
</style>