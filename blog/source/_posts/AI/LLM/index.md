---
title: LLM 介绍
date: 2025-11-16 14:00:00
categories:
- ai
tags:
- ai
- LLM
---

模型类型：

- 基础模型，随机初始化权重，没有任何先验知识。
- 预训练模型，需要以**无监督学习**的方式接受**大量原始文本**的训练
  - 非指令模型
  - 指令模型
- 专用模型，针对特定领域，使用**特定数据集**通过迁移学习（transfer learning）训练的模型

<!--more-->

```puml
object "基础模型" as BM {
    随机初始化权重
    ---
}
object "预训练模型" as PTM
object "专用模型" as DM

BM --> PTM: 无监督学习
PTM --> DM: 微调

```

模型包含以下部分：

- architecture，模型的骨架，包含每个层的定义以及模型中发生的每个操作，
一般保存在 `config.json` 文件中。
- checkpoint，模型的权重参数，一般保存在 `model.safetensors` 文件中。

训练方式：

- 无监督学习，根据模型的输入**自动计算**的。这意味着**不需要人工标记数据**。
- 监督学习，需要使用**人工注标记数据**

## Transformer 通用模型架构

LLM 是基于 Transformer 通用模型架构进行构建的语言模型。

有以下部分组成:

- Encoder：编码器接收输入并构建其**表示（特征）**。这意味着模型的使命是从输入中获取理解。
- Decoder：解码器使用编码器的表示（特征）以及其他输入来生成目标序列。这意味着模型的使命是生成输出。

![Transformer 架构](<Transformer 架构.png>)

根据要处理的任务的不同，其模型的组成也不同，又分为几种模型：

- Encoder-only 模型：适用于需要理解输入的任务，如句子分类和命名实体识别。
- Decoder-only 模型：适用于生成任务，如文本生成。
- Encoder-decoder 模型 或者 sequence-to-sequence 模型：适用于需要根据输入进行生成的任务，如翻译或摘要。

![Transformer example](<Transformer example.png>)

实现更好性能的模型的一般策略是增加模型的大小以及预训练的数据量。

### Attention 注意力层

