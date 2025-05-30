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
                <n-select v-model:value="selectedOperation" :options="operationOptions" :consistent-menu-width="false"/>
                <n-button @click="showControlsModal = true" type="default">
                    配置
                </n-button>
                <n-button type="primary" @click="processCode" :loading="isLoading">
                    处理
                </n-button>
            </n-flex>
        </n-layout-header>

        <n-layout-content>
            <n-split direction="horizontal" :min=0.2 :max=0.8 resizable>
                <template #1>
                    <n-card title="输入" style="height: 100%; display: flex; flex-direction: column;"
                        :content-style="{ display: 'flex' }">
                        <n-input type="textarea" v-model:value="inputCode" placeholder="Enter Cangjie code here..."
                            :resizable="false" style="height: 100%;"
                            :input-props="{ style: { fontSize: editorFontSize + 'px' }, onKeydown: handleInputKeydown }" />
                    </n-card>
                </template>

                <template #2>
                    <n-card title="输出" style="height: 100%; display: flex; flex-direction: column"
                        :content-style="{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }">
                        <div v-if="isLoading"
                            style="display: flex; justify-content: center; align-items: center; flex-grow: 1;">
                            <n-spin size="large" />
                        </div>
                        <div v-else-if="errorMessage"
                            style="display: flex; flex-direction: column; gap: 12px; height: 100%;">
                            <n-alert title="处理失败" type="error" closable
                                @close="errorMessage = null; errorNodeInfo = null">
                                {{ errorMessage }}
                            </n-alert>
                            <div v-if="errorNodeInfo" style="flex: 1; overflow: auto; min-height: 0;">
                                <n-log :log="errorNodeInfo" language="cangjie" trim style="height: 100%;"/>
                            </div>
                        </div>
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
import { ref, watch, inject, onMounted, type Ref, nextTick } from 'vue';
import { useMessage } from 'naive-ui';
import { cjToolService, updateApiBaseUrl, type ApiResponse, type ApiErrorData, type GenerateSignatureData, type RefactorVariableData, type GenerateDocumentData, type FoldConstantData, type FindUnusedVariablesData } from './services/cjToolApi';

const message = useMessage();

const injectedIsDarkMode = inject<Ref<boolean>>('isDarkMode', ref(false));

type Operation = 'generateSignature' | 'refactorVariable' | 'generateDocument' | 'foldConstant' | 'findUnusedVariables';

const selectedOperation = ref<Operation>('generateSignature');
const operationOptions = [
    { label: '生成代码签名', value: 'generateSignature' },
    { label: '重命名标识符', value: 'refactorVariable' },
    { label: '生成注释文档', value: 'generateDocument' },
    { label: '折叠代码常量', value: 'foldConstant' },
    { label: '查找无用变量', value: 'findUnusedVariables' },
];

const getSelectedOperationLabel = () => {
    const option = operationOptions.find(option => option.value === selectedOperation.value);
    return option ? option.label : selectedOperation.value;
};

const inputCode = ref<string>(`class AdvancedCalculator <: ILogger {
    public var lastResult: Float64 = 0.0
    private var calculationCount: Int64 = 0
    private var historyCapacity: Int64 = 100 * 2
    private var unusedProperty: String = "This is not used"
    
    public func log(message: String): Bool {
        if(logLevel > 0) {
            return true
        }
        let unusedInLog: Int64 = 55
        return false
    }

    public func performCalculation(operand1: Float64, operand2: Float64, operationType: String): Float64 {
        var result: Float64 = 0.0
        let fixedBonus: Float64 = 1.0 + 0.5 * 2.0
        var unusedLocalInCalc: Bool = true
        
        if(operationType == "add") {
            result = operand1 + operand2 + fixedBonus
        } else if(operationType == "subtract") {
            result = operand1 - operand2 + fixedBonus
        } else if(operationType == "multiply") {
            let interimResult = operand1 * operand2
            result = interimResult *(10 / 4) + fixedBonus
        } else if(operationType == "divide") {
            if(operand2 != 0) {
                result = operand1 / operand2 + fixedBonus
            } else {
                result = 0.0
            }
        }
        
        return result
    }
    
    private func utilityHelper(value: Int64, unusedParam: Bool) {
        let localConstant =(2 + 3) * 4
        var tempVar = value + localConstant
        if(tempVar > 100) { }
    }
    
    func testRanges() {
        let r1 = 0 .. 10
        let r2 =(1 + 1) ..(5 * 2):(10 / 5)
        let r3 = 0 ..=(100 - 50)
        var unusedInRangeLoopVar = "test"
        
        for(i in r2) {
            let current = i
        }

        var test = 10
        for(j in 0..10+3){
            test = test + j
        }
    }
}

func formatGreeting(name: String, age: Int64): String {
    let baseGreeting = "Hello"
    let unusedGlobalFuncVar: Int64 = 1000
    if(age >(10 + 8)) {
        return "you are an adult of age"
    } else {
        return "you are young at age"
    }
}

class DataProcessor {
    var data: Array < Int64 >
    var processed: Bool = false
    
    public func processData() {
        for(item in data) {
            let tempItem = item *(1 + 1)
            tempItem += 1
        }
        processed = true
    }
}`);
const path = ref<string>('AdvancedCalculator.performCalculation');
const oldName = ref<string>('operand2');
const newName = ref<string>('newName');
const apiKey = ref<string>('');
const DEFAULT_APIKEY = 'sk-pqwthdmbesdwldfllezgjildshqhezpwzjbupqolzijkxjoa'
const apiUrl = ref<string>('');
const DEFAULT_APIURL = 'http://api.siliconflow.cn/v1/chat/completions'
const modelName = ref<string>('');
const DEFAULT_MODELNAME = 'deepseek-ai/DeepSeek-V3'

