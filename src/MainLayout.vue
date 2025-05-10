<template>
    <n-layout embedded style="height: 100vh;" content-style="display: flex; flex-direction: column;">
        <n-layout-header style="padding: 12px 24px; display: flex; align-items: center; justify-content: space-between;"
            bordered>
            <n-h1 style="margin: 0; font-weight: bold;">
                <n-text type="primary">仓颉 Playground</n-text>
            </n-h1>
            <n-flex :wrap="false">
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
                            :resizable="false" style="height: 100%;" />
                    </n-card>
                </template>

                <template #2>
                    <n-card title="输出" style="height: 100%; display: flex; flex-direction: column"
                        :content-style="{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '0px' }"
                        >
                        <div v-if="isLoading"
                            style="display: flex;justify-content: center;align-items: center;height: 100%;flex-grow: 1;">
                            <n-spin size="large" />
                        </div>
                        <n-alert v-else-if="errorMessage" title="处理失败" type="error" closable
                            @close="errorMessage = null" style="margin: 0px 24px">
                            {{ errorMessage }}
                        </n-alert>
                        <n-scrollbar v-else-if="outputResult" style="flex-grow: 1">
                            <n-code :code="outputResult" language="plaintext" show-line-numbers
                                style="padding: 16px; font-size: 13px" />
                        </n-scrollbar>
                        <div v-else
                            style="display: flex;justify-content: center;align-items: center;height: 100%;color: #aaa;flex-grow: 1;">
                            处理结果将显示在此处
                        </div>
                    </n-card>
                </template>
            </n-split>
        </n-layout-content>

        <n-modal v-model:show="showControlsModal" preset="card" title="配置" style="width: 60%;"
            content-style="gap: 12px; display: flex; flex-direction: column;">
            <n-card :title="getSelectedOperationLabel()"
                content-style="gap: 8px; display: flex; flex-direction: column;"
                v-if="selectedOperation === 'refactorVariable' || selectedOperation === 'generateDocument'"
                style="--n-padding-top: 8px; --n-padding-bottom: 8px; --n-padding-left: 12px; --n-padding-right: 12px;">

                <template v-if="selectedOperation === 'refactorVariable'">
                    <n-form-item label="作用域：" label-placement="left" :show-feedback="false">
                        <n-input v-model:value="path" placeholder="形如“函数名”、“类名”、“类名.函数名”的格式" />
                    </n-form-item>
                    <n-form-item label="标识符：" label-placement="left" :show-feedback="false">
                        <n-input v-model:value="oldName" placeholder="需要重命名的标识符" />
                    </n-form-item>
                    <n-form-item label="新名称：" label-placement="left" :show-feedback="false">
                        <n-input v-model:value="newName" placeholder="新标识符名称" />
                    </n-form-item>
                </template>

                <template v-if="selectedOperation === 'generateDocument'">
                    <n-form-item label="作用域：" label-placement="left" :show-feedback="false">
                        <n-input v-model:value="path" placeholder="形如“函数名”、“类名”、“类名.函数名”的格式" />
                    </n-form-item>
                </template>
            </n-card>
            <n-form-item label="API 密钥" label-placement="top" :show-feedback="false">
                <n-input v-model:value="apiKey" />
            </n-form-item>
            <n-form-item label="API 地址" label-placement="top" :show-feedback="false">
                <n-input v-model:value="apiUrl" />
            </n-form-item>
            <n-form-item label="模型名称" label-placement="top" :show-feedback="false">
                <n-input v-model:value="modelName" />
            </n-form-item>
            <n-space align="center">
                <n-switch v-model:value="injectedIsDarkMode" />
                <span>{{ injectedIsDarkMode ? '暗黑模式' : '亮色模式' }}</span>
            </n-space>
        </n-modal>
    </n-layout>
</template>

<script setup lang="ts">
import { ref, watch, inject, type Ref } from 'vue';
import { useMessage } from 'naive-ui';
import { cjToolService, type ApiResponse, type GenerateSignatureData, type RefactorVariableData, type GenerateDocumentData, type FoldConstantData } from './services/cjToolApi';

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

const inputCode = ref<string>(`// Example Code
  interface IExample {
      func doSomething(): String
  }
  class MyClass <: IExample {
      var count = 10 + 5
      func doSomething(): String {
          return "Result is " + count.toString() //确保类型匹配
      }
  }`);
const path = ref<string>('');
const oldName = ref<string>('');
const newName = ref<string>('');
const apiKey = ref<string>('');
const apiUrl = ref<string>('');
const modelName = ref<string>('');

const outputResult = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const showControlsModal = ref<boolean>(false);

// watch(selectedOperation, (newVal, oldVal) => {
//     // 清理特定于旧操作的输入
//     if (oldVal === 'refactorVariable' || oldVal === 'generateDocument') {
//         path.value = '';
//         if (oldVal === 'refactorVariable') {
//             oldName.value = '';
//             newName.value = '';
//         }
//     }
//     outputResult.value = null;
//     errorMessage.value = null;
// });

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
                response = await cjToolService.generateDocument(inputCode.value, path.value);
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
    font-size: 13px;
}

:deep(.n-card__content) {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
</style>