Transformer 模型的一个关键特性是**注意力层**, Transformer 架构的论文的名字就是[Attention Is All You Need](https://arxiv.org/abs/1706.03762)。

这一层将告诉模型在处理每个单词的表示时，对不同单词的重视（忽略）程度。

## Transformer 处理流程

Transformer 提供一个统一的接口来加载、训练和保存任何 Transformer 模型。

其中最基本的对象是 `pipeline()` 函数。它将模型与所需的预处理和后续处理步骤连接起来，使我们能够通过直接输入任何文本并获得最终的结果。

pipeline 集成了三个步骤：**预处理、模型计算和后处理**。

![pipeline flow](<pipeline flow.png>)

### 使用 tokenizer 进行预处理

Transformer 模型无法直接处理原始文本，只接受 `tensor（张量）` 作为输入。
因此管道的第一步是使用 tokenizer 将文本输入转换为模型能够理解的数字。

它将负责以下的几个操作：

- tokenization 分词，将输入拆分为单词、子单词或符号（如标点符号），称为标记(token)
- 通过**词汇表 vocabulary** 将每个 token 映射到一个数字，称为 input ID
- 添加模型需要的其他输入，例如特殊标记（如 [CLS] 和 [SEP] ）
  - 位置编码：指示每个标记在句子中的位置。
  - 段落标记：区分不同段落的文本。
  - 特殊标记：例如 [CLS] 和 [SEP] 标记，用于标识句子的开头和结尾。
- 将 input ID 列表转换为 tensor

需要保证使用**相同的模型**来进行 tokenizer 和模型计算，因为涉及到一些共用的数据：

- input ID 对应的 vocabulary
- padding_id 的 token。
- attention mask
- 特殊 token

tokenization 分词的目标:

1. 找到最有意义的表达方式 —— 即对模型来说**最有意义**的方式
2. 如果可能，还要找到**最简洁**的表达方式。

常用的 tokenization 方法：

- 基于单词（Word-based）
  - CONS: 产生很大的 vocabulary 以及很多的 unknown token
- 基于字符（Character-based），
  - PROS: 相比基于单词的方法，vocabulary 和 unknown token 都要小很多
  - CONS: 字符本身可能并没有多大意义, 还导致模型需要处理大量的 token
- (推荐) 基于子词（subword）
  - 它依赖于一个原则：常用词不应被分解为更小的子词，但罕见词应被分解为有意义的子词。将前缀/后缀也作为子词。
  - PROS: 子词提供大量的语义信息, 并可以通过子词组合可以得到其他有意义的子词。在保持空间效率的同时具有语义意义

#### Padding 以及 attention mask

无法将多个不同长度的 inputs ID 列表直接转换为张量，为了解决这个问题，通常使用**填充输入（Padding）**。在值较少的 inputs ID 列表中添加名为 `padding_id` 的特殊 token 来确保所有的列表长度相同，
然后转为标准长度的张量。

因为 Transformer 模型的关键特性：**注意力层**，它考虑了每个 token 的上下文信息。这具体来说，每个 token 的含义并非单独存在的，它的含义还取决于它在句子中的位置以及周围的其他 tokens。当我们使用填充（padding）来处理长度不同的句子时，我们会添加特殊的“填充 token”来使所有句子达到相同的长度。但是，注意力层会将这些填充 token 也纳入考虑，因为它们会关注序列中的所有 tokens。这就导致了一个问题：尽管填充 token 本身并没有实际的含义，但它们的存在会影响模型对句子的理解。
所以就需要通过使用**注意力掩码（attention mask）层**来告诉注意层需要忽略的填充 token 是哪些。

注意力掩码（attention mask）是与 inputs ID 张量形状完全相同的张量，
用 0 和 1 填充：1 表示应关注相应的 tokens，0 表示应忽略相应的 tokens。

对于 Transformers 模型，我们可以通过模型的序列长度是有限的。
大多数模型处理多达 512 或 1024 个 的 tokens 序列，当使用模型处理更长的序列时，会崩溃。
此问题有两种解决方案：

- 使用支持更长序列长度的模型。
- 截断你的序列，通过设定 max_sequence_length 参数来截断序列

### 使用模型进行计算

![model process flow](model-process-flow.png)

模型由其**嵌入层和后续层**表示。
嵌入层将 tokenize 后输入中的每个 inputs ID 转换为表示关联 token 的向量。
后续层使用**注意机制**操纵这些向量，生成句子的最终表示。

模型对每个输入进行计算，输出一个**高维向量**，代表 Transformer 模型对该输入的上下文理解，
被称为 **hidden states（隐状态）/特征**。

这个高维向量包含三个维度：

- Batch size（批次大小）：一次处理的序列数。
- Sequence length（序列长度）：表示序列（句子）的长度。
- Hidden size（隐藏层大小）：每个模型输入的token的向量维度。

#### 模型头 head

输出包含 `hidden states` 的高维向量会直接发送到**模型头**进行处理。

模型头通常由一个或几个线性层组成，它的输入是隐状态的高维向量，
它会并将其**投影到不同的维度**，所以输出向量的维度会比输入向量的小得多，
一般表示成 `logits（对数几率）`, 它是模型最后一层输出的**原始的、未标准化的分数**。

Transformers 中有许多不同的 architecture，每种 architecture 都是围绕处理特定任务而设计的。
所以要进行模型头的处理，必须根据需求/任务来为模型选择特定的模型头。

常见任务类型的模型的模型头后缀如下：

- *Model （隐状态检索），生成每层 hidden states，不产生 logits
  - 拿 hidden states 做下游任务
  - 构造自己的模型头
  - 表示学习（sentence embedding / token embedding）
  - 分析注意力、内部激活
- *ForCausalLM，自回归语言模型（下一个 token 预测）
  - GPT 风格模型
  - 文本生成、续写
  - 对话模型
  - 代码生成
- *ForMaskedLM，填空式语言模型
  - 预测被掩码的 token
  - 词义建模
- *ForMultipleChoice，选项类任务
  - CommonsenseQA, Social IQA
  - 阅读理解的多选题
  - 逻辑推理题
- *ForQuestionAnswering，抽取式问答（span extraction）
- *ForSequenceClassification，整个句子级别分类
  - 文本情感分类（positive/negative）
  - 新闻分类
  - NLI（文本蕴含）
- *ForTokenClassification，逐 token 分类
  - 命名实体识别（NER）
  - 词性标注（POS tagging）
  - 医疗实体识别
  - Slot Filling
- 其他

### 后处理

由于模型的输出是 logits，是一种原始的、未标准化的分数。
所以要转换为**概率**，还需要经过 `SoftMax 层`进行计算，每个输出中的所有概率之和为 1。

## 微调

TODO

## Reference

- [huggingface LLM 课程](https://huggingface.co/learn/llm-course)