const editorFontSize = ref<number>(13);
const EDITOR_FONT_SIZE_STORAGE_KEY = 'cangjie-editor-font-size';

const backendApiUrl = ref<string>('');
const DEFAULT_BACKEND_API_URL = 'http://10.128.50.121:5174/api/cj-tool';
const BACKEND_API_URL_STORAGE_KEY = 'cangjie-backend-api-url';

const outputResult = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const errorNodeInfo = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const showControlsModal = ref<boolean>(false);

onMounted(() => {
    const storedApiUrl = localStorage.getItem(BACKEND_API_URL_STORAGE_KEY);
    backendApiUrl.value = storedApiUrl || DEFAULT_BACKEND_API_URL;
    updateApiBaseUrl(backendApiUrl.value);

    apiKey.value = localStorage.getItem('cangjie-api-key') || DEFAULT_APIKEY;
    apiUrl.value = localStorage.getItem('cangjie-api-url-docgen') || DEFAULT_APIURL;
    modelName.value = localStorage.getItem('cangjie-model-name') || DEFAULT_MODELNAME;

    const storedFontSize = localStorage.getItem(EDITOR_FONT_SIZE_STORAGE_KEY);
    if (storedFontSize) {
        const parsedSize = parseInt(storedFontSize, 10);
        if (!isNaN(parsedSize) && parsedSize >= 8 && parsedSize <= 36) {
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

const handleInputKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
        event.preventDefault();

        const target = event.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const tabCharacter = '    ';

        inputCode.value = inputCode.value.substring(0, start) +
            tabCharacter +
            inputCode.value.substring(end);

        nextTick(() => {
            target.selectionStart = target.selectionEnd = start + tabCharacter.length;
        });
    }
};

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
    errorNodeInfo.value = null;

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
                    if (response.data && (response.data as ApiErrorData).details?.nodeInfo) {
                        errorNodeInfo.value = (response.data as ApiErrorData).details!.nodeInfo!;
                    }
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
                    if (response.data && (response.data as ApiErrorData).details?.nodeInfo) {
                        errorNodeInfo.value = (response.data as ApiErrorData).details!.nodeInfo!;
                    }
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
                    if (response.data && (response.data as ApiErrorData).details?.nodeInfo) {
                        errorNodeInfo.value = (response.data as ApiErrorData).details!.nodeInfo!;
                    }
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
                    if (response.data && (response.data as ApiErrorData).details?.nodeInfo) {
                        errorNodeInfo.value = (response.data as ApiErrorData).details!.nodeInfo!;
                    }
                }
                break;
            case 'findUnusedVariables':
                response = await cjToolService.findUnusedVariables(inputCode.value);
                if (response.success && response.data) {
                    const modifiedCode = (response.data as FindUnusedVariablesData).modifiedCode;
                    outputResult.value = modifiedCode;
                    message.success('无用变量已标记！');
                } else {
                    errorMessage.value = response.error || '查找无用变量失败。';
                    if (response.data && (response.data as ApiErrorData).details?.nodeInfo) {
                        errorNodeInfo.value = (response.data as ApiErrorData).details!.nodeInfo!;
                    }
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
        const rawErrorData = error.response?.data;
        if (rawErrorData && rawErrorData.data && (rawErrorData.data as ApiErrorData).details?.nodeInfo) {
            errorNodeInfo.value = (rawErrorData.data as ApiErrorData).details!.nodeInfo!;
        }
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