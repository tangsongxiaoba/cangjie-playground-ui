import type { LanguageFn } from 'highlight.js';

const cangjieLanguage: LanguageFn = (hljs) => {
    return {
        name: 'cangjie',
        aliases: ['cj'],
        case_insensitive: false, // 仓颉语言区分大小写
        keywords: {
            keyword: 'let var abstract break case catch class const continue do else enum extends finally for if implements import interface package private protected public static super synchronized this throw try while return when func type init is as in match from where spawn macro quote foreign prop mut unsafe struct operator overide redef open sealed',
            type: 'Bool Char Int8 Int16 Int32 Int64 UInt8 UInt16 UInt32 UInt64 Float16 Float32 Float64 String IntNative UIntNative Nothing Unit Varray InOut true false',
            built_in: 'escapeSeq'
        },
        contains: [
            // 字符串
            {
                className: 'string',
                variants: [
                    {
                        begin: '#+\\"', end: '\\"#+',
                        contains: [hljs.BACKSLASH_ESCAPE]
                    },
                    {
                        begin: '#+\\"{3}', end: '\\"{3}#+',
                        contains: [hljs.BACKSLASH_ESCAPE]
                    },
                    {
                        begin: '"', end: '"',
                        contains: [hljs.BACKSLASH_ESCAPE]
                    },
                    {
                        begin: '\\"{3}', end: '\\"{3}',
                        contains: [hljs.BACKSLASH_ESCAPE]
                    }
                ]
            },

            // 注释
            hljs.C_LINE_COMMENT_MODE, // 单行注释 //
            hljs.C_BLOCK_COMMENT_MODE, // 多行注释 /* */

            // 数字
            {
                className: 'number',
                variants: [
                    { begin: '\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b' }, // 十六进制
                    { begin: '\\b0[bB][01]+(?:_[01]+)*\\b' }, // 二进制
                    { begin: '\\b\\d+(?:_\\d+)*(?:\\.\\d+(?:_\\d+)*)?(?:[eE][+-]?\\d+(?:_\\d+)*)?[fFL]?\\b' } // 十进制、浮点数
                ]
            },

            // 操作符
            {
                className: 'operator',
                begin: '==?=?|!(?:!|==?)?|\\|\\||\\+[+=>]?|-[-=>]?|<<=|<=|<<|<|>>=|>=|>>|>|&[&=>]?|\\*\\*=|\\*=|[\\/]=?|\\|\\|=|\\|=|[\\^]=?|[%]=?|\\(|\\)|\\}|\\[|\\]|,|\\.\\.\\.|\\.\\.=|\\.\\.|\\.|\\~>|\\~|:|\\*[*]?|\\$\\{|\\$|;|@|\\?[?]|\\?|}|{|#|\\||\\\\'
            },

            // 类名
            {
                className: 'title.class',
                begin: /\b[A-Z][a-zA-Z0-9_]*\b/,
                relevance: 0
            },

            // 内置变量（模板字符串替换）
            {
                className: 'built_in',
                begin: '\\$\\{', end: '\\}',
                relevance: 0
            }
        ]
    };
};

export default cangjieLanguage;